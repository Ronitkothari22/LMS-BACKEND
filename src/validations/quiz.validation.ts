import { z } from 'zod';

export const createQuizSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    sessionId: z.string().min(1, 'Session ID is required'),
    timeLimitSeconds: z.number().min(0, 'Time limit must be a positive number').optional(),
    pointsPerQuestion: z.number().min(1, 'Points per question must be at least 1'),
    passingScore: z.number().min(0, 'Passing score must be a positive number').optional(),
    totalMarks: z.number().int().positive('Total marks must be a positive integer').optional(),
    questions: z
      .array(
        z.object({
          text: z.string().min(1, 'Question text is required'),
          type: z.enum(['MULTIPLE_CHOICE', 'MULTI_CORRECT', 'TEXT', 'MATCHING']),
          options: z.array(z.string()).optional(),
          correctAnswer: z.string().min(1, 'Correct answer must be a valid string'),
          order: z.number().optional(),
          imageUrl: z.string().url().nullable().optional(),
          marks: z.number().int().positive('Marks must be a positive integer').optional(),
          timeTaken: z.number().min(0, 'Time taken must be a positive number').optional(),
        }),
      )
      .optional(),
  }),
});

export const addQuestionSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'MULTI_CORRECT', 'TEXT', 'MATCHING']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1, 'Correct answer must be a valid string'),
    imageUrl: z.string().url().nullable().optional(),
    timeTaken: z.number().min(0, 'Time taken must be a positive number').optional(),
  }),
});

export const addQuestionsSchema = z.object({
  body: z.array(
    z.object({
      text: z.string().min(1, 'Question text is required'),
      type: z.enum(['MULTIPLE_CHOICE', 'MULTI_CORRECT', 'TEXT', 'MATCHING']),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().min(1, 'Correct answer must be a valid string'),
      imageUrl: z.string().url().nullable().optional(),
      marks: z.number().int().positive('Marks must be a positive integer').optional(),
      timeTaken: z.number().min(0, 'Time taken must be a positive number').optional(),
    }),
  ),
});

export const joinQuizSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    quizId: z.string().min(1, 'Quiz ID is required'),
  }),
});

export const submitQuizResponseSchema = z.object({
  body: z.object({
    answers: z.record(z.string()), // Ensure answers are keyed by question ID
    attemptTime: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: 'Invalid date format for attemptTime',
    }),
  }),
  params: z.object({
    quizId: z.string().min(1, 'Quiz ID is required'),
  }),
});

// New validation schema for updating a quiz
export const updateQuizSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').optional(),
    timeLimitSeconds: z.number().min(0, 'Time limit must be a positive number').optional(),
    pointsPerQuestion: z
      .number()
      .min(0, 'Points per question must be a positive number')
      .optional(),
    passingScore: z.number().min(0, 'Passing score must be a positive number').optional(),
    totalMarks: z.number().int().positive('Total marks must be a positive integer').optional(),
  }),
});

export const updateQuestionSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'MULTI_CORRECT', 'TEXT', 'MATCHING']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
  }),
});

export const downloadQuizResultsExcelSchema = z.object({
  params: z.object({
    quizId: z.string().min(1, 'Quiz ID is required'),
  }),
});
