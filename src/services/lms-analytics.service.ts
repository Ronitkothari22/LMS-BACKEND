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
      select: {
        id: true,
        title: true,
        visibility: true,
        sessionId: true,
        createdAt: true,
        sessionAssignments: {
          select: {
            sessionId: true,
            session: {
              select: {
                id: true,
                title: true,
                isActive: true,
                participants: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
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
          status: true,
          completionPercent: true,
          completedLevels: true,
          totalLevels: true,
          startedAt: true,
          completedAt: true,
          timeSpentSeconds: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              sessionsParticipated: {
                select: {
                  id: true,
                },
              },
            },
          },
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
              completedAt: true,
              updatedAt: true,
              level: {
                select: {
                  id: true,
                  title: true,
                  sessionId: true,
                },
              },
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

    const userAnalyticsMap = new Map<
      string,
      {
        user: {
          id: string;
          name: string;
          email: string;
        };
        sessionIds: string[];
        status: string;
        completionPercent: number;
        completedLevels: number;
        totalLevels: number;
        startedAt: Date | null;
        completedAt: Date | null;
        timeSpentSeconds: number;
        totalAttempts: number;
        successfulAttempts: number;
        averageScore: number;
        latestScore: number | null;
        levels: Array<{
          levelId: string;
          levelTitle: string;
          sessionId: string | null;
          status: string;
          latestScorePercent: number | null;
          totalAttempts: number;
          successfulAttempts: number;
          timeSpentSeconds: number;
          completedAt: Date | null;
          updatedAt: Date;
        }>;
      }
    >();

    for (const row of topicProgressRows) {
      userAnalyticsMap.set(row.userId, {
        user: {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
        },
        sessionIds: row.user.sessionsParticipated.map(session => session.id),
        status: row.status,
        completionPercent: Number((row.completionPercent || 0).toFixed(2)),
        completedLevels: row.completedLevels || 0,
        totalLevels: row.totalLevels || levels.length,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        timeSpentSeconds: row.timeSpentSeconds || 0,
        totalAttempts: 0,
        successfulAttempts: 0,
        averageScore: 0,
        latestScore: null,
        levels: [],
      });
    }

    for (const row of levelProgressRows) {
      const existing = userAnalyticsMap.get(row.userId);
      if (!existing) continue;
      existing.totalAttempts += row.totalAttempts || 0;
      existing.successfulAttempts += row.successfulAttempts || 0;
      existing.levels.push({
        levelId: row.levelId,
        levelTitle: row.level.title,
        sessionId: row.level.sessionId || null,
        status: row.status,
        latestScorePercent: row.latestScorePercent ?? null,
        totalAttempts: row.totalAttempts || 0,
        successfulAttempts: row.successfulAttempts || 0,
        timeSpentSeconds: row.timeSpentSeconds || 0,
        completedAt: row.completedAt,
        updatedAt: row.updatedAt,
      });
    }

    for (const value of userAnalyticsMap.values()) {
      const scores = value.levels
        .map(level => level.latestScorePercent)
        .filter((score): score is number => typeof score === 'number');
      value.averageScore =
        scores.length === 0
          ? 0
          : Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
      const latestLevelByUpdate = value.levels
        .slice()
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      value.latestScore = latestLevelByUpdate?.latestScorePercent ?? null;
      value.levels = value.levels
        .slice()
        .sort((a, b) => a.levelTitle.localeCompare(b.levelTitle))
        .map(level => ({
          ...level,
          updatedAt: level.updatedAt,
        }));
    }

    const enrolledUsersList = Array.from(userAnalyticsMap.values())
      .sort((a, b) => a.user.name.localeCompare(b.user.name))
      .map(user => ({
        ...user,
        levels: user.levels.map(level => {
          const { updatedAt, ...rest } = level;
          void updatedAt;
          return rest;
        }),
      }));

    const assignedSessionsFromTopic = (topic.sessionAssignments || [])
      .map(assignment => assignment.session)
      .filter(Boolean);
    const assignedSessionIds = Array.from(
      new Set([
        ...(topic.sessionId ? [topic.sessionId] : []),
        ...assignedSessionsFromTopic.map(session => session.id),
      ]),
    );

    const missingSessionIds = assignedSessionIds.filter(
      sessionId => !assignedSessionsFromTopic.some(session => session.id === sessionId),
    );

    const fallbackSessions = missingSessionIds.length
      ? await prisma.session.findMany({
          where: { id: { in: missingSessionIds } },
          select: {
            id: true,
            title: true,
            isActive: true,
            participants: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      : [];

    const assignedSessions = [...assignedSessionsFromTopic, ...fallbackSessions]
      .filter((session, index, arr) => arr.findIndex(other => other.id === session.id) === index)
      .map(session => ({
        id: session.id,
        title: session.title,
        isActive: session.isActive,
        participantIds: new Set(session.participants.map(participant => participant.id)),
      }));

    const sessionBreakdown =
      topic.visibility === 'SESSION'
        ? assignedSessions.map(session => {
            const sessionUsers = enrolledUsersList.filter(user => user.sessionIds.includes(session.id));
            const sessionCompletedUsers = sessionUsers.filter(user => user.completedAt !== null).length;
            const sessionAverageScore =
              sessionUsers.length === 0
                ? 0
                : Number(
                    (
                      sessionUsers.reduce((sum, user) => sum + (user.averageScore || 0), 0) /
                      sessionUsers.length
                    ).toFixed(2),
                  );

            return {
              session: {
                id: session.id,
                title: session.title,
                isActive: session.isActive,
                totalParticipants: session.participantIds.size,
              },
              summary: {
                enrolledUsers: sessionUsers.length,
                completedUsers: sessionCompletedUsers,
                completionRate:
                  sessionUsers.length === 0
                    ? 0
                    : Number(((sessionCompletedUsers / sessionUsers.length) * 100).toFixed(2)),
                averageScore: sessionAverageScore,
              },
              users: sessionUsers,
            };
          })
        : [];

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
      users: enrolledUsersList,
      sessionBreakdown,
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
