import { z } from 'zod';

const uuidParam = z.string().uuid('Invalid ID format');
const lmsVisibilitySchema = z.enum(['ALL', 'SESSION']);
const coerceBoolean = z.preprocess(value => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
}, z.boolean());

const coerceNonNegativeInt = z.preprocess(value => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
}, z.number().int().nonnegative());

export const createTopicSchema = z.object({
  body: z
    .object({
      title: z.string().min(2, 'Title must be at least 2 characters'),
      description: z.string().optional(),
      slug: z.string().min(2).optional(),
      visibility: lmsVisibilitySchema.optional(),
      sessionId: uuidParam.optional(),
      isPublished: z.boolean().optional(),
      position: z.number().int().nonnegative().optional(),
      estimatedDurationMinutes: z.number().int().positive().optional(),
    })
    .superRefine((body, ctx) => {
      if (body.visibility === 'SESSION' && !body.sessionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sessionId'],
          message: 'sessionId is required when visibility is SESSION',
        });
      }
    }),
});

export const getTopicsSchema = z.object({
  query: z.object({
    isPublished: z.string().optional(),
    includeInactive: z.string().optional(),
  }),
});

export const topicIdParamSchema = z.object({
  params: z.object({
    topicId: uuidParam,
  }),
});

export const updateTopicSchema = z.object({
  params: z.object({
    topicId: uuidParam,
  }),
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    slug: z.string().min(2).optional(),
    visibility: lmsVisibilitySchema.optional(),
    sessionId: z.union([uuidParam, z.null()]).optional(),
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
    position: z.number().int().nonnegative().optional(),
    estimatedDurationMinutes: z.number().int().positive().optional(),
  }),
});

export const createLevelSchema = z.object({
  params: z.object({
    topicId: uuidParam,
  }),
  body: z
    .object({
      title: z.string().min(2),
      description: z.string().optional(),
      position: z.number().int().nonnegative(),
      visibility: lmsVisibilitySchema.optional(),
      sessionId: uuidParam.optional(),
      isPublished: z.boolean().optional(),
      requireVideoCompletion: z.boolean().optional(),
      minVideoWatchPercent: z.number().min(0).max(100).optional(),
      requireQuizPass: z.boolean().optional(),
      quizPassingPercent: z.number().min(0).max(100).optional(),
      requireReadingAcknowledgement: z.boolean().optional(),
      xpOnCompletion: z.number().int().nonnegative().optional(),
    })
    .superRefine((body, ctx) => {
      if (body.visibility === 'SESSION' && !body.sessionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sessionId'],
          message: 'sessionId is required when visibility is SESSION',
        });
      }
    }),
});

export const levelIdParamSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
});

export const updateLevelSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    position: z.number().int().nonnegative().optional(),
    visibility: lmsVisibilitySchema.optional(),
    sessionId: z.union([uuidParam, z.null()]).optional(),
    isPublished: z.boolean().optional(),
    requireVideoCompletion: z.boolean().optional(),
    minVideoWatchPercent: z.number().min(0).max(100).optional(),
    requireQuizPass: z.boolean().optional(),
    quizPassingPercent: z.number().min(0).max(100).optional(),
    requireReadingAcknowledgement: z.boolean().optional(),
    xpOnCompletion: z.number().int().nonnegative().optional(),
  }),
});

export const addLevelVideoContentSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    isRequired: z.boolean().optional(),
    videoSourceType: z.enum(['UPLOAD', 'EXTERNAL_LINK']),
    videoUrl: z.string().url().optional(),
    externalUrl: z.string().url().optional(),
    videoDurationSeconds: z.number().int().nonnegative().optional(),
    position: z.number().int().nonnegative(),
  }),
});

export const addLevelReadingContentSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    attachmentUrl: z.string().url().optional(),
    externalUrl: z.string().url().optional(),
    isRequired: coerceBoolean.optional(),
    position: coerceNonNegativeInt,
  }),
});

export const contentIdParamSchema = z.object({
  params: z.object({
    contentId: uuidParam,
  }),
});

export const updateLevelContentSchema = z.object({
  params: z.object({
    contentId: uuidParam,
  }),
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    position: z.number().int().nonnegative().optional(),
    isRequired: z.boolean().optional(),
    videoSourceType: z.enum(['UPLOAD', 'EXTERNAL_LINK']).optional(),
    videoUrl: z.string().url().optional(),
    externalUrl: z.string().url().optional(),
    attachmentUrl: z.string().url().optional(),
    videoDurationSeconds: z.number().int().nonnegative().optional(),
  }),
});

export const addLevelQuestionsSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
  body: z.object({
    questions: z
      .array(
        z.object({
          questionText: z.string().min(2),
          type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CORRECT', 'TEXT']),
          position: z.number().int().nonnegative(),
          isRequired: z.boolean().optional(),
          points: z.number().int().positive().optional(),
          explanation: z.string().optional(),
          options: z
            .array(
              z.object({
                optionText: z.string().min(1),
                position: z.number().int().nonnegative(),
                isCorrect: z.boolean().optional(),
              }),
            )
            .optional(),
        }),
      )
      .min(1),
  }),
});

export const questionIdParamSchema = z.object({
  params: z.object({
    questionId: uuidParam,
  }),
});

export const updateQuestionSchema = z.object({
  params: z.object({
    questionId: uuidParam,
  }),
  body: z.object({
    questionText: z.string().min(2).optional(),
    type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CORRECT', 'TEXT']).optional(),
    position: z.number().int().nonnegative().optional(),
    isRequired: z.boolean().optional(),
    points: z.number().int().positive().optional(),
    explanation: z.string().optional(),
    options: z
      .array(
        z.object({
          optionText: z.string().min(1),
          position: z.number().int().nonnegative(),
          isCorrect: z.boolean().optional(),
        }),
      )
      .optional(),
  }),
});

export const getMyLevelByIdSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
});

export const updateVideoProgressSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
  body: z.object({
    contentId: uuidParam.optional(),
    eventType: z.enum(['START', 'PROGRESS', 'PAUSE', 'SEEK', 'COMPLETE']),
    watchSeconds: z.number().int().nonnegative().optional(),
    videoPositionSeconds: z.number().int().nonnegative().optional(),
    watchPercent: z.number().min(0).max(100).optional(),
  }),
});

export const createLevelAttemptSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
  body: z.object({
    answers: z
      .array(
        z.object({
          questionId: uuidParam,
          selectedOptionIds: z.array(uuidParam).optional(),
          textAnswer: z.string().optional(),
        }),
      )
      .min(1),
    timeSpentSeconds: z.number().int().nonnegative().optional(),
  }),
});

export const completeLevelSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
  body: z.object({
    force: z.boolean().optional(),
  }).optional(),
});

export const topicLeaderboardSchema = z.object({
  params: z.object({
    topicId: uuidParam,
  }),
});

export const topicAnalyticsSchema = z.object({
  params: z.object({
    topicId: uuidParam,
  }),
});

export const videoAnalyticsSchema = z.object({
  params: z.object({
    contentId: uuidParam,
  }),
});

export const levelAttemptAnalyticsSchema = z.object({
  params: z.object({
    levelId: uuidParam,
  }),
});
