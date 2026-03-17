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
