import { z } from 'zod';
import { SessionState } from '@prisma/client';

export const bulkSessionInviteSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

export const addEmailToSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  body: z
    .object({
      email: z.string().email('Invalid email format').optional(),
      emails: z.array(z.string().email('Invalid email format')).optional(),
    })
    .refine(data => data.email || (data.emails && data.emails.length > 0), {
      message: 'Either email or emails array must be provided',
      path: ['email'],
    }),
});

export const createSessionSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    allowGuests: z.boolean().default(false),
    participants: z.array(z.string().email('Invalid email format')).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
  }),
});

export const updateSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  body: z.object({
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    maxParticipants: z.number().int().positive().optional(),
    allowGuests: z.boolean().optional(),
    state: z.nativeEnum(SessionState).optional(),
  }),
});

export const joinSessionSchema = z.object({
  body: z.object({
    joiningCode: z.string().length(6, 'Joining code must be 6 characters'),
  }),
});

export const toggleSessionStatusSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

export const getSessionsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('10'),
    state: z.nativeEnum(SessionState).optional(),
    isActive: z
      .string()
      .transform(val => val === 'true')
      .optional(),
  }),
});

export const getSessionByIdSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

export const getSessionQuizScoringSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

export const assignUsersToSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  body: z.object({
    userIds: z
      .array(z.string().uuid('Invalid user ID'))
      .min(1, 'At least one user ID must be provided'),
  }),
});

export const deleteSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

// ==========================================
// Session Assignment Validation Schemas
// ==========================================

const uuidParam = z.string().uuid('Invalid ID format');
const assignmentFileExt = z.enum(['pdf', 'doc', 'docx']);
const assignmentSubmissionFilter = z.enum(['submitted', 'late', 'missing']);

const coerceBoolean = z.preprocess(value => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
}, z.boolean());

const coercePositiveInt = z.preprocess(value => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
}, z.number().int().positive());

const coercePositiveIntOptional = coercePositiveInt.optional();

const coerceNonNegativeInt = z.preprocess(value => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
}, z.number().int().nonnegative());

const coerceDate = z.preprocess(value => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return value;
}, z.date({ invalid_type_error: 'Invalid date format' }));

const assignmentBaseBody = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  instructions: z.string().max(10000, 'Instructions too long').optional(),
  dueDate: coerceDate,
  allowLateSubmission: coerceBoolean.optional(),
  maxFileSizeMb: coercePositiveIntOptional,
  maxFilesPerSubmission: coercePositiveIntOptional,
  allowedFileTypes: z.array(assignmentFileExt).min(1).max(10).optional(),
  isActive: coerceBoolean.optional(),
});

export const createSessionAssignmentSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
  }),
  body: assignmentBaseBody.superRefine((body, ctx) => {
    if (body.maxFileSizeMb !== undefined && body.maxFileSizeMb > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxFileSizeMb'],
        message: 'maxFileSizeMb cannot be more than 100 MB',
      });
    }
    if (body.maxFilesPerSubmission !== undefined && body.maxFilesPerSubmission > 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxFilesPerSubmission'],
        message: 'maxFilesPerSubmission cannot be more than 20',
      });
    }
  }),
});

export const updateSessionAssignmentSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
    assignmentId: uuidParam,
  }),
  body: assignmentBaseBody
    .partial()
    .refine(body => Object.keys(body).length > 0, 'At least one field must be provided')
    .superRefine((body, ctx) => {
      if (body.maxFileSizeMb !== undefined && body.maxFileSizeMb > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxFileSizeMb'],
          message: 'maxFileSizeMb cannot be more than 100 MB',
        });
      }
      if (body.maxFilesPerSubmission !== undefined && body.maxFilesPerSubmission > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxFilesPerSubmission'],
          message: 'maxFilesPerSubmission cannot be more than 20',
        });
      }
    }),
});

export const sessionAssignmentParamsSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
    assignmentId: uuidParam,
  }),
});

export const listSessionAssignmentsSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
  }),
  query: z.object({
    includeInactive: coerceBoolean.optional(),
    page: coercePositiveIntOptional,
    limit: coercePositiveIntOptional,
  }),
});

export const listSessionAssignmentSubmissionsSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
    assignmentId: uuidParam,
  }),
  query: z.object({
    filter: assignmentSubmissionFilter.optional(),
    query: z.string().max(200).optional(),
    page: coercePositiveIntOptional,
    limit: coercePositiveIntOptional,
  }),
});

export const sessionAssignmentTimelineSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
    assignmentId: uuidParam,
  }),
  query: z.object({
    page: coercePositiveIntOptional,
    limit: coercePositiveIntOptional,
  }),
});

export const downloadSessionAssignmentFileSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
    assignmentId: uuidParam,
    submissionId: uuidParam,
    fileId: uuidParam,
  }),
});

export const getMySessionAssignmentsSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
  }),
  query: z.object({
    upcomingOnly: coerceBoolean.optional(),
    page: coercePositiveIntOptional,
    limit: coercePositiveIntOptional,
  }),
});

export const mySessionAssignmentParamsSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
    assignmentId: uuidParam,
  }),
});

export const createMySessionAssignmentSubmissionSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
    assignmentId: uuidParam,
  }),
  body: z
    .object({
      replaceExisting: coerceBoolean.optional(),
      fileCount: coerceNonNegativeInt.optional(),
    })
    .optional(),
});

export const getMySessionAssignmentSubmissionSchema = z.object({
  params: z.object({
    sessionId: uuidParam,
    assignmentId: uuidParam,
  }),
});
