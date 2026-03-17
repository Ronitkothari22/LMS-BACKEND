"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStandalonePollSchema = exports.addPollQuestionSchema = exports.validatePollResponse = exports.submitPollResponseSchema = exports.joinPollSchema = exports.updatePollSchema = exports.quickCreatePollSchema = exports.createPollSchema = void 0;
const zod_1 = require("zod");
const pollQuestionSchema = zod_1.z.object({
    question: zod_1.z.string().min(1, 'Question text is required'),
    type: zod_1.z.enum([
        'SINGLE_CHOICE',
        'MULTIPLE_CHOICE',
        'WORD_CLOUD',
        'RANKING',
        'SCALE',
        'OPEN_TEXT',
        'Q_AND_A',
    ]),
    order: zod_1.z.number().default(0),
    options: zod_1.z
        .array(zod_1.z.object({
        text: zod_1.z.string().min(1, 'Option text is required'),
        imageUrl: zod_1.z.string().url().optional(),
        order: zod_1.z.number(),
    }))
        .optional(),
});
exports.createPollSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    sessionId: zod_1.z.string().uuid('Invalid session ID').optional(),
    type: zod_1.z.enum([
        'SINGLE_CHOICE',
        'MULTIPLE_CHOICE',
        'WORD_CLOUD',
        'RANKING',
        'SCALE',
        'OPEN_TEXT',
        'Q_AND_A',
    ]),
    isLive: zod_1.z.boolean().default(false),
    showResults: zod_1.z.boolean().default(false),
    isPublic: zod_1.z.boolean().default(false),
    maxVotes: zod_1.z.number().optional(),
    timeLimit: zod_1.z.number().optional(),
    question: zod_1.z.string().optional(),
    questions: zod_1.z.array(pollQuestionSchema).optional(),
    options: zod_1.z
        .array(zod_1.z.object({
        text: zod_1.z.string().min(1, 'Option text is required'),
        imageUrl: zod_1.z.string().url().optional(),
        order: zod_1.z.number(),
    }))
        .optional(),
});
exports.quickCreatePollSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    sessionId: zod_1.z.string().uuid('Invalid session ID').optional(),
    isPublic: zod_1.z.boolean().default(false),
});
exports.updatePollSchema = exports.createPollSchema.partial().extend({
    id: zod_1.z.string().uuid('Invalid poll ID'),
});
exports.joinPollSchema = zod_1.z.object({
    joiningCode: zod_1.z
        .string()
        .length(6, 'Joining code must be exactly 6 characters')
        .regex(/^[A-Za-z0-9]+$/, 'Joining code must be alphanumeric'),
});
const submitPollResponseBaseSchema = zod_1.z.object({
    pollId: zod_1.z.string().uuid('Invalid poll ID'),
    questionId: zod_1.z.string().uuid('Invalid question ID').optional(),
    optionId: zod_1.z.string().uuid('Invalid option ID').optional(),
    questionOptionId: zod_1.z.string().uuid('Invalid question option ID').optional(),
    textResponse: zod_1.z.string().optional(),
    ranking: zod_1.z.number().optional(),
    scale: zod_1.z.number().optional(),
    anonymous: zod_1.z.boolean().default(false),
});
exports.submitPollResponseSchema = submitPollResponseBaseSchema;
const validatePollResponse = (data) => {
    if (!(data.optionId || data.questionOptionId || data.textResponse || data.ranking || data.scale)) {
        throw new Error('At least one response type must be provided');
    }
    return data;
};
exports.validatePollResponse = validatePollResponse;
exports.addPollQuestionSchema = zod_1.z.object({
    pollId: zod_1.z.string().uuid('Invalid poll ID'),
    question: zod_1.z.string().min(1, 'Question text is required'),
    type: zod_1.z.enum([
        'SINGLE_CHOICE',
        'MULTIPLE_CHOICE',
        'WORD_CLOUD',
        'RANKING',
        'SCALE',
        'OPEN_TEXT',
        'Q_AND_A',
    ]),
    order: zod_1.z.number().default(0),
    timeLimit: zod_1.z.number().optional(),
    options: zod_1.z
        .array(zod_1.z.object({
        text: zod_1.z.string().min(1, 'Option text is required'),
        imageUrl: zod_1.z.string().url().optional(),
        order: zod_1.z.number(),
    }))
        .optional(),
});
exports.createStandalonePollSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    type: zod_1.z
        .enum([
        'SINGLE_CHOICE',
        'MULTIPLE_CHOICE',
        'WORD_CLOUD',
        'RANKING',
        'SCALE',
        'OPEN_TEXT',
        'Q_AND_A',
    ])
        .default('SINGLE_CHOICE'),
    isLive: zod_1.z.boolean().default(false),
    showResults: zod_1.z.boolean().default(false),
    isPublic: zod_1.z.boolean().default(true),
    maxVotes: zod_1.z.number().optional(),
    timeLimit: zod_1.z.number().optional(),
    question: zod_1.z.string().optional(),
    questions: zod_1.z.array(pollQuestionSchema).optional(),
    options: zod_1.z
        .array(zod_1.z.object({
        text: zod_1.z.string().min(1, 'Option text is required'),
        imageUrl: zod_1.z.string().url().optional(),
        order: zod_1.z.number(),
    }))
        .optional(),
});
//# sourceMappingURL=poll.validation.js.map