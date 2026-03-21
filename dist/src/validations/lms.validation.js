"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelAttemptAnalyticsSchema = exports.videoAnalyticsSchema = exports.topicAnalyticsSchema = exports.topicLeaderboardSchema = exports.completeLevelSchema = exports.createLevelAttemptSchema = exports.updateVideoProgressSchema = exports.getMyLevelByIdSchema = exports.updateQuestionSchema = exports.questionIdParamSchema = exports.addLevelQuestionsSchema = exports.updateLevelContentSchema = exports.contentIdParamSchema = exports.addLevelReadingContentSchema = exports.addLevelVideoContentSchema = exports.updateLevelSchema = exports.levelIdParamSchema = exports.createLevelSchema = exports.updateTopicSchema = exports.topicIdParamSchema = exports.getTopicsSchema = exports.createTopicSchema = void 0;
const zod_1 = require("zod");
const uuidParam = zod_1.z.string().uuid('Invalid ID format');
const lmsVisibilitySchema = zod_1.z.enum(['ALL', 'SESSION']);
exports.createTopicSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(2, 'Title must be at least 2 characters'),
        description: zod_1.z.string().optional(),
        slug: zod_1.z.string().min(2).optional(),
        visibility: lmsVisibilitySchema.optional(),
        sessionId: uuidParam.optional(),
        isPublished: zod_1.z.boolean().optional(),
        position: zod_1.z.number().int().nonnegative().optional(),
        estimatedDurationMinutes: zod_1.z.number().int().positive().optional(),
    })
        .superRefine((body, ctx) => {
        if (body.visibility === 'SESSION' && !body.sessionId) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['sessionId'],
                message: 'sessionId is required when visibility is SESSION',
            });
        }
    }),
});
exports.getTopicsSchema = zod_1.z.object({
    query: zod_1.z.object({
        isPublished: zod_1.z.string().optional(),
        includeInactive: zod_1.z.string().optional(),
    }),
});
exports.topicIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        topicId: uuidParam,
    }),
});
exports.updateTopicSchema = zod_1.z.object({
    params: zod_1.z.object({
        topicId: uuidParam,
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional(),
        slug: zod_1.z.string().min(2).optional(),
        visibility: lmsVisibilitySchema.optional(),
        sessionId: zod_1.z.union([uuidParam, zod_1.z.null()]).optional(),
        isPublished: zod_1.z.boolean().optional(),
        isActive: zod_1.z.boolean().optional(),
        position: zod_1.z.number().int().nonnegative().optional(),
        estimatedDurationMinutes: zod_1.z.number().int().positive().optional(),
    }),
});
exports.createLevelSchema = zod_1.z.object({
    params: zod_1.z.object({
        topicId: uuidParam,
    }),
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(2),
        description: zod_1.z.string().optional(),
        position: zod_1.z.number().int().nonnegative(),
        visibility: lmsVisibilitySchema.optional(),
        sessionId: uuidParam.optional(),
        isPublished: zod_1.z.boolean().optional(),
        requireVideoCompletion: zod_1.z.boolean().optional(),
        minVideoWatchPercent: zod_1.z.number().min(0).max(100).optional(),
        requireQuizPass: zod_1.z.boolean().optional(),
        quizPassingPercent: zod_1.z.number().min(0).max(100).optional(),
        requireReadingAcknowledgement: zod_1.z.boolean().optional(),
        xpOnCompletion: zod_1.z.number().int().nonnegative().optional(),
    })
        .superRefine((body, ctx) => {
        if (body.visibility === 'SESSION' && !body.sessionId) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['sessionId'],
                message: 'sessionId is required when visibility is SESSION',
            });
        }
    }),
});
exports.levelIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
});
exports.updateLevelSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional(),
        position: zod_1.z.number().int().nonnegative().optional(),
        visibility: lmsVisibilitySchema.optional(),
        sessionId: zod_1.z.union([uuidParam, zod_1.z.null()]).optional(),
        isPublished: zod_1.z.boolean().optional(),
        requireVideoCompletion: zod_1.z.boolean().optional(),
        minVideoWatchPercent: zod_1.z.number().min(0).max(100).optional(),
        requireQuizPass: zod_1.z.boolean().optional(),
        quizPassingPercent: zod_1.z.number().min(0).max(100).optional(),
        requireReadingAcknowledgement: zod_1.z.boolean().optional(),
        xpOnCompletion: zod_1.z.number().int().nonnegative().optional(),
    }),
});
exports.addLevelVideoContentSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(2),
        description: zod_1.z.string().optional(),
        isRequired: zod_1.z.boolean().optional(),
        videoSourceType: zod_1.z.enum(['UPLOAD', 'EXTERNAL_LINK']),
        videoUrl: zod_1.z.string().url().optional(),
        externalUrl: zod_1.z.string().url().optional(),
        videoDurationSeconds: zod_1.z.number().int().nonnegative().optional(),
        position: zod_1.z.number().int().nonnegative(),
    }),
});
exports.addLevelReadingContentSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(2),
        description: zod_1.z.string().optional(),
        attachmentUrl: zod_1.z.string().url().optional(),
        externalUrl: zod_1.z.string().url().optional(),
        isRequired: zod_1.z.boolean().optional(),
        position: zod_1.z.number().int().nonnegative(),
    }),
});
exports.contentIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        contentId: uuidParam,
    }),
});
exports.updateLevelContentSchema = zod_1.z.object({
    params: zod_1.z.object({
        contentId: uuidParam,
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional(),
        position: zod_1.z.number().int().nonnegative().optional(),
        isRequired: zod_1.z.boolean().optional(),
        videoSourceType: zod_1.z.enum(['UPLOAD', 'EXTERNAL_LINK']).optional(),
        videoUrl: zod_1.z.string().url().optional(),
        externalUrl: zod_1.z.string().url().optional(),
        attachmentUrl: zod_1.z.string().url().optional(),
        videoDurationSeconds: zod_1.z.number().int().nonnegative().optional(),
    }),
});
exports.addLevelQuestionsSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
    body: zod_1.z.object({
        questions: zod_1.z
            .array(zod_1.z.object({
            questionText: zod_1.z.string().min(2),
            type: zod_1.z.enum(['SINGLE_CHOICE', 'MULTIPLE_CORRECT', 'TEXT']),
            position: zod_1.z.number().int().nonnegative(),
            isRequired: zod_1.z.boolean().optional(),
            points: zod_1.z.number().int().positive().optional(),
            explanation: zod_1.z.string().optional(),
            options: zod_1.z
                .array(zod_1.z.object({
                optionText: zod_1.z.string().min(1),
                position: zod_1.z.number().int().nonnegative(),
                isCorrect: zod_1.z.boolean().optional(),
            }))
                .optional(),
        }))
            .min(1),
    }),
});
exports.questionIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        questionId: uuidParam,
    }),
});
exports.updateQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        questionId: uuidParam,
    }),
    body: zod_1.z.object({
        questionText: zod_1.z.string().min(2).optional(),
        type: zod_1.z.enum(['SINGLE_CHOICE', 'MULTIPLE_CORRECT', 'TEXT']).optional(),
        position: zod_1.z.number().int().nonnegative().optional(),
        isRequired: zod_1.z.boolean().optional(),
        points: zod_1.z.number().int().positive().optional(),
        explanation: zod_1.z.string().optional(),
        options: zod_1.z
            .array(zod_1.z.object({
            optionText: zod_1.z.string().min(1),
            position: zod_1.z.number().int().nonnegative(),
            isCorrect: zod_1.z.boolean().optional(),
        }))
            .optional(),
    }),
});
exports.getMyLevelByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
});
exports.updateVideoProgressSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
    body: zod_1.z.object({
        contentId: uuidParam.optional(),
        eventType: zod_1.z.enum(['START', 'PROGRESS', 'PAUSE', 'SEEK', 'COMPLETE']),
        watchSeconds: zod_1.z.number().int().nonnegative().optional(),
        videoPositionSeconds: zod_1.z.number().int().nonnegative().optional(),
        watchPercent: zod_1.z.number().min(0).max(100).optional(),
    }),
});
exports.createLevelAttemptSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
    body: zod_1.z.object({
        answers: zod_1.z
            .array(zod_1.z.object({
            questionId: uuidParam,
            selectedOptionIds: zod_1.z.array(uuidParam).optional(),
            textAnswer: zod_1.z.string().optional(),
        }))
            .min(1),
        timeSpentSeconds: zod_1.z.number().int().nonnegative().optional(),
    }),
});
exports.completeLevelSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
    body: zod_1.z.object({
        force: zod_1.z.boolean().optional(),
    }).optional(),
});
exports.topicLeaderboardSchema = zod_1.z.object({
    params: zod_1.z.object({
        topicId: uuidParam,
    }),
});
exports.topicAnalyticsSchema = zod_1.z.object({
    params: zod_1.z.object({
        topicId: uuidParam,
    }),
});
exports.videoAnalyticsSchema = zod_1.z.object({
    params: zod_1.z.object({
        contentId: uuidParam,
    }),
});
exports.levelAttemptAnalyticsSchema = zod_1.z.object({
    params: zod_1.z.object({
        levelId: uuidParam,
    }),
});
//# sourceMappingURL=lms.validation.js.map