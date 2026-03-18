import HttpException from '../utils/http-exception';
import prisma from '../lib/prisma';
import { LmsException } from '../utils/lms-error';
import { LmsErrorCode } from '../types/lms-error.types';

class LmsAnalyticsService {
  async notImplemented(): Promise<never> {
    throw new HttpException(501, 'LMS analytics service not implemented yet');
  }

  async getTopicAnalytics(topicId: string) {
    const topic = await prisma.lmsTopic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true, createdAt: true },
    });

    if (!topic) {
      throw new LmsException(404, LmsErrorCode.TOPIC_NOT_FOUND, 'LMS topic not found', { topicId });
    }

    const levels = await prisma.lmsLevel.findMany({
      where: { topicId },
      select: { id: true },
    });
    const levelIds = levels.map(level => level.id);

    const [topicProgressRows, levelProgressRows, attempts] = await Promise.all([
      prisma.lmsUserTopicProgress.findMany({
        where: { topicId },
        select: {
          userId: true,
          completionPercent: true,
          completedAt: true,
          timeSpentSeconds: true,
        },
      }),
      levelIds.length
        ? prisma.lmsUserLevelProgress.findMany({
            where: { levelId: { in: levelIds } },
            select: {
              userId: true,
              levelId: true,
              status: true,
              latestScorePercent: true,
              totalAttempts: true,
              successfulAttempts: true,
              timeSpentSeconds: true,
            },
          })
        : [],
      levelIds.length
        ? prisma.lmsLevelAttempt.findMany({
            where: { levelId: { in: levelIds } },
            select: {
              userId: true,
              status: true,
              scorePercent: true,
              timeSpentSeconds: true,
            },
          })
        : [],
    ]);

    const enrolledUsers = new Set(topicProgressRows.map(row => row.userId)).size;
    const completedUsers = topicProgressRows.filter(row => row.completedAt !== null).length;
    const averageTopicCompletionPercent =
      topicProgressRows.length === 0
        ? 0
        : Number(
            (
              topicProgressRows.reduce((sum, row) => sum + row.completionPercent, 0) /
              topicProgressRows.length
            ).toFixed(2),
          );
    const totalTopicTimeSpentSeconds = topicProgressRows.reduce(
      (sum, row) => sum + row.timeSpentSeconds,
      0,
    );
    const averageTopicTimeSpentSeconds =
      topicProgressRows.length === 0
        ? 0
        : Number((totalTopicTimeSpentSeconds / topicProgressRows.length).toFixed(2));

    const passAttempts = attempts.filter(attempt => attempt.status === 'PASSED').length;
    const failAttempts = attempts.filter(attempt => attempt.status === 'FAILED').length;
    const averageAttemptScore =
      attempts.length === 0
        ? 0
        : Number(
            (
              attempts.reduce((sum, attempt) => sum + (attempt.scorePercent || 0), 0) /
              attempts.length
            ).toFixed(2),
          );

    const levelCompletionMap = new Map<string, { completed: number; total: number }>();
    for (const row of levelProgressRows) {
      const current = levelCompletionMap.get(row.levelId) || { completed: 0, total: 0 };
      current.total += 1;
      if (row.status === 'COMPLETED') current.completed += 1;
      levelCompletionMap.set(row.levelId, current);
    }

    return {
      topic,
      summary: {
        totalLevels: levels.length,
        enrolledUsers,
        completedUsers,
        completionRate: enrolledUsers === 0 ? 0 : Number(((completedUsers / enrolledUsers) * 100).toFixed(2)),
        averageTopicCompletionPercent,
        totalTopicTimeSpentSeconds,
        averageTopicTimeSpentSeconds,
        totalAttempts: attempts.length,
        passAttempts,
        failAttempts,
        passRate: attempts.length === 0 ? 0 : Number(((passAttempts / attempts.length) * 100).toFixed(2)),
        averageAttemptScore,
      },
      levelBreakdown: Array.from(levelCompletionMap.entries()).map(([levelId, data]) => ({
        levelId,
        completedUsers: data.completed,
        totalUsers: data.total,
        completionRate: data.total === 0 ? 0 : Number(((data.completed / data.total) * 100).toFixed(2)),
      })),
    };
  }

  async getVideoAnalytics(contentId: string) {
    const content = await prisma.lmsLevelContent.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        title: true,
        type: true,
        levelId: true,
        level: {
          select: {
            id: true,
            title: true,
            topic: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!content) {
      throw new LmsException(404, LmsErrorCode.CONTENT_NOT_FOUND, 'LMS content not found', {
        contentId,
      });
    }

    const events = await prisma.lmsVideoWatchEvent.findMany({
      where: { contentId },
      select: {
        userId: true,
        eventType: true,
        watchSeconds: true,
        watchPercent: true,
        videoPositionSeconds: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalEvents = events.length;
    const uniqueViewers = new Set(events.map(event => event.userId)).size;
    const completeEvents = events.filter(event => event.eventType === 'COMPLETE').length;
    const averageWatchPercent =
      totalEvents === 0
        ? 0
        : Number((events.reduce((sum, event) => sum + event.watchPercent, 0) / totalEvents).toFixed(2));
    const totalWatchSeconds = events.reduce((sum, event) => sum + event.watchSeconds, 0);

    const viewerMap = new Map<string, { totalWatchSeconds: number; maxWatchPercent: number }>();
    for (const event of events) {
      const existing = viewerMap.get(event.userId) || { totalWatchSeconds: 0, maxWatchPercent: 0 };
      existing.totalWatchSeconds += event.watchSeconds;
      existing.maxWatchPercent = Math.max(existing.maxWatchPercent, event.watchPercent);
      viewerMap.set(event.userId, existing);
    }
    const viewerStats = Array.from(viewerMap.entries()).map(([userId, stats]) => ({
      userId,
      totalWatchSeconds: stats.totalWatchSeconds,
      maxWatchPercent: Number(stats.maxWatchPercent.toFixed(2)),
    }));

    return {
      content,
      summary: {
        totalEvents,
        uniqueViewers,
        completeEvents,
        completionEventRate:
          totalEvents === 0 ? 0 : Number(((completeEvents / totalEvents) * 100).toFixed(2)),
        averageWatchPercent,
        totalWatchSeconds,
      },
      viewers: viewerStats,
    };
  }

  async getLevelAttemptAnalytics(levelId: string) {
    const level = await prisma.lmsLevel.findUnique({
      where: { id: levelId },
      select: {
        id: true,
        title: true,
        topicId: true,
        topic: {
          select: { id: true, title: true },
        },
      },
    });

    if (!level) {
      throw new LmsException(404, LmsErrorCode.LEVEL_NOT_FOUND, 'LMS level not found', { levelId });
    }

    const attempts = await prisma.lmsLevelAttempt.findMany({
      where: { levelId },
      select: {
        id: true,
        userId: true,
        status: true,
        scorePercent: true,
        attemptNumber: true,
        timeSpentSeconds: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    const totalAttempts = attempts.length;
    const passAttempts = attempts.filter(attempt => attempt.status === 'PASSED').length;
    const failAttempts = attempts.filter(attempt => attempt.status === 'FAILED').length;
    const averageScore =
      totalAttempts === 0
        ? 0
        : Number(
            (
              attempts.reduce((sum, attempt) => sum + (attempt.scorePercent || 0), 0) /
              totalAttempts
            ).toFixed(2),
          );
    const averageTimeSpentSeconds =
      totalAttempts === 0
        ? 0
        : Number(
            (attempts.reduce((sum, attempt) => sum + attempt.timeSpentSeconds, 0) / totalAttempts).toFixed(2),
          );

    return {
      level,
      summary: {
        totalAttempts,
        passAttempts,
        failAttempts,
        passRate: totalAttempts === 0 ? 0 : Number(((passAttempts / totalAttempts) * 100).toFixed(2)),
        averageScore,
        averageTimeSpentSeconds,
      },
      attempts,
    };
  }
}

export default new LmsAnalyticsService();
