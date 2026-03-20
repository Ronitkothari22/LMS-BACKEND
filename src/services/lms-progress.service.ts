import HttpException from '../utils/http-exception';
import prisma from '../lib/prisma';
import type { CreateLmsAttemptInput, VideoProgressInput } from '../types/lms.types';
import { LmsAttemptStatus, LmsProgressStatus, LmsXpEventType } from '@prisma/client';
import lmsGamificationService from './lms-gamification.service';

class LmsProgressService {
  async notImplemented(): Promise<never> {
    throw new HttpException(501, 'LMS progress service not implemented yet');
  }

  private async ensureLearnerTopicAccessible(topicId: string) {
    const topic = await prisma.lmsTopic.findFirst({
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
      throw new HttpException(404, 'LMS topic not found');
    }

    return topic;
  }

  private async ensureLearnerLevelAccessible(levelId: string) {
    const level = await prisma.lmsLevel.findFirst({
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
      throw new HttpException(404, 'LMS level not found');
    }

    return level;
  }

  private async initializeTopicProgressForUser(userId: string, topicId: string) {
    const topic = await this.ensureLearnerTopicAccessible(topicId);
    const levels = topic.levels;

    if (levels.length === 0) {
      await prisma.lmsUserTopicProgress.upsert({
        where: { userId_topicId: { userId, topicId } },
        update: {
          totalLevels: 0,
          completionPercent: 100,
          completedLevels: 0,
          status: LmsProgressStatus.COMPLETED,
          completedAt: new Date(),
        },
        create: {
          userId,
          topicId,
          totalLevels: 0,
          completionPercent: 100,
          completedLevels: 0,
          status: LmsProgressStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
      return topic;
    }

    // Ensure level progress rows exist with sequential lock defaults.
    for (let i = 0; i < levels.length; i += 1) {
      const level = levels[i];
      const shouldUnlock = i === 0;
      await prisma.lmsUserLevelProgress.upsert({
        where: { userId_levelId: { userId, levelId: level.id } },
        update: {},
        create: {
          userId,
          levelId: level.id,
          status: shouldUnlock ? LmsProgressStatus.UNLOCKED : LmsProgressStatus.LOCKED,
          unlockedAt: shouldUnlock ? new Date() : null,
        },
      });
    }

    // Topic progress row bootstrap.
    await prisma.lmsUserTopicProgress.upsert({
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
        status: LmsProgressStatus.UNLOCKED,
      },
    });

    return topic;
  }

  private async refreshTopicProgress(userId: string, topicId: string) {
    const levels = await prisma.lmsLevel.findMany({
      where: { topicId, isPublished: true },
      select: { id: true },
    });

    const totalLevels = levels.length;
    const levelIds = levels.map(level => level.id);

    if (levelIds.length) {
      // Data consistency repair: completedAt implies completed status.
      await prisma.lmsUserLevelProgress.updateMany({
        where: {
          userId,
          levelId: { in: levelIds },
          completedAt: { not: null },
          status: { not: LmsProgressStatus.COMPLETED },
        },
        data: {
          status: LmsProgressStatus.COMPLETED,
        },
      });
    }

    const completedLevels = levelIds.length
      ? await prisma.lmsUserLevelProgress.count({
          where: {
            userId,
            levelId: { in: levelIds },
            status: LmsProgressStatus.COMPLETED,
          },
        })
      : 0;

    const completionPercent = totalLevels === 0 ? 100 : (completedLevels / totalLevels) * 100;
    const isCompleted = totalLevels > 0 && completedLevels === totalLevels;
    const status = isCompleted
      ? LmsProgressStatus.COMPLETED
      : completedLevels > 0
        ? LmsProgressStatus.IN_PROGRESS
        : LmsProgressStatus.UNLOCKED;

    return prisma.lmsUserTopicProgress.upsert({
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

  private async evaluateCompletionRules(userId: string, levelId: string) {
    const level = await prisma.lmsLevel.findUnique({
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
      throw new HttpException(404, 'LMS level not found');
    }

    const progress = await prisma.lmsUserLevelProgress.findUnique({
      where: { userId_levelId: { userId, levelId } },
      select: { watchPercent: true, latestScorePercent: true },
    });

    const videoPassed =
      !level.requireVideoCompletion ||
      (progress?.watchPercent ?? 0) >= level.minVideoWatchPercent;
    const quizPassed =
      !level.requireQuizPass ||
      (progress?.latestScorePercent ?? 0) >= level.quizPassingPercent;

    return {
      level,
      videoPassed,
      quizPassed,
      canComplete: videoPassed && quizPassed,
      reasons: {
        requireVideoCompletion: level.requireVideoCompletion,
        minVideoWatchPercent: level.minVideoWatchPercent,
        currentWatchPercent: progress?.watchPercent ?? 0,
        requireQuizPass: level.requireQuizPass,
        quizPassingPercent: level.quizPassingPercent,
        currentScorePercent: progress?.latestScorePercent ?? 0,
      },
    };
  }

  async getMyTopics(userId: string) {
    const topics = await prisma.lmsTopic.findMany({
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
      ? await prisma.lmsUserTopicProgress.findMany({
          where: { userId, topicId: { in: topicIds } },
        })
      : [];

    const progressMap = new Map(progressRows.map(row => [row.topicId, row]));

    return topics.map(topic => ({
      ...topic,
      progress: progressMap.get(topic.id) || null,
    }));
  }

  async getMyTopicById(userId: string, topicId: string) {
    const topic = await this.initializeTopicProgressForUser(userId, topicId);
    await this.refreshTopicProgress(userId, topicId);

    const levels = await prisma.lmsLevel.findMany({
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
      ? await prisma.lmsUserLevelProgress.findMany({
          where: { userId, levelId: { in: levelIds } },
        })
      : [];
    const progressMap = new Map(progressRows.map(row => [row.levelId, row]));

    const topicProgress = await prisma.lmsUserTopicProgress.findUnique({
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

  async getMyLevelById(userId: string, levelId: string) {
    const level = await this.ensureLearnerLevelAccessible(levelId);
    await this.initializeTopicProgressForUser(userId, level.topicId);

    const progress = await prisma.lmsUserLevelProgress.findUnique({
      where: { userId_levelId: { userId, levelId } },
    });

    if (!progress || progress.status === LmsProgressStatus.LOCKED) {
      throw new HttpException(403, 'This level is locked');
    }

    const levelData = await prisma.lmsLevel.findUnique({
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
      throw new HttpException(404, 'LMS level not found');
    }

    const { userProgresses, attempts, ...restLevel } = levelData;

    return {
      ...restLevel,
      progress: userProgresses?.[0] || null,
      latestAttempt: attempts?.[0] || null,
    };
  }

  async updateVideoProgress(userId: string, levelId: string, payload: VideoProgressInput) {
    const level = await this.ensureLearnerLevelAccessible(levelId);
    await this.initializeTopicProgressForUser(userId, level.topicId);

    const levelProgress = await prisma.lmsUserLevelProgress.findUnique({
      where: { userId_levelId: { userId, levelId } },
    });

    if (!levelProgress || levelProgress.status === LmsProgressStatus.LOCKED) {
      throw new HttpException(403, 'This level is locked');
    }

    const watchPercent = Math.max(
      0,
      Math.min(100, payload.watchPercent ?? levelProgress.watchPercent ?? 0),
    );
    const watchSeconds = payload.watchSeconds ?? 0;
    const videoPositionSeconds = payload.videoPositionSeconds ?? 0;

    const [event, updatedProgress] = await prisma.$transaction([
      prisma.lmsVideoWatchEvent.create({
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
      prisma.lmsUserLevelProgress.update({
        where: { userId_levelId: { userId, levelId } },
        data: {
          watchPercent,
          lastVideoPositionSeconds: videoPositionSeconds,
          timeSpentSeconds: { increment: watchSeconds },
          status:
            levelProgress.status === LmsProgressStatus.UNLOCKED
              ? LmsProgressStatus.IN_PROGRESS
              : levelProgress.status,
          ...(levelProgress.startedAt ? {} : { startedAt: new Date() }),
        },
      }),
    ]);

    // Award one-time video completion XP when user completes video for this level.
    if (payload.eventType === 'COMPLETE' && levelProgress.watchPercent < 100 && watchPercent >= 100) {
      const existingVideoXp = await prisma.lmsXpLedger.count({
        where: {
          userId,
          levelId,
          eventType: LmsXpEventType.VIDEO_COMPLETED,
        },
      });

      if (existingVideoXp === 0) {
      await lmsGamificationService.awardXp({
        userId,
        topicId: level.topicId,
        levelId,
        eventType: LmsXpEventType.VIDEO_COMPLETED,
        points: 5,
        reason: 'Video completion reward',
      });
      }
    }

    await this.refreshTopicProgress(userId, level.topicId);

    return { event, progress: updatedProgress };
  }

  async createLevelAttempt(userId: string, levelId: string, payload: CreateLmsAttemptInput) {
    const level = await this.ensureLearnerLevelAccessible(levelId);
    await this.initializeTopicProgressForUser(userId, level.topicId);

    const levelProgress = await prisma.lmsUserLevelProgress.findUnique({
      where: { userId_levelId: { userId, levelId } },
    });

    if (!levelProgress || levelProgress.status === LmsProgressStatus.LOCKED) {
      throw new HttpException(403, 'This level is locked');
    }

    const questions = await prisma.lmsQuestion.findMany({
      where: { levelId },
      include: {
        options: true,
      },
    });

    if (questions.length === 0) {
      throw new HttpException(400, 'No questions found for this level');
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
      } else {
        // MULTIPLE_CORRECT
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

    const attemptCount = await prisma.lmsLevelAttempt.count({
      where: { userId, levelId },
    });
    const attemptNumber = attemptCount + 1;

    const attempt = await prisma.$transaction(async tx => {
      const createdAttempt = await tx.lmsLevelAttempt.create({
        data: {
          userId,
          levelId,
          attemptNumber,
          status: passed ? LmsAttemptStatus.PASSED : LmsAttemptStatus.FAILED,
          scorePercent,
          submittedAt: new Date(),
          timeSpentSeconds: payload.timeSpentSeconds ?? 0,
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
          status:
            levelProgress.status === LmsProgressStatus.UNLOCKED
              ? LmsProgressStatus.IN_PROGRESS
              : levelProgress.status,
          ...(levelProgress.startedAt ? {} : { startedAt: new Date() }),
        },
      });

      return createdAttempt;
    });

    // Award quiz pass XP only for first successful pass on this level.
    if (passed && levelProgress.successfulAttempts === 0) {
      const existingQuizXp = await prisma.lmsXpLedger.count({
        where: {
          userId,
          levelId,
          eventType: LmsXpEventType.QUIZ_PASSED,
        },
      });

      if (existingQuizXp === 0) {
      await lmsGamificationService.awardXp({
        userId,
        topicId: level.topicId,
        levelId,
        eventType: LmsXpEventType.QUIZ_PASSED,
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

  async completeLevel(userId: string, levelId: string, force = false) {
    const level = await this.ensureLearnerLevelAccessible(levelId);
    await this.initializeTopicProgressForUser(userId, level.topicId);

    const levelProgress = await prisma.lmsUserLevelProgress.findUnique({
      where: { userId_levelId: { userId, levelId } },
    });

    if (!levelProgress || levelProgress.status === LmsProgressStatus.LOCKED) {
      throw new HttpException(403, 'This level is locked');
    }

    const evaluation = await this.evaluateCompletionRules(userId, levelId);

    if (!force && !evaluation.canComplete) {
      throw new HttpException(400, 'Level completion requirements not met');
    }

    const existingTopicProgress = await prisma.lmsUserTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId: level.topicId } },
    });

    const now = new Date();
    const result = await prisma.$transaction(async tx => {
      // Idempotent completion write: only first concurrent request transitions to completedAt != null.
      const completionWrite = await tx.lmsUserLevelProgress.updateMany({
        where: {
          userId,
          levelId,
          completedAt: null,
        },
        data: {
          status: LmsProgressStatus.COMPLETED,
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
              status: LmsProgressStatus.UNLOCKED,
              unlockedAt: new Date(),
            },
          });
        } else if (nextLevelProgress.status === LmsProgressStatus.LOCKED) {
          await tx.lmsUserLevelProgress.update({
            where: { userId_levelId: { userId, levelId: nextLevel.id } },
            data: {
              status: LmsProgressStatus.UNLOCKED,
              unlockedAt: new Date(),
            },
          });
        }
      }

      return {
        updatedProgress,
        nextLevelId: nextLevel?.id || null,
        firstCompletion: completionWrite.count > 0,
      };
    });

    const topicProgress = await this.refreshTopicProgress(userId, level.topicId);
    const becameTopicComplete =
      existingTopicProgress?.status !== LmsProgressStatus.COMPLETED &&
      topicProgress.status === LmsProgressStatus.COMPLETED;

    if (result.firstCompletion && level.xpOnCompletion > 0) {
      await lmsGamificationService.awardXp({
        userId,
        topicId: level.topicId,
        levelId: level.id,
        eventType: LmsXpEventType.LEVEL_COMPLETED,
        points: level.xpOnCompletion,
        reason: 'Level completion reward',
      });
    }

    if (becameTopicComplete) {
      const existingTopicCompletionXp = await prisma.lmsXpLedger.count({
        where: {
          userId,
          topicId: level.topicId,
          eventType: LmsXpEventType.TOPIC_COMPLETED,
        },
      });

      if (existingTopicCompletionXp === 0) {
      await lmsGamificationService.awardXp({
        userId,
        topicId: level.topicId,
        eventType: LmsXpEventType.TOPIC_COMPLETED,
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

  async getMyProgress(userId: string) {
    const [topicProgresses, levelProgresses] = await Promise.all([
      prisma.lmsUserTopicProgress.findMany({
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
      prisma.lmsUserLevelProgress.findMany({
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

export default new LmsProgressService();
