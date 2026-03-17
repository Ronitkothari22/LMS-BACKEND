"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const client_1 = require("@prisma/client");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const prisma = new client_1.PrismaClient();
const getDashboard = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
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
        const userSessions = await prisma.session.findMany({
            where: {
                OR: [{ participants: { some: { id: userId } } }, { invited: { some: { id: userId } } }],
            },
            orderBy: { createdAt: 'desc' },
        });
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
        const activityLogs = await prisma.activityLog.findMany({
            where: { userId },
            select: {
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const allActivities = [
            ...quizActivities.map(q => q.completedAt),
            ...activityLogs.map(a => a.createdAt),
        ];
        const uniqueActivityDates = Array.from(new Set(allActivities.map(date => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }))).sort((a, b) => b - a);
        let dailyStreak = 0;
        if (uniqueActivityDates.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let currentDate = new Date(today);
            let consecutiveDays = true;
            while (consecutiveDays && dailyStreak < 365) {
                const currentDateTimeStamp = currentDate.getTime();
                const hasActivity = uniqueActivityDates.includes(currentDateTimeStamp);
                if (hasActivity) {
                    dailyStreak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                }
                else {
                    consecutiveDays = false;
                }
            }
        }
        const completedSessions = userSessions.filter(s => s.state === 'COMPLETED').length;
        const totalUserSessions = userSessions.length;
        const courseProgressPercentage = totalUserSessions > 0 ? Math.round((completedSessions / totalUserSessions) * 100) : 0;
        const formattedTopPerformers = topPerformersRaw.map(performer => {
            const userDetails = topPerformerUsers.find(u => u.id === performer.userId);
            const avgScore = performer._avg.score || performer._avg.totalScore || 0;
            return {
                userId: performer.userId,
                name: (userDetails === null || userDetails === void 0 ? void 0 : userDetails.name) || 'Unknown User',
                score: Math.round(avgScore),
                belt: (userDetails === null || userDetails === void 0 ? void 0 : userDetails.belt) || 'WHITE',
            };
        });
        const dashboardData = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                belt: user.belt,
                xpPoints: user.xpPoints,
            },
            quizScores: userQuizResponses
                .filter(response => response.completedAt && (response.score !== null || response.totalScore !== null))
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
        try {
            await prisma.activityLog.create({
                data: {
                    userId: userId,
                    action: 'dashboard_viewed',
                    details: 'User viewed dashboard',
                },
            });
        }
        catch (logError) {
            logger_config_1.default.warn('Failed to log dashboard activity:', logError);
        }
        res.status(200).json({
            success: true,
            data: dashboardData,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
};
exports.getDashboard = getDashboard;
//# sourceMappingURL=dashboard.controller.js.map