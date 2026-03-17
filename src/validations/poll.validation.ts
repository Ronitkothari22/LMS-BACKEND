import { z } from 'zod';

const pollQuestionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  type: z.enum([
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'WORD_CLOUD',
    'RANKING',
    'SCALE',
    'OPEN_TEXT',
    'Q_AND_A',
  ]),
  order: z.number().default(0),
  options: z
    .array(
      z.object({
        text: z.string().min(1, 'Option text is required'),
        imageUrl: z.string().url().optional(),
        order: z.number(),
      }),
    )
    .optional(),
});

export const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
  type: z.enum([
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'WORD_CLOUD',
    'RANKING',
    'SCALE',
    'OPEN_TEXT',
    'Q_AND_A',
  ]),
  isLive: z.boolean().default(false),
  showResults: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  maxVotes: z.number().optional(),
  timeLimit: z.number().optional(),
  // For backward compatibility, still accept a single question
  question: z.string().optional(),
  // New field for multiple questions
  questions: z.array(pollQuestionSchema).optional(),
  // For backward compatibility, still accept options at the poll level
  options: z
    .array(
      z.object({
        text: z.string().min(1, 'Option text is required'),
        imageUrl: z.string().url().optional(),
        order: z.number(),
      }),
    )
    .optional(),
});

// Simplified schema for quick poll creation
export const quickCreatePollSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
  isPublic: z.boolean().default(false),
});

export const updatePollSchema = createPollSchema.partial().extend({
  id: z.string().uuid('Invalid poll ID'),
});

export const joinPollSchema = z.object({
  joiningCode: z
    .string()
    .length(6, 'Joining code must be exactly 6 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Joining code must be alphanumeric'),
});

// Schema for submitting responses
const submitPollResponseBaseSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  questionId: z.string().uuid('Invalid question ID').optional(),
  optionId: z.string().uuid('Invalid option ID').optional(),
  questionOptionId: z.string().uuid('Invalid question option ID').optional(),
  textResponse: z.string().optional(),
  ranking: z.number().optional(),
  scale: z.number().optional(),
  anonymous: z.boolean().default(false),
});

// Export the base schema for middleware validation
export const submitPollResponseSchema = submitPollResponseBaseSchema;

// Export the refined schema for controller validation
export const validatePollResponse = (data: z.infer<typeof submitPollResponseBaseSchema>) => {
  if (
    !(data.optionId || data.questionOptionId || data.textResponse || data.ranking || data.scale)
  ) {
    throw new Error('At least one response type must be provided');
  }
  return data;
};

// Schema for adding questions to a poll
export const addPollQuestionSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  question: z.string().min(1, 'Question text is required'),
  type: z.enum([
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'WORD_CLOUD',
    'RANKING',
    'SCALE',
    'OPEN_TEXT',
    'Q_AND_A',
  ]),
  order: z.number().default(0),
  timeLimit: z.number().optional(),
  options: z
    .array(
      z.object({
        text: z.string().min(1, 'Option text is required'),
        imageUrl: z.string().url().optional(),
        order: z.number(),
      }),
    )
    .optional(),
});

// Schema for standalone poll creation (without session)
export const createStandalonePollSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z
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
  isLive: z.boolean().default(false),
  showResults: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  maxVotes: z.number().optional(),
  timeLimit: z.number().optional(),
  // For backward compatibility, still accept a single question
  question: z.string().optional(),
  // New field for multiple questions
  questions: z.array(pollQuestionSchema).optional(),
  // For backward compatibility, still accept options at the poll level
  options: z
    .array(
      z.object({
        text: z.string().min(1, 'Option text is required'),
        imageUrl: z.string().url().optional(),
        order: z.number(),
      }),
    )
    .optional(),
});
