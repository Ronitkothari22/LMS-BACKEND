"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadQuizResultsExcelSchema = exports.updateQuestionSchema = exports.updateQuizSchema = exports.submitQuizResponseSchema = exports.joinQuizSchema = exports.addQuestionsSchema = exports.addQuestionSchema = exports.createQuizSchema = void 0;
const zod_1 = require("zod");
exports.createQuizSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        sessionId: zod_1.z.string().min(1, 'Session ID is required'),
        timeLimitSeconds: zod_1.z.number().min(0, 'Time limit must be a positive number').optional(),
        pointsPerQuestion: zod_1.z.number().min(1, 'Points per question must be at least 1'),
        passingScore: zod_1.z.number().min(0, 'Passing score must be a positive number').optional(),
        totalMarks: zod_1.z.number().int().positive('Total marks must be a positive integer').optional(),
        questions: zod_1.z
            .array(zod_1.z.object({
            text: zod_1.z.string().min(1, 'Question text is required'),
            type: zod_1.z.enum(['MULTIPLE_CHOICE', 'MULTI_CORRECT', 'TEXT', 'MATCHING']),
            options: zod_1.z.array(zod_1.z.string()).optional(),
            correctAnswer: zod_1.z.string().min(1, 'Correct answer must be a valid string'),
            order: zod_1.z.number().optional(),
            imageUrl: zod_1.z.string().url().nullable().optional(),
            marks: zod_1.z.number().int().positive('Marks must be a positive integer').optional(),
            timeTaken: zod_1.z.number().min(0, 'Time taken must be a positive number').optional(),
        }))
            .optional(),
    }),
});
exports.addQuestionSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z.string().min(1, 'Question text is required'),
        type: zod_1.z.enum(['MULTIPLE_CHOICE', 'MULTI_CORRECT', 'TEXT', 'MATCHING']),
        options: zod_1.z.array(zod_1.z.string()).optional(),
        correctAnswer: zod_1.z.string().min(1, 'Correct answer must be a valid string'),
        imageUrl: zod_1.z.string().url().nullable().optional(),
        timeTaken: zod_1.z.number().min(0, 'Time taken must be a positive number').optional(),
    }),
});
exports.addQuestionsSchema = zod_1.z.object({
    body: zod_1.z.array(zod_1.z.object({
        text: zod_1.z.string().min(1, 'Question text is required'),
        type: zod_1.z.enum(['MULTIPLE_CHOICE', 'MULTI_CORRECT', 'TEXT', 'MATCHING']),
        options: zod_1.z.array(zod_1.z.string()).optional(),
        correctAnswer: zod_1.z.string().min(1, 'Correct answer must be a valid string'),
        imageUrl: zod_1.z.string().url().nullable().optional(),
        marks: zod_1.z.number().int().positive('Marks must be a positive integer').optional(),
        timeTaken: zod_1.z.number().min(0, 'Time taken must be a positive number').optional(),
    })),
});
exports.joinQuizSchema = zod_1.z.object({
    body: zod_1.z.object({}).optional(),
    params: zod_1.z.object({
        quizId: zod_1.z.string().min(1, 'Quiz ID is required'),
    }),
});
exports.submitQuizResponseSchema = zod_1.z.object({
    body: zod_1.z.object({
        answers: zod_1.z.record(zod_1.z.string()),
        attemptTime: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), {
            message: 'Invalid date format for attemptTime',
        }),
    }),
    params: zod_1.z.object({
        quizId: zod_1.z.string().min(1, 'Quiz ID is required'),
    }),
});
exports.updateQuizSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').optional(),
        timeLimitSeconds: zod_1.z.number().min(0, 'Time limit must be a positive number').optional(),
        pointsPerQuestion: zod_1.z
            .number()
            .min(0, 'Points per question must be a positive number')
            .optional(),
        passingScore: zod_1.z.number().min(0, 'Passing score must be a positive number').optional(),
        totalMarks: zod_1.z.number().int().positive('Total marks must be a positive integer').optional(),
    }),
});
exports.updateQuestionSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z.string().min(1, 'Question text is required'),
        type: zod_1.z.enum(['MULTIPLE_CHOICE', 'MULTI_CORRECT', 'TEXT', 'MATCHING']),
        options: zod_1.z.array(zod_1.z.string()).optional(),
        correctAnswer: zod_1.z.string().optional(),
    }),
});
exports.downloadQuizResultsExcelSchema = zod_1.z.object({
    params: zod_1.z.object({
        quizId: zod_1.z.string().min(1, 'Quiz ID is required'),
    }),
});
//# sourceMappingURL=quiz.validation.js.map