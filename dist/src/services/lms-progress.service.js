"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const lms_gamification_service_1 = __importDefault(require("./lms-gamification.service"));
class LmsProgressService {
    async notImplemented() {
        throw new http_exception_1.default(501, 'LMS progress service not implemented yet');
    }
    async ensureLearnerTopicAccessible(topicId) {
        const topic = await prisma_1.default.lmsTopic.findFirst({
            where: {
                id: topicId,
                isActive: true,
                isPublished: true,
            },
            include: {
                levels: {
                    where: { isPublished: true },
                    orderBy: { position: 'asc' },
                    select: { id: true, position: true },
                },
            },
        });
        if (!topic) {
            throw new http_exception_1.default(404, 'LMS topic not found');
        }
        return topic;
    }
    async ensureLearnerLevelAccessible(levelId) {
        const level = await prisma_1.default.lmsLevel.findFirst({
            where: {
                id: levelId,
                isPublished: true,
                topic: {
                    isActive: true,
                    isPublished: true,
                },
            },
            include: {
                topic: {
                    include: {
                        levels: {
                            where: { isPublished: true },
                            orderBy: { position: 'asc' },
                            select: { id: true, position: true },
                        },
                    },
                },
            },
        });
        if (!level) {
            throw new http_exception_1.default(404, 'LMS level not found');
        }
        return level;
    }
    async initializeTopicProgressForUser(userId, topicId) {
        const topic = await this.ensureLearnerTopicAccessible(topicId);
        const levels = topic.levels;
        if (levels.length === 0) {
            await prisma_1.default.lmsUserTopicProgress.upsert({
                where: { userId_topicId: { userId, topicId } },
                update: {
                    totalLevels: 0,
                    completionPercent: 100,
                    completedLevels: 0,
                    status: client_1.LmsProgressStatus.COMPLETED,
                    completedAt: new Date(),
                },
                create: {
                    userId,
                    topicId,
                    totalLevels: 0,
                    completionPercent: 100,
                    completedLevels: 0,
                    status: client_1.LmsProgressStatus.COMPLETED,
                    completedAt: new Date(),
                },
            });
            return topic;
        }
        for (let i = 0; i < levels.length; i += 1) {
            const level = levels[i];
            const shouldUnlock = i === 0;
            await prisma_1.default.lmsUserLevelProgress.upsert({
                where: { userId_levelId: { userId, levelId: level.id } },
                update: {},
                create: {
                    userId,
                    levelId: level.id,
                    status: shouldUnlock ? client_1.LmsProgressStatus.UNLOCKED : client_1.LmsProgressStatus.LOCKED,
                    unlockedAt: shouldUnlock ? new Date() : null,
                },
            });
        }
        await prisma_1.default.lmsUserTopicProgress.upsert({
            where: { userId_topicId: { userId, topicId } },
            update: {
                totalLevels: levels.length,
            },
            create: {
                userId,
                topicId,
                totalLevels: levels.length,
                completedLevels: 0,
                completionPercent: 0,
                status: client_1.LmsProgressStatus.UNLOCKED,
            },
        });
        return topic;
    }
    async refreshTopicProgress(userId, topicId) {
        const levels = await prisma_1.default.lmsLevel.findMany({
            where: { topicId, isPublished: true },
            select: { id: true },
        });
        const totalLevels = levels.length;
        const levelIds = levels.map(level => level.id);
        if (levelIds.length) {
            await prisma_1.default.lmsUserLevelProgress.updateMany({
                where: {
                    userId,
                    levelId: { in: levelIds },
                    completedAt: { not: null },
                    status: { not: client_1.LmsProgressStatus.COMPLETED },
                },
                data: {
                    status: client_1.LmsProgressStatus.COMPLETED,
                },
            });
        }
        const completedLevels = levelIds.length
            ? await prisma_1.default.lmsUserLevelProgress.count({
                where: {
                    userId,
                    levelId: { in: levelIds },
                    status: client_1.LmsProgressStatus.COMPLETED,
                },
            })
            : 0;
        const completionPercent = totalLevels === 0 ? 100 : (completedLevels / totalLevels) * 100;
        const isCompleted = totalLevels > 0 && completedLevels === totalLevels;
        const status = isCompleted
            ? client_1.LmsProgressStatus.COMPLETED
            : completedLevels > 0
                ? client_1.LmsProgressStatus.IN_PROGRESS
                : client_1.LmsProgressStatus.UNLOCKED;
        return prisma_1.default.lmsUserTopicProgress.upsert({
            where: { userId_topicId: { userId, topicId } },
            update: {
                totalLevels,
                completedLevels,
                completionPercent,
                status,
                ...(isCompleted ? { completedAt: new Date() } : {}),
            },
            create: {
                userId,
                topicId,
                totalLevels,
                completedLevels,
                completionPercent,
                status,
                ...(isCompleted ? { completedAt: new Date() } : {}),
            },
        });
    }
    async evaluateCompletionRules(userId, levelId) {
        var _a, _b, _c, _d;
        const level = await prisma_1.default.lmsLevel.findUnique({
            where: { id: levelId },
            select: {
                id: true,
                requireVideoCompletion: true,
                minVideoWatchPercent: true,
                requireQuizPass: true,
                quizPassingPercent: true,
            },
        });
        if (!level) {
            throw new http_exception_1.default(404, 'LMS level not found');
        }
        const progress = await prisma_1.default.lmsUserLevelProgress.findUnique({
            where: { userId_levelId: { userId, levelId } },
            select: { watchPercent: true, latestScorePercent: true },
        });
        const videoPassed = !level.requireVideoCompletion ||
            ((_a = progress === null || progress === void 0 ? void 0 : progress.watchPercent) !== null && _a !== void 0 ? _a : 0) >= level.minVideoWatchPercent;
        const quizPassed = !level.requireQuizPass ||
            ((_b = progress === null || progress === void 0 ? void 0 : progress.latestScorePercent) !== null && _b !== void 0 ? _b : 0) >= level.quizPassingPercent;
        return {
            level,
            videoPassed,
            quizPassed,
            canComplete: videoPassed && quizPassed,
            reasons: {
                requireVideoCompletion: level.requireVideoCompletion,
                minVideoWatchPercent: level.minVideoWatchPercent,
                currentWatchPercent: (_c = progress === null || progress === void 0 ? void 0 : progress.watchPercent) !== null && _c !== void 0 ? _c : 0,
                requireQuizPass: level.requireQuizPass,
                quizPassingPercent: level.quizPassingPercent,
                currentScorePercent: (_d = progress === null || progress === void 0 ? void 0 : progress.latestScorePercent) !== null && _d !== void 0 ? _d : 0,
            },
        };
    }
    async getMyTopics(userId) {
        const topics = await prisma_1.default.lmsTopic.findMany({
            where: {
                isPublished: true,
                isActive: true,
            },
            orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
            include: {
                levels: {
                    where: { isPublished: true },
                    orderBy: { position: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        position: true,
                    },
                },
            },
        });
        for (const topic of topics) {
            await this.initializeTopicProgressForUser(userId, topic.id);
            await this.refreshTopicProgress(userId, topic.id);
        }
        const topicIds = topics.map(topic => topic.id);
        const progressRows = topicIds.length
            ? await prisma_1.default.lmsUserTopicProgress.findMany({
                where: { userId, topicId: { in: topicIds } },
            })
            : [];
        const progressMap = new Map(progressRows.map(row => [row.topicId, row]));
        return topics.map(topic => ({
            ...topic,
            progress: progressMap.get(topic.id) || null,
        }));
    }
    async getMyTopicById(userId, topicId) {
        const topic = await this.initializeTopicProgressForUser(userId, topicId);
        await this.refreshTopicProgress(userId, topicId);
        const levels = await prisma_1.default.lmsLevel.findMany({
            where: { topicId, isPublished: true },
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: {
                        contents: true,
                        questions: true,
                    },
                },
            },
        });
        const levelIds = levels.map(level => level.id);
        const progressRows = levelIds.length
            ? await prisma_1.default.lmsUserLevelProgress.findMany({
                where: { userId, levelId: { in: levelIds } },
            })
            : [];
        const progressMap = new Map(progressRows.map(row => [row.levelId, row]));
        const topicProgress = await prisma_1.default.lmsUserTopicProgress.findUnique({
            where: { userId_topicId: { userId, topicId } },
        });
        return {
            ...topic,
            levels: levels.map(level => ({
                ...level,
                progress: progressMap.get(level.id) || null,
            })),
            progress: topicProgress,
        };
    }
    async getMyLevelById(userId, levelId) {
        const level = await this.ensureLearnerLevelAccessible(levelId);
        await this.initializeTopicProgressForUser(userId, level.topicId);
        const progress = await prisma_1.default.lmsUserLevelProgress.findUnique({
            where: { userId_levelId: { userId, levelId } },
        });
        if (!progress || progress.status === client_1.LmsProgressStatus.LOCKED) {
            throw new http_exception_1.default(403, 'This level is locked');
        }
        const levelData = await prisma_1.default.lmsLevel.findUnique({
            where: { id: levelId },
            include: {
                topic: {
                    select: {
                        id: true,
                        title: true,
                        isPublished: true,
                        isActive: true,
                    },
                },
                contents: {
                    orderBy: { position: 'asc' },
                },
                questions: {
                    orderBy: { position: 'asc' },
                    include: {
                        options: {
                            orderBy: { position: 'asc' },
                        },
                    },
                },
                userProgresses: {
                    where: { userId },
                    take: 1,
                },
                attempts: {
                    where: { userId },
                    orderBy: { attemptNumber: 'desc' },
                    take: 1,
                    include: {
                        answers: true,
                    },
                },
            },
        });
        if (!levelData) {
            throw new http_exception_1.default(404, 'LMS level not found');
        }
        const { userProgresses, attempts, ...restLevel } = levelData;
        return {
            ...restLevel,
            progress: (userProgresses === null || userProgresses === void 0 ? void 0 : userProgresses[0]) || null,
            latestAttempt: (attempts === null || attempts === void 0 ? void 0 : attempts[0]) || null,
        };
    }
    async updateVideoProgress(userId, levelId, payload) {
        var _a, _b, _c, _d;
        const level = await this.ensureLearnerLevelAccessible(levelId);
        await this.initializeTopicProgressForUser(userId, level.topicId);
        const levelProgress = await prisma_1.default.lmsUserLevelProgress.findUnique({
            where: { userId_levelId: { userId, levelId } },
        });
        if (!levelProgress || levelProgress.status === client_1.LmsProgressStatus.LOCKED) {
            throw new http_exception_1.default(403, 'This level is locked');
        }
        const watchPercent = Math.max(0, Math.min(100, (_b = (_a = payload.watchPercent) !== null && _a !== void 0 ? _a : levelProgress.watchPercent) !== null && _b !== void 0 ? _b : 0));
        const watchSeconds = (_c = payload.watchSeconds) !== null && _c !== void 0 ? _c : 0;
        const videoPositionSeconds = (_d = payload.videoPositionSeconds) !== null && _d !== void 0 ? _d : 0;
        const [event, updatedProgress] = await prisma_1.default.$transaction([
            prisma_1.default.lmsVideoWatchEvent.create({
                data: {
                    userId,
                    topicId: level.topicId,
                    levelId,
                    contentId: payload.contentId,
                    eventType: payload.eventType,
                    watchSeconds,
                    videoPositionSeconds,
                    watchPercent,
                },
            }),
            prisma_1.default.lmsUserLevelProgress.update({
                where: { userId_levelId: { userId, levelId } },
                data: {
                    watchPercent,
                    lastVideoPositionSeconds: videoPositionSeconds,
                    timeSpentSeconds: { increment: watchSeconds },
                    status: levelProgress.status === client_1.LmsProgressStatus.UNLOCKED
                        ? client_1.LmsProgressStatus.IN_PROGRESS
                        : levelProgress.status,
                    ...(levelProgress.startedAt ? {} : { startedAt: new Date() }),
                },
            }),
        ]);
        if (payload.eventType === 'COMPLETE' && levelProgress.watchPercent < 100 && watchPercent >= 100) {
            const existingVideoXp = await prisma_1.default.lmsXpLedger.count({
                where: {
                    userId,
                    levelId,
                    eventType: client_1.LmsXpEventType.VIDEO_COMPLETED,
                },
            });
            if (existingVideoXp === 0) {
                await lms_gamification_service_1.default.awardXp({
                    userId,
                    topicId: level.topicId,
                    levelId,
                    eventType: client_1.LmsXpEventType.VIDEO_COMPLETED,
                    points: 5,
                    reason: 'Video completion reward',
                });
            }
        }
        await this.refreshTopicProgress(userId, level.topicId);
        return { event, progress: updatedProgress };
    }
    async createLevelAttempt(userId, levelId, payload) {
        const level = await this.ensureLearnerLevelAccessible(levelId);
        await this.initializeTopicProgressForUser(userId, level.topicId);
        const levelProgress = await prisma_1.default.lmsUserLevelProgress.findUnique({
            where: { userId_levelId: { userId, levelId } },
        });
        if (!levelProgress || levelProgress.status === client_1.LmsProgressStatus.LOCKED) {
            throw new http_exception_1.default(403, 'This level is locked');
        }
        const questions = await prisma_1.default.lmsQuestion.findMany({
            where: { levelId },
            include: {
                options: true,
            },
        });
        if (questions.length === 0) {
            throw new http_exception_1.default(400, 'No questions found for this level');
        }
        const answerMap = new Map(payload.answers.map(answer => [answer.questionId, answer]));
        const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
        let earnedScore = 0;
        const evaluatedAnswers = questions.map(question => {
            const incoming = answerMap.get(question.id);
            const points = question.points;
            if (!incoming) {
                return {
                    questionId: question.id,
                    selectedOptionIds: [],
                    textAnswer: null,
                    isCorrect: false,
                    pointsAwarded: 0,
                };
            }
            if (question.type === 'TEXT') {
                const answered = Boolean(incoming.textAnswer && incoming.textAnswer.trim().length > 0);
                const pointsAwarded = answered ? points : 0;
                earnedScore += pointsAwarded;
                return {
                    questionId: question.id,
                    selectedOptionIds: incoming.selectedOptionIds || [],
                    textAnswer: incoming.textAnswer || null,
                    isCorrect: answered,
                    pointsAwarded,
                };
            }
            const selected = new Set(incoming.selectedOptionIds || []);
            const correct = new Set(question.options.filter(opt => opt.isCorrect).map(opt => opt.id));
            let isCorrect = false;
            if (question.type === 'SINGLE_CHOICE') {
                isCorrect =
                    selected.size === 1 && correct.size === 1 && selected.values().next().value === correct.values().next().value;
            }
            else {
                isCorrect =
                    selected.size === correct.size &&
                        [...selected].every(optionId => correct.has(optionId));
            }
            const pointsAwarded = isCorrect ? points : 0;
            earnedScore += pointsAwarded;
            return {
                questionId: question.id,
                selectedOptionIds: [...selected],
                textAnswer: incoming.textAnswer || null,
                isCorrect,
                pointsAwarded,
            };
        });
        const scorePercent = maxScore === 0 ? 100 : Number(((earnedScore / maxScore) * 100).toFixed(2));
        const passThreshold = level.requireQuizPass ? level.quizPassingPercent : 0;
        const passed = scorePercent >= passThreshold;
        const attemptCount = await prisma_1.default.lmsLevelAttempt.count({
            where: { userId, levelId },
        });
        const attemptNumber = attemptCount + 1;
        const attempt = await prisma_1.default.$transaction(async (tx) => {
            var _a;
            const createdAttempt = await tx.lmsLevelAttempt.create({
                data: {
                    userId,
                    levelId,
                    attemptNumber,
                    status: passed ? client_1.LmsAttemptStatus.PASSED : client_1.LmsAttemptStatus.FAILED,
                    scorePercent,
                    submittedAt: new Date(),
                    timeSpentSeconds: (_a = payload.timeSpentSeconds) !== null && _a !== void 0 ? _a : 0,
                    answers: {
                        create: evaluatedAnswers,
                    },
                },
                include: {
                    answers: true,
                },
            });
            await tx.lmsUserLevelProgress.update({
                where: { userId_levelId: { userId, levelId } },
                data: {
                    totalAttempts: { increment: 1 },
                    successfulAttempts: passed ? { increment: 1 } : undefined,
                    latestScorePercent: scorePercent,
                    status: levelProgress.status === client_1.LmsProgressStatus.UNLOCKED
                        ? client_1.LmsProgressStatus.IN_PROGRESS
                        : levelProgress.status,
                    ...(levelProgress.startedAt ? {} : { startedAt: new Date() }),
                },
            });
            return createdAttempt;
        });
        if (passed && levelProgress.successfulAttempts === 0) {
            const existingQuizXp = await prisma_1.default.lmsXpLedger.count({
                where: {
                    userId,
                    levelId,
                    eventType: client_1.LmsXpEventType.QUIZ_PASSED,
                },
            });
            if (existingQuizXp === 0) {
                await lms_gamification_service_1.default.awardXp({
                    userId,
                    topicId: level.topicId,
                    levelId,
                    eventType: client_1.LmsXpEventType.QUIZ_PASSED,
                    points: 10,
                    reason: 'First quiz pass on level',
                });
            }
        }
        await this.refreshTopicProgress(userId, level.topicId);
        return {
            attempt,
            summary: {
                passed,
                scorePercent,
                passThreshold,
                maxScore,
                earnedScore,
            },
        };
    }
    async completeLevel(userId, levelId, force = false) {
        const level = await this.ensureLearnerLevelAccessible(levelId);
        await this.initializeTopicProgressForUser(userId, level.topicId);
        const levelProgress = await prisma_1.default.lmsUserLevelProgress.findUnique({
            where: { userId_levelId: { userId, levelId } },
        });
        if (!levelProgress || levelProgress.status === client_1.LmsProgressStatus.LOCKED) {
            throw new http_exception_1.default(403, 'This level is locked');
        }
        const evaluation = await this.evaluateCompletionRules(userId, levelId);
        if (!force && !evaluation.canComplete) {
            throw new http_exception_1.default(400, 'Level completion requirements not met');
        }
        const existingTopicProgress = await prisma_1.default.lmsUserTopicProgress.findUnique({
            where: { userId_topicId: { userId, topicId: level.topicId } },
        });
        const now = new Date();
        const result = await prisma_1.default.$transaction(async (tx) => {
            const completionWrite = await tx.lmsUserLevelProgress.updateMany({
                where: {
                    userId,
                    levelId,
                    completedAt: null,
                },
                data: {
                    status: client_1.LmsProgressStatus.COMPLETED,
                    completedAt: now,
                    ...(levelProgress.startedAt ? {} : { startedAt: now }),
                },
            });
            const updatedProgress = await tx.lmsUserLevelProgress.findUniqueOrThrow({
                where: { userId_levelId: { userId, levelId } },
            });
            const nextLevel = await tx.lmsLevel.findFirst({
                where: {
                    topicId: level.topicId,
                    isPublished: true,
                    position: { gt: level.position },
                },
                orderBy: { position: 'asc' },
            });
            if (nextLevel) {
                const nextLevelProgress = await tx.lmsUserLevelProgress.findUnique({
                    where: { userId_levelId: { userId, levelId: nextLevel.id } },
                    select: { status: true },
                });
                if (!nextLevelProgress) {
                    await tx.lmsUserLevelProgress.create({
                        data: {
                            userId,
                            levelId: nextLevel.id,
                            status: client_1.LmsProgressStatus.UNLOCKED,
                            unlockedAt: new Date(),
                        },
                    });
                }
                else if (nextLevelProgress.status === client_1.LmsProgressStatus.LOCKED) {
                    await tx.lmsUserLevelProgress.update({
                        where: { userId_levelId: { userId, levelId: nextLevel.id } },
                        data: {
                            status: client_1.LmsProgressStatus.UNLOCKED,
                            unlockedAt: new Date(),
                        },
                    });
                }
            }
            return {
                updatedProgress,
                nextLevelId: (nextLevel === null || nextLevel === void 0 ? void 0 : nextLevel.id) || null,
                firstCompletion: completionWrite.count > 0,
            };
        });
        const topicProgress = await this.refreshTopicProgress(userId, level.topicId);
        const becameTopicComplete = (existingTopicProgress === null || existingTopicProgress === void 0 ? void 0 : existingTopicProgress.status) !== client_1.LmsProgressStatus.COMPLETED &&
            topicProgress.status === client_1.LmsProgressStatus.COMPLETED;
        if (result.firstCompletion && level.xpOnCompletion > 0) {
            await lms_gamification_service_1.default.awardXp({
                userId,
                topicId: level.topicId,
                levelId: level.id,
                eventType: client_1.LmsXpEventType.LEVEL_COMPLETED,
                points: level.xpOnCompletion,
                reason: 'Level completion reward',
            });
        }
        if (becameTopicComplete) {
            const existingTopicCompletionXp = await prisma_1.default.lmsXpLedger.count({
                where: {
                    userId,
                    topicId: level.topicId,
                    eventType: client_1.LmsXpEventType.TOPIC_COMPLETED,
                },
            });
            if (existingTopicCompletionXp === 0) {
                await lms_gamification_service_1.default.awardXp({
                    userId,
                    topicId: level.topicId,
                    eventType: client_1.LmsXpEventType.TOPIC_COMPLETED,
                    points: 50,
                    reason: 'Topic completion bonus reward',
                });
            }
        }
        return {
            completion: result.updatedProgress,
            nextLevelId: result.nextLevelId,
            topicProgress,
            evaluation,
            becameTopicComplete,
        };
    }
    async getMyProgress(userId) {
        const [topicProgresses, levelProgresses] = await Promise.all([
            prisma_1.default.lmsUserTopicProgress.findMany({
                where: { userId },
                include: {
                    topic: {
                        select: {
                            id: true,
                            title: true,
                            isPublished: true,
                            isActive: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma_1.default.lmsUserLevelProgress.findMany({
                where: { userId },
                include: {
                    level: {
                        select: {
                            id: true,
                            title: true,
                            position: true,
                            topicId: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            }),
        ]);
        return {
            topics: topicProgresses,
            levels: levelProgresses,
        };
    }
}
exports.default = new LmsProgressService();
//# sourceMappingURL=lms-progress.service.js.map