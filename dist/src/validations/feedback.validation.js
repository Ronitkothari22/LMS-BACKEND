"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitFeedbackResponsePathSchema = exports.getSingleFeedbackSchema = exports.reorderFeedbackQuestionsSchema = exports.deleteFeedbackQuestionSchema = exports.updateFeedbackQuestionSchema = exports.addFeedbackQuestionSchema = exports.deleteFeedbackSchema = exports.getFeedbackSchema = exports.getFeedbackResultsSchema = exports.updateFeedbackSchema = exports.submitFeedbackResponseSchema = exports.createFeedbackSchema = exports.SmileyRatingEnum = exports.FeedbackTypeEnum = void 0;
const zod_1 = require("zod");
exports.FeedbackTypeEnum = zod_1.z.enum(['SMILEY_SCALE', 'TEXT']);
exports.SmileyRatingEnum = zod_1.z.enum(['VERY_POOR', 'POOR', 'AVERAGE', 'GOOD', 'EXCELLENT']);
exports.createFeedbackSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long'),
        description: zod_1.z.string().optional(),
        isAnonymous: zod_1.z.boolean().optional().default(false),
        questions: zod_1.z
            .array(zod_1.z.object({
            question: zod_1.z.string().min(1, 'Question text is required').max(500, 'Question too long'),
            type: exports.FeedbackTypeEnum.optional().default('SMILEY_SCALE'),
            isRequired: zod_1.z.boolean().optional().default(true),
        }))
            .min(1, 'At least one question is required')
            .max(20, 'Maximum 20 questions allowed'),
    }),
});
exports.submitFeedbackResponseSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    }),
    body: zod_1.z.object({
        feedbackId: zod_1.z.string().uuid('Invalid feedback ID format'),
        responses: zod_1.z
            .array(zod_1.z
            .object({
            questionId: zod_1.z.string().uuid('Invalid question ID format'),
            rating: exports.SmileyRatingEnum.optional(),
            textAnswer: zod_1.z.string().max(1000, 'Text answer too long').optional(),
        })
            .refine(data => data.rating !== undefined || data.textAnswer !== undefined, {
            message: 'Either rating or text answer is required',
        }))
            .min(1, 'At least one response is required'),
    }),
});
exports.updateFeedbackSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    }),
    body: zod_1.z.object({
        feedbackId: zod_1.z.string().uuid('Invalid feedback ID format'),
        title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
        description: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
        isAnonymous: zod_1.z.boolean().optional(),
    }),
});
exports.getFeedbackResultsSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    }),
});
exports.getFeedbackSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    }),
});
exports.deleteFeedbackSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    }),
    body: zod_1.z.object({
        feedbackId: zod_1.z.string().uuid('Invalid feedback ID format'),
    }),
});
exports.addFeedbackQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    }),
    body: zod_1.z.object({
        feedbackId: zod_1.z.string().uuid('Invalid feedback ID format'),
        question: zod_1.z.string().min(1, 'Question text is required').max(500, 'Question too long'),
        type: exports.FeedbackTypeEnum.optional().default('SMILEY_SCALE'),
        isRequired: zod_1.z.boolean().optional().default(true),
        order: zod_1.z.number().int().positive().optional(),
    }),
});
exports.updateFeedbackQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
        questionId: zod_1.z.string().uuid('Invalid question ID format'),
    }),
    body: zod_1.z.object({
        question: zod_1.z
            .string()
            .min(1, 'Question text is required')
            .max(500, 'Question too long')
            .optional(),
        type: exports.FeedbackTypeEnum.optional(),
        isRequired: zod_1.z.boolean().optional(),
        order: zod_1.z.number().int().positive().optional(),
    }),
});
exports.deleteFeedbackQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
        questionId: zod_1.z.string().uuid('Invalid question ID format'),
    }),
});
exports.reorderFeedbackQuestionsSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    }),
    body: zod_1.z.object({
        feedbackId: zod_1.z.string().uuid('Invalid feedback ID format'),
        questionOrders: zod_1.z
            .array(zod_1.z.object({
            questionId: zod_1.z.string().uuid('Invalid question ID format'),
            order: zod_1.z.number().int().positive(),
        }))
            .min(1, 'At least one question order is required'),
    }),
});
exports.getSingleFeedbackSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
        feedbackId: zod_1.z.string().uuid('Invalid feedback ID format'),
    }),
});
exports.submitFeedbackResponsePathSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
        feedbackId: zod_1.z.string().uuid('Invalid feedback ID format'),
    }),
    body: zod_1.z.object({
        responses: zod_1.z
            .array(zod_1.z
            .object({
            questionId: zod_1.z.string().uuid('Invalid question ID format'),
            rating: exports.SmileyRatingEnum.optional(),
            textAnswer: zod_1.z.string().max(1000, 'Text answer too long').optional(),
        })
            .refine(data => data.rating !== undefined || data.textAnswer !== undefined, {
            message: 'Either rating or text answer is required',
        }))
            .min(1, 'At least one response is required'),
    }),
});
//# sourceMappingURL=feedback.validation.js.map