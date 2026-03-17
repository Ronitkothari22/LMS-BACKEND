import { z } from 'zod';

// Enum values for validation
export const FeedbackTypeEnum = z.enum(['SMILEY_SCALE', 'TEXT']);
export const SmileyRatingEnum = z.enum(['VERY_POOR', 'POOR', 'AVERAGE', 'GOOD', 'EXCELLENT']);

// Schema for creating feedback
export const createFeedbackSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().optional(),
    isAnonymous: z.boolean().optional().default(false),
    questions: z
      .array(
        z.object({
          question: z.string().min(1, 'Question text is required').max(500, 'Question too long'),
          type: FeedbackTypeEnum.optional().default('SMILEY_SCALE'),
          isRequired: z.boolean().optional().default(true),
        }),
      )
      .min(1, 'At least one question is required')
      .max(20, 'Maximum 20 questions allowed'),
  }),
});

// Schema for submitting feedback response
export const submitFeedbackResponseSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
  body: z.object({
    feedbackId: z.string().uuid('Invalid feedback ID format'), // Added feedbackId to specify which feedback form
    responses: z
      .array(
        z
          .object({
            questionId: z.string().uuid('Invalid question ID format'),
            rating: SmileyRatingEnum.optional(),
            textAnswer: z.string().max(1000, 'Text answer too long').optional(),
          })
          .refine(data => data.rating !== undefined || data.textAnswer !== undefined, {
            message: 'Either rating or text answer is required',
          }),
      )
      .min(1, 'At least one response is required'),
  }),
});

// Schema for updating feedback
export const updateFeedbackSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
  body: z.object({
    feedbackId: z.string().uuid('Invalid feedback ID format'), // Added feedbackId to specify which feedback form
    title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    isAnonymous: z.boolean().optional(),
  }),
});

// Schema for getting feedback results (just params validation)
export const getFeedbackResultsSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
});

// Schema for getting feedback (just params validation)
export const getFeedbackSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
});

// Schema for deleting feedback
export const deleteFeedbackSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
  body: z.object({
    feedbackId: z.string().uuid('Invalid feedback ID format'), // Added feedbackId to specify which feedback form
  }),
});

// Schema for adding a question to feedback form
export const addFeedbackQuestionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
  body: z.object({
    feedbackId: z.string().uuid('Invalid feedback ID format'),
    question: z.string().min(1, 'Question text is required').max(500, 'Question too long'),
    type: FeedbackTypeEnum.optional().default('SMILEY_SCALE'),
    isRequired: z.boolean().optional().default(true),
    order: z.number().int().positive().optional(),
  }),
});

// Schema for updating a feedback question
export const updateFeedbackQuestionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
    questionId: z.string().uuid('Invalid question ID format'),
  }),
  body: z.object({
    question: z
      .string()
      .min(1, 'Question text is required')
      .max(500, 'Question too long')
      .optional(),
    type: FeedbackTypeEnum.optional(),
    isRequired: z.boolean().optional(),
    order: z.number().int().positive().optional(),
  }),
});

// Schema for deleting a feedback question
export const deleteFeedbackQuestionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
    questionId: z.string().uuid('Invalid question ID format'),
  }),
});

// Schema for reordering feedback questions
export const reorderFeedbackQuestionsSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
  body: z.object({
    feedbackId: z.string().uuid('Invalid feedback ID format'),
    questionOrders: z
      .array(
        z.object({
          questionId: z.string().uuid('Invalid question ID format'),
          order: z.number().int().positive(),
        }),
      )
      .min(1, 'At least one question order is required'),
  }),
});

// Schema for getting a single feedback form
export const getSingleFeedbackSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
    feedbackId: z.string().uuid('Invalid feedback ID format'),
  }),
});

// Schema for submitting feedback when feedbackId is in URL params instead of body
export const submitFeedbackResponsePathSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
    feedbackId: z.string().uuid('Invalid feedback ID format'),
  }),
  body: z.object({
    responses: z
      .array(
        z
          .object({
            questionId: z.string().uuid('Invalid question ID format'),
            rating: SmileyRatingEnum.optional(),
            textAnswer: z.string().max(1000, 'Text answer too long').optional(),
          })
          .refine(data => data.rating !== undefined || data.textAnswer !== undefined, {
            message: 'Either rating or text answer is required',
          }),
      )
      .min(1, 'At least one response is required'),
  }),
});
