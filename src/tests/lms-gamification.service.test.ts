import lmsGamificationService from '../services/lms-gamification.service';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    lmsXpLedger: {
      groupBy: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    lmsLeaderboardSnapshot: {
      create: jest.fn(),
    },
    lmsTopic: {
      findUnique: jest.fn(),
    },
  },
}));

describe('lms-gamification.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns ranked global leaderboard and stores snapshot', async () => {
    (prisma.lmsXpLedger.groupBy as jest.Mock).mockResolvedValue([
      { userId: 'u2', _sum: { pointsDelta: 40 }, _max: { createdAt: new Date('2026-01-02') } },
      { userId: 'u1', _sum: { pointsDelta: 30 }, _max: { createdAt: new Date('2026-01-01') } },
    ]);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'u1', name: 'Alice', email: 'a@a.com', profilePhoto: null, xpPoints: 130 },
      { id: 'u2', name: 'Bob', email: 'b@b.com', profilePhoto: null, xpPoints: 200 },
    ]);

    (prisma.lmsLeaderboardSnapshot.create as jest.Mock).mockResolvedValue({ id: 'snap1' });

    const result = await lmsGamificationService.getGlobalLeaderboard(10);

    expect(result).toHaveLength(2);
    expect(result[0].rank).toBe(1);
    expect(result[0].lmsXp).toBe(40);
    expect(prisma.lmsLeaderboardSnapshot.create).toHaveBeenCalledTimes(1);
  });
});
