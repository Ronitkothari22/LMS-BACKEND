"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
class LmsGamificationService {
    async notImplemented() {
        throw new http_exception_1.default(501, 'LMS gamification service not implemented yet');
    }
    async ensureDefaultBadges() {
        const defaults = [
            {
                code: 'LMS_FIRST_LEVEL',
                name: 'First Level Complete',
                description: 'Completed your first LMS level',
                milestoneType: client_1.LmsBadgeMilestoneType.LEVELS_COMPLETED,
                threshold: 1,
            },
            {
                code: 'LMS_THREE_LEVELS',
                name: '3 Level Milestone',
                description: 'Completed 3 LMS levels',
                milestoneType: client_1.LmsBadgeMilestoneType.LEVELS_COMPLETED,
                threshold: 3,
            },
            {
                code: 'LMS_TOPIC_FINISHER',
                name: 'Topic Finisher',
                description: 'Completed your first LMS topic',
                milestoneType: client_1.LmsBadgeMilestoneType.TOPICS_COMPLETED,
                threshold: 1,
            },
            {
                code: 'LMS_XP_100',
                name: '100 XP',
                description: 'Earned 100 LMS XP',
                milestoneType: client_1.LmsBadgeMilestoneType.XP_THRESHOLD,
                threshold: 100,
            },
            {
                code: 'LMS_XP_500',
                name: '500 XP',
                description: 'Earned 500 LMS XP',
                milestoneType: client_1.LmsBadgeMilestoneType.XP_THRESHOLD,
                threshold: 500,
            },
            {
                code: 'LMS_XP_1000',
                name: '1000 XP',
                description: 'Earned 1000 LMS XP',
                milestoneType: client_1.LmsBadgeMilestoneType.XP_THRESHOLD,
                threshold: 1000,
            },
        ];
        for (const badge of defaults) {
            await prisma_1.default.lmsBadge.upsert({
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
    async awardXp(input) {
        if (!input.userId) {
            throw new http_exception_1.default(400, 'User ID is required');
        }
        if (!input.points || input.points <= 0) {
            throw new http_exception_1.default(400, 'XP points must be greater than 0');
        }
        const [entry] = await prisma_1.default.$transaction([
            prisma_1.default.lmsXpLedger.create({
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
            prisma_1.default.user.update({
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
    async evaluateAndAssignBadges(userId, topicId) {
        await this.ensureDefaultBadges();
        const [activeBadges, user, completedLevels, completedTopics] = await Promise.all([
            prisma_1.default.lmsBadge.findMany({ where: { isActive: true } }),
            prisma_1.default.user.findUnique({ where: { id: userId }, select: { xpPoints: true } }),
            prisma_1.default.lmsUserLevelProgress.count({
                where: {
                    userId,
                    status: 'COMPLETED',
                },
            }),
            prisma_1.default.lmsUserTopicProgress.count({
                where: {
                    userId,
                    status: 'COMPLETED',
                },
            }),
        ]);
        if (!user) {
            throw new http_exception_1.default(404, 'User not found');
        }
        const existing = await prisma_1.default.lmsUserBadge.findMany({
            where: { userId },
            select: { badgeId: true },
        });
        const existingIds = new Set(existing.map(item => item.badgeId));
        const toAward = activeBadges.filter(badge => {
            var _a;
            if (existingIds.has(badge.id))
                return false;
            const threshold = (_a = badge.threshold) !== null && _a !== void 0 ? _a : 0;
            switch (badge.milestoneType) {
                case client_1.LmsBadgeMilestoneType.LEVELS_COMPLETED:
                    return completedLevels >= threshold;
                case client_1.LmsBadgeMilestoneType.TOPICS_COMPLETED:
                    return completedTopics >= threshold;
                case client_1.LmsBadgeMilestoneType.XP_THRESHOLD:
                    return user.xpPoints >= threshold;
                case client_1.LmsBadgeMilestoneType.STREAK:
                    return completedLevels >= threshold;
                case client_1.LmsBadgeMilestoneType.CUSTOM:
                    return false;
                default:
                    return false;
            }
        });
        if (toAward.length === 0)
            return [];
        await prisma_1.default.lmsUserBadge.createMany({
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
        const grouped = await prisma_1.default.lmsXpLedger.groupBy({
            by: ['userId'],
            _sum: { pointsDelta: true },
            _max: { createdAt: true },
            orderBy: { _sum: { pointsDelta: 'desc' } },
            take: safeLimit,
        });
        const userIds = grouped.map(item => item.userId);
        const users = userIds.length
            ? await prisma_1.default.user.findMany({
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
        await prisma_1.default.lmsLeaderboardSnapshot.create({
            data: {
                scope: client_1.LmsLeaderboardScope.GLOBAL,
                rankings,
            },
        });
        return rankings;
    }
    async getTopicLeaderboard(topicId, limit = 50) {
        const topic = await prisma_1.default.lmsTopic.findUnique({
            where: { id: topicId },
            select: { id: true, title: true },
        });
        if (!topic) {
            throw new http_exception_1.default(404, 'LMS topic not found');
        }
        const safeLimit = Math.max(1, Math.min(limit, 200));
        const grouped = await prisma_1.default.lmsXpLedger.groupBy({
            by: ['userId'],
            where: { topicId },
            _sum: { pointsDelta: true },
            _max: { createdAt: true },
            orderBy: { _sum: { pointsDelta: 'desc' } },
            take: safeLimit,
        });
        const userIds = grouped.map(item => item.userId);
        const users = userIds.length
            ? await prisma_1.default.user.findMany({
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
        await prisma_1.default.lmsLeaderboardSnapshot.create({
            data: {
                scope: client_1.LmsLeaderboardScope.TOPIC,
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
exports.default = new LmsGamificationService();
//# sourceMappingURL=lms-gamification.service.js.map