"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lms_progress_service_1 = __importDefault(require("../services/lms-progress.service"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const lms_gamification_service_1 = __importDefault(require("../services/lms-gamification.service"));
jest.mock('../services/lms-gamification.service', () => ({
    __esModule: true,
    default: {
        awardXp: jest.fn(),
    },
}));
jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        lmsTopic: { findFirst: jest.fn() },
        lmsLevel: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
        lmsUserLevelProgress: {
            upsert: jest.fn(),
            findUnique: jest.fn(),
            updateMany: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        lmsUserTopicProgress: { upsert: jest.fn(), findUnique: jest.fn() },
        lmsXpLedger: { count: jest.fn() },
        $transaction: jest.fn(),
    },
}));
describe('lms-progress.service race safety', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('does not award level completion XP when completion write is not first (count=0)', async () => {
        prisma_1.default.lmsLevel.findFirst.mockResolvedValue({
            id: 'level1',
            topicId: 'topic1',
            position: 1,
            isPublished: true,
            topic: { levels: [{ id: 'level1', position: 1 }] },
            requireVideoCompletion: false,
            minVideoWatchPercent: 0,
            requireQuizPass: false,
            quizPassingPercent: 0,
            xpOnCompletion: 25,
        });
        prisma_1.default.lmsTopic.findFirst.mockResolvedValue({
            id: 'topic1',
            isActive: true,
            isPublished: true,
            levels: [{ id: 'level1', position: 1 }],
        });
        prisma_1.default.lmsUserLevelProgress.upsert.mockResolvedValue({});
        prisma_1.default.lmsUserTopicProgress.upsert.mockResolvedValue({
            status: 'IN_PROGRESS',
            completedLevels: 0,
            totalLevels: 1,
        });
        prisma_1.default.lmsUserLevelProgress.findUnique
            .mockResolvedValueOnce({
            userId: 'user1',
            levelId: 'level1',
            status: 'IN_PROGRESS',
            completedAt: null,
            startedAt: new Date('2026-01-01'),
            watchPercent: 100,
            latestScorePercent: 100,
        })
            .mockResolvedValueOnce({ watchPercent: 100, latestScorePercent: 100 });
        prisma_1.default.lmsUserTopicProgress.findUnique.mockResolvedValue({ status: 'IN_PROGRESS' });
        prisma_1.default.lmsLevel.findUnique.mockResolvedValue({
            id: 'level1',
            requireVideoCompletion: false,
            minVideoWatchPercent: 0,
            requireQuizPass: false,
            quizPassingPercent: 0,
        });
        prisma_1.default.lmsLevel.findMany.mockResolvedValue([{ id: 'level1' }]);
        prisma_1.default.lmsUserLevelProgress.count.mockResolvedValue(0);
        prisma_1.default.$transaction.mockImplementation(async (cb) => {
            if (typeof cb === 'function') {
                return cb({
                    lmsUserLevelProgress: {
                        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
                        findUnique: jest.fn().mockResolvedValue({
                            userId: 'user1',
                            levelId: 'level1',
                            status: 'COMPLETED',
                            completedAt: new Date('2026-01-01'),
                        }),
                        upsert: jest.fn().mockResolvedValue({}),
                    },
                    lmsLevel: {
                        findFirst: jest.fn().mockResolvedValue(null),
                    },
                });
            }
            return [];
        });
        await lms_progress_service_1.default.completeLevel('user1', 'level1', false);
        expect(lms_gamification_service_1.default.awardXp).not.toHaveBeenCalled();
    });
    it('unlocks next level and awards XP on first completion', async () => {
        prisma_1.default.lmsLevel.findFirst.mockResolvedValue({
            id: 'level1',
            topicId: 'topic1',
            position: 1,
            isPublished: true,
            topic: { levels: [{ id: 'level1', position: 1 }, { id: 'level2', position: 2 }] },
            requireVideoCompletion: false,
            minVideoWatchPercent: 0,
            requireQuizPass: false,
            quizPassingPercent: 0,
            xpOnCompletion: 25,
        });
        prisma_1.default.lmsTopic.findFirst.mockResolvedValue({
            id: 'topic1',
            isActive: true,
            isPublished: true,
            levels: [{ id: 'level1', position: 1 }, { id: 'level2', position: 2 }],
        });
        prisma_1.default.lmsUserLevelProgress.upsert.mockResolvedValue({});
        prisma_1.default.lmsUserTopicProgress.upsert.mockResolvedValue({
            status: 'IN_PROGRESS',
            completedLevels: 0,
            totalLevels: 2,
        });
        prisma_1.default.lmsUserLevelProgress.findUnique
            .mockResolvedValueOnce({
            userId: 'user1',
            levelId: 'level1',
            status: 'IN_PROGRESS',
            completedAt: null,
            startedAt: new Date('2026-01-01'),
            watchPercent: 100,
            latestScorePercent: 100,
        })
            .mockResolvedValueOnce({ watchPercent: 100, latestScorePercent: 100 });
        prisma_1.default.lmsUserTopicProgress.findUnique.mockResolvedValue({ status: 'IN_PROGRESS' });
        prisma_1.default.lmsXpLedger.count.mockResolvedValue(0);
        prisma_1.default.lmsLevel.findUnique.mockResolvedValue({
            id: 'level1',
            requireVideoCompletion: false,
            minVideoWatchPercent: 0,
            requireQuizPass: false,
            quizPassingPercent: 0,
        });
        prisma_1.default.lmsLevel.findMany.mockResolvedValue([{ id: 'level1' }, { id: 'level2' }]);
        prisma_1.default.lmsUserLevelProgress.count.mockResolvedValue(1);
        prisma_1.default.$transaction.mockImplementation(async (cb) => {
            if (typeof cb === 'function') {
                return cb({
                    lmsUserLevelProgress: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue({
                            userId: 'user1',
                            levelId: 'level1',
                            status: 'COMPLETED',
                            completedAt: new Date('2026-01-02'),
                        }),
                        upsert: jest.fn().mockResolvedValue({}),
                    },
                    lmsLevel: {
                        findFirst: jest.fn().mockResolvedValue({ id: 'level2' }),
                    },
                });
            }
            return [];
        });
        await lms_progress_service_1.default.completeLevel('user1', 'level1', false);
        expect(lms_gamification_service_1.default.awardXp).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user1',
            levelId: 'level1',
            points: 25,
        }));
    });
});
//# sourceMappingURL=lms-progress.race.test.js.map