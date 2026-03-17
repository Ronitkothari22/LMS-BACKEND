import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.config';

const prisma = new PrismaClient();

/**
 * Get dashboard data for the authenticated user
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        belt: true,
        xpPoints: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Get all quiz responses for the user with quiz details
    const userQuizResponses = await prisma.quizResponse.findMany({
      where: { userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Calculate highest quiz score (use totalScore if score is null)
    const highestQuizScore = await prisma.quizResponse.findFirst({
      where: {
        userId,
        completedAt: { not: null },
        OR: [{ score: { not: null } }, { totalScore: { not: null } }],
      },
      orderBy: [{ score: 'desc' }, { totalScore: 'desc' }],
      select: {
        score: true,
        totalScore: true,
        quiz: {
          select: {
            title: true,
          },
        },
      },
    });

    // Get user's sessions (as participant or invited)
    const userSessions = await prisma.session.findMany({
      where: {
        OR: [{ participants: { some: { id: userId } } }, { invited: { some: { id: userId } } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get upcoming sessions
    const upcomingSessions = await prisma.session.findMany({
      where: {
        AND: [
          {
            OR: [{ participants: { some: { id: userId } } }, { invited: { some: { id: userId } } }],
          },
          { startTime: { gt: new Date() } },
          { state: { in: ['UPCOMING', 'IN_PROGRESS'] } },
        ],
      },
      orderBy: { startTime: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        joiningCode: true,
      },
    });

    // Get top performers by calculating average quiz scores (using totalScore if score is null)
    const topPerformersRaw = await prisma.quizResponse.groupBy({
      by: ['userId'],
      _avg: {
        score: true,
        totalScore: true,
      },
      _count: {
        id: true,
      },
      where: {
        completedAt: { not: null },
        OR: [{ score: { not: null } }, { totalScore: { not: null } }],
      },
      orderBy: [
        {
          _avg: {
            score: 'desc',
          },
        },
        {
          _avg: {
            totalScore: 'desc',
          },
        },
      ],
      take: 10,
    });

    // Get user details for top performers
    const topPerformerIds = topPerformersRaw.map(performer => performer.userId);
    const topPerformerUsers = await prisma.user.findMany({
      where: {
        id: { in: topPerformerIds },
      },
      select: {
        id: true,
        name: true,
        belt: true,
      },
    });

    // Calculate daily streak using Prisma queries instead of raw SQL
    // Get quiz completion dates
    const quizActivities = await prisma.quizResponse.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      select: {
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    // Get activity log dates
    const activityLogs = await prisma.activityLog.findMany({
      where: { userId },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Combine all activity dates
    const allActivities = [
      ...quizActivities.map(q => q.completedAt!),
      ...activityLogs.map(a => a.createdAt),
    ];

    // Extract unique dates and sort
    const uniqueActivityDates = Array.from(
      new Set(
        allActivities.map(date => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }),
      ),
    ).sort((a, b) => b - a); // Sort descending (newest first)

    // Calculate daily streak
    let dailyStreak = 0;
    if (uniqueActivityDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = new Date(today);
      let consecutiveDays = true;

      while (consecutiveDays && dailyStreak < 365) {
        // Max 365 days check
        const currentDateTimeStamp = currentDate.getTime();
        const hasActivity = uniqueActivityDates.includes(currentDateTimeStamp);

        if (hasActivity) {
          dailyStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          consecutiveDays = false;
        }
      }
    }

    // Calculate course progress based on user's sessions
    const completedSessions = userSessions.filter(s => s.state === 'COMPLETED').length;
    const totalUserSessions = userSessions.length;
    const courseProgressPercentage =
      totalUserSessions > 0 ? Math.round((completedSessions / totalUserSessions) * 100) : 0;

    // Format top performers
    const formattedTopPerformers = topPerformersRaw.map(performer => {
      const userDetails = topPerformerUsers.find(u => u.id === performer.userId);
      // Use score if available, otherwise use totalScore
      const avgScore = performer._avg.score || performer._avg.totalScore || 0;
      return {
        userId: performer.userId,
        name: userDetails?.name || 'Unknown User',
        score: Math.round(avgScore),
        belt: userDetails?.belt || 'WHITE',
      };
    });

    // Create the dashboard response matching the exact format requested
    const dashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        belt: user.belt,
        xpPoints: user.xpPoints,
      },
      quizScores: userQuizResponses
        .filter(
          response =>
            response.completedAt && (response.score !== null || response.totalScore !== null),
        )
        .map(response => ({
          quizId: response.quiz.id,
          quizTitle: response.quiz.title,
          score: response.score || response.totalScore || 0,
          totalMarks: response.quiz.totalMarks || 100,
          completedAt: response.completedAt,
        })),
      courseProgress: {
        percentage: courseProgressPercentage,
        completedSessions: completedSessions,
        totalSessions: totalUserSessions,
      },
      dailyStreak: dailyStreak,
      highestQuizScore: highestQuizScore
        ? {
            score: highestQuizScore.score || highestQuizScore.totalScore || 0,
            quizTitle: highestQuizScore.quiz.title,
          }
        : {
            score: 0,
            quizTitle: 'No quizzes completed yet',
          },
      topPerformers: formattedTopPerformers,
      upcomingSessions: upcomingSessions.map(session => ({
        id: session.id,
        title: session.title,
        description: session.description || '',
        startTime: session.startTime,
        endTime: session.endTime,
        joiningCode: session.joiningCode,
      })),
    };

    // Log activity for dashboard view
    try {
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: 'dashboard_viewed',
          details: 'User viewed dashboard',
        },
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      logger.warn('Failed to log dashboard activity:', logError);
    }

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
