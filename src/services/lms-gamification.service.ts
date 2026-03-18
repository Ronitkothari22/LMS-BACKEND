import HttpException from '../utils/http-exception';
import prisma from '../lib/prisma';
import { LmsBadgeMilestoneType, LmsLeaderboardScope, LmsXpEventType } from '@prisma/client';
import { Prisma } from '@prisma/client';

interface AwardXpInput {
  userId: string;
  eventType: LmsXpEventType;
  points: number;
  topicId?: string;
  levelId?: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}

class LmsGamificationService {
  async notImplemented(): Promise<never> {
    throw new HttpException(501, 'LMS gamification service not implemented yet');
  }

  private async ensureDefaultBadges() {
    const defaults = [
      {
        code: 'LMS_FIRST_LEVEL',
        name: 'First Level Complete',
        description: 'Completed your first LMS level',
        milestoneType: LmsBadgeMilestoneType.LEVELS_COMPLETED,
        threshold: 1,
      },
      {
        code: 'LMS_THREE_LEVELS',
        name: '3 Level Milestone',
        description: 'Completed 3 LMS levels',
        milestoneType: LmsBadgeMilestoneType.LEVELS_COMPLETED,
        threshold: 3,
      },
      {
        code: 'LMS_TOPIC_FINISHER',
        name: 'Topic Finisher',
        description: 'Completed your first LMS topic',
        milestoneType: LmsBadgeMilestoneType.TOPICS_COMPLETED,
        threshold: 1,
      },
      {
        code: 'LMS_XP_100',
        name: '100 XP',
        description: 'Earned 100 LMS XP',
        milestoneType: LmsBadgeMilestoneType.XP_THRESHOLD,
        threshold: 100,
      },
      {
        code: 'LMS_XP_500',
        name: '500 XP',
        description: 'Earned 500 LMS XP',
        milestoneType: LmsBadgeMilestoneType.XP_THRESHOLD,
        threshold: 500,
      },
      {
        code: 'LMS_XP_1000',
        name: '1000 XP',
        description: 'Earned 1000 LMS XP',
        milestoneType: LmsBadgeMilestoneType.XP_THRESHOLD,
        threshold: 1000,
      },
    ];

    for (const badge of defaults) {
      await prisma.lmsBadge.upsert({
        where: { code: badge.code },
        update: {
          name: badge.name,
          description: badge.description,
          milestoneType: badge.milestoneType,
          threshold: badge.threshold,
          isActive: true,
        },
        create: badge,
      });
    }
  }

  async awardXp(input: AwardXpInput) {
    if (!input.userId) {
      throw new HttpException(400, 'User ID is required');
    }
    if (!input.points || input.points <= 0) {
      throw new HttpException(400, 'XP points must be greater than 0');
    }

    const [entry] = await prisma.$transaction([
      prisma.lmsXpLedger.create({
        data: {
          userId: input.userId,
          eventType: input.eventType,
          pointsDelta: input.points,
          topicId: input.topicId,
          levelId: input.levelId,
          reason: input.reason,
          metadata: input.metadata,
        },
      }),
      prisma.user.update({
        where: { id: input.userId },
        data: {
          xpPoints: {
            increment: input.points,
          },
        },
      }),
    ]);

    const badges = await this.evaluateAndAssignBadges(input.userId, input.topicId);
    return { entry, badgesAwarded: badges };
  }

  async evaluateAndAssignBadges(userId: string, topicId?: string) {
    await this.ensureDefaultBadges();

    const [activeBadges, user, completedLevels, completedTopics] = await Promise.all([
      prisma.lmsBadge.findMany({ where: { isActive: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { xpPoints: true } }),
      prisma.lmsUserLevelProgress.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),
      prisma.lmsUserTopicProgress.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),
    ]);

    if (!user) {
      throw new HttpException(404, 'User not found');
    }

    const existing = await prisma.lmsUserBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const existingIds = new Set(existing.map(item => item.badgeId));

    const toAward = activeBadges.filter(badge => {
      if (existingIds.has(badge.id)) return false;
      const threshold = badge.threshold ?? 0;

      switch (badge.milestoneType) {
        case LmsBadgeMilestoneType.LEVELS_COMPLETED:
          return completedLevels >= threshold;
        case LmsBadgeMilestoneType.TOPICS_COMPLETED:
          return completedTopics >= threshold;
        case LmsBadgeMilestoneType.XP_THRESHOLD:
          return user.xpPoints >= threshold;
        case LmsBadgeMilestoneType.STREAK:
          // For now we approximate streak with completed level count threshold.
          return completedLevels >= threshold;
        case LmsBadgeMilestoneType.CUSTOM:
          return false;
        default:
          return false;
      }
    });

    if (toAward.length === 0) return [];

    await prisma.lmsUserBadge.createMany({
      data: toAward.map(badge => ({
        userId,
        badgeId: badge.id,
        topicId: topicId || null,
      })),
      skipDuplicates: true,
    });

    return toAward;
  }

  async getGlobalLeaderboard(limit = 50) {
    const safeLimit = Math.max(1, Math.min(limit, 200));

    const grouped = await prisma.lmsXpLedger.groupBy({
      by: ['userId'],
      _sum: { pointsDelta: true },
      _max: { createdAt: true },
      orderBy: { _sum: { pointsDelta: 'desc' } },
      take: safeLimit,
    });

    const userIds = grouped.map(item => item.userId);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            xpPoints: true,
          },
        })
      : [];
    const userMap = new Map(users.map(user => [user.id, user]));

    const rankings = grouped.map((row, index) => ({
      rank: index + 1,
      user: userMap.get(row.userId) || null,
      lmsXp: row._sum.pointsDelta || 0,
      lastActivityAt: row._max.createdAt || null,
    }));

    await prisma.lmsLeaderboardSnapshot.create({
      data: {
        scope: LmsLeaderboardScope.GLOBAL,
        rankings,
      },
    });

    return rankings;
  }

  async getTopicLeaderboard(topicId: string, limit = 50) {
    const topic = await prisma.lmsTopic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true },
    });
    if (!topic) {
      throw new HttpException(404, 'LMS topic not found');
    }

    const safeLimit = Math.max(1, Math.min(limit, 200));
    const grouped = await prisma.lmsXpLedger.groupBy({
      by: ['userId'],
      where: { topicId },
      _sum: { pointsDelta: true },
      _max: { createdAt: true },
      orderBy: { _sum: { pointsDelta: 'desc' } },
      take: safeLimit,
    });

    const userIds = grouped.map(item => item.userId);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            xpPoints: true,
          },
        })
      : [];
    const userMap = new Map(users.map(user => [user.id, user]));

    const rankings = grouped.map((row, index) => ({
      rank: index + 1,
      user: userMap.get(row.userId) || null,
      topicXp: row._sum.pointsDelta || 0,
      lastActivityAt: row._max.createdAt || null,
    }));

    await prisma.lmsLeaderboardSnapshot.create({
      data: {
        scope: LmsLeaderboardScope.TOPIC,
        topicId,
        rankings,
      },
    });

    return {
      topic,
      rankings,
    };
  }
}

export default new LmsGamificationService();
