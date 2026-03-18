import lmsProgressService from '../services/lms-progress.service';
import prisma from '../lib/prisma';
import lmsGamificationService from '../services/lms-gamification.service';

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
    (prisma.lmsLevel.findFirst as jest.Mock).mockResolvedValue({
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

    (prisma.lmsTopic.findFirst as jest.Mock).mockResolvedValue({
      id: 'topic1',
      isActive: true,
      isPublished: true,
      levels: [{ id: 'level1', position: 1 }],
    });

    (prisma.lmsUserLevelProgress.upsert as jest.Mock).mockResolvedValue({});
    (prisma.lmsUserTopicProgress.upsert as jest.Mock).mockResolvedValue({
      status: 'IN_PROGRESS',
      completedLevels: 0,
      totalLevels: 1,
    });

    (prisma.lmsUserLevelProgress.findUnique as jest.Mock)
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

    (prisma.lmsUserTopicProgress.findUnique as jest.Mock).mockResolvedValue({ status: 'IN_PROGRESS' });

    (prisma.lmsLevel.findUnique as jest.Mock).mockResolvedValue({
      id: 'level1',
      requireVideoCompletion: false,
      minVideoWatchPercent: 0,
      requireQuizPass: false,
      quizPassingPercent: 0,
    });

    (prisma.lmsLevel.findMany as jest.Mock).mockResolvedValue([{ id: 'level1' }]);
    (prisma.lmsUserLevelProgress.count as jest.Mock).mockResolvedValue(0);

    (prisma.$transaction as jest.Mock).mockImplementation(async cb => {
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

    await lmsProgressService.completeLevel('user1', 'level1', false);

    expect(lmsGamificationService.awardXp).not.toHaveBeenCalled();
  });

  it('unlocks next level and awards XP on first completion', async () => {
    (prisma.lmsLevel.findFirst as jest.Mock).mockResolvedValue({
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

    (prisma.lmsTopic.findFirst as jest.Mock).mockResolvedValue({
      id: 'topic1',
      isActive: true,
      isPublished: true,
      levels: [{ id: 'level1', position: 1 }, { id: 'level2', position: 2 }],
    });

    (prisma.lmsUserLevelProgress.upsert as jest.Mock).mockResolvedValue({});
    (prisma.lmsUserTopicProgress.upsert as jest.Mock).mockResolvedValue({
      status: 'IN_PROGRESS',
      completedLevels: 0,
      totalLevels: 2,
    });

    (prisma.lmsUserLevelProgress.findUnique as jest.Mock)
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

    (prisma.lmsUserTopicProgress.findUnique as jest.Mock).mockResolvedValue({ status: 'IN_PROGRESS' });
    (prisma.lmsXpLedger.count as jest.Mock).mockResolvedValue(0);

    (prisma.lmsLevel.findUnique as jest.Mock).mockResolvedValue({
      id: 'level1',
      requireVideoCompletion: false,
      minVideoWatchPercent: 0,
      requireQuizPass: false,
      quizPassingPercent: 0,
    });

    (prisma.lmsLevel.findMany as jest.Mock).mockResolvedValue([{ id: 'level1' }, { id: 'level2' }]);
    (prisma.lmsUserLevelProgress.count as jest.Mock).mockResolvedValue(1);

    (prisma.$transaction as jest.Mock).mockImplementation(async cb => {
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

    await lmsProgressService.completeLevel('user1', 'level1', false);

    expect(lmsGamificationService.awardXp).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user1',
        levelId: 'level1',
        points: 25,
      }),
    );
  });
});
