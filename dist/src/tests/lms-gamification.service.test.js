"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lms_gamification_service_1 = __importDefault(require("../services/lms-gamification.service"));
const prisma_1 = __importDefault(require("../lib/prisma"));
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
        prisma_1.default.lmsXpLedger.groupBy.mockResolvedValue([
            { userId: 'u2', _sum: { pointsDelta: 40 }, _max: { createdAt: new Date('2026-01-02') } },
            { userId: 'u1', _sum: { pointsDelta: 30 }, _max: { createdAt: new Date('2026-01-01') } },
        ]);
        prisma_1.default.user.findMany.mockResolvedValue([
            { id: 'u1', name: 'Alice', email: 'a@a.com', profilePhoto: null, xpPoints: 130 },
            { id: 'u2', name: 'Bob', email: 'b@b.com', profilePhoto: null, xpPoints: 200 },
        ]);
        prisma_1.default.lmsLeaderboardSnapshot.create.mockResolvedValue({ id: 'snap1' });
        const result = await lms_gamification_service_1.default.getGlobalLeaderboard(10);
        expect(result).toHaveLength(2);
        expect(result[0].rank).toBe(1);
        expect(result[0].lmsXp).toBe(40);
        expect(prisma_1.default.lmsLeaderboardSnapshot.create).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=lms-gamification.service.test.js.map