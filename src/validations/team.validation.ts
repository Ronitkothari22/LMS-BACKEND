import { z } from 'zod';

// Create team schema
export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
      .optional(),
    maxMembers: z.number().int().positive().max(100, 'Maximum 100 members allowed').optional(),
  }),
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

// Update team schema
export const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Team name is required').max(100, 'Team name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
      .optional(),
    maxMembers: z.number().int().positive().max(100, 'Maximum 100 members allowed').optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    teamId: z.string().uuid('Invalid team ID'),
  }),
});

// Get teams schema
export const getTeamsSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  query: z.object({
    includeInactive: z
      .string()
      .transform(val => val === 'true')
      .optional(),
  }),
});

// Get team by ID schema
export const getTeamByIdSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    teamId: z.string().uuid('Invalid team ID'),
  }),
});

// Add team member schema
export const addTeamMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: z.enum(['LEADER', 'MEMBER']).default('MEMBER'),
  }),
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    teamId: z.string().uuid('Invalid team ID'),
  }),
});

// Remove team member schema
export const removeTeamMemberSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    teamId: z.string().uuid('Invalid team ID'),
    userId: z.string().uuid('Invalid user ID'),
  }),
});

// Update team member role schema
export const updateTeamMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['LEADER', 'MEMBER']),
  }),
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    teamId: z.string().uuid('Invalid team ID'),
    userId: z.string().uuid('Invalid user ID'),
  }),
});

// Bulk assign members schema
export const bulkAssignMembersSchema = z.object({
  body: z.object({
    assignments: z
      .array(
        z.object({
          userId: z.string().uuid('Invalid user ID'),
          teamId: z.string().uuid('Invalid team ID'),
          role: z.enum(['LEADER', 'MEMBER']).default('MEMBER'),
        }),
      )
      .min(1, 'At least one assignment required'),
  }),
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

// Delete team schema
export const deleteTeamSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    teamId: z.string().uuid('Invalid team ID'),
  }),
});

// Auto-assign participants to teams schema
export const autoAssignTeamsSchema = z.object({
  body: z.object({
    strategy: z.enum(['RANDOM', 'BALANCED']).default('BALANCED'),
    teamsCount: z.number().int().positive().max(50, 'Maximum 50 teams allowed').optional(),
    maxMembersPerTeam: z
      .number()
      .int()
      .positive()
      .max(100, 'Maximum 100 members per team')
      .optional(),
  }),
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

// Get team leaderboard schema
export const getTeamLeaderboardSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  query: z.object({
    sortBy: z
      .enum(['quizScore', 'totalScore', 'totalXP', 'averageXP', 'participationRate', 'memberCount'])
      .default('totalScore'),
    order: z.enum(['asc', 'desc']).default('desc'),
    includeInactive: z
      .string()
      .transform(val => val === 'true')
      .optional(),
  }),
});

// Award points to team schema
export const awardTeamPointsSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    teamId: z.string().uuid('Invalid team ID'),
  }),
  body: z.object({
    points: z
      .number()
      .int('Points must be an integer')
      .min(-1000, 'Minimum -1000 points')
      .max(1000, 'Maximum 1000 points'),
    reason: z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters'),
    category: z.string().max(100, 'Category cannot exceed 100 characters').optional(),
  }),
});

// Get team point awards history schema
export const getTeamPointAwardsSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    teamId: z.string().uuid('Invalid team ID'),
  }),
  query: z.object({
    limit: z
      .string()
      .transform(val => parseInt(val))
      .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('50'),
    offset: z
      .string()
      .transform(val => parseInt(val))
      .refine(val => !isNaN(val) && val >= 0, 'Offset must be non-negative')
      .optional()
      .default('0'),
  }),
});

// Award individual points to a user/candidate schema
export const awardIndividualPointsSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    userId: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    points: z
      .number()
      .int('Points must be an integer')
      .min(-1000, 'Minimum -1000 points')
      .max(1000, 'Maximum 1000 points'),
    reason: z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters'),
    category: z.string().max(100, 'Category cannot exceed 100 characters').optional(),
  }),
});

// Get individual point awards history for a user schema
export const getIndividualPointAwardsSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    userId: z.string().uuid('Invalid user ID'),
  }),
  query: z.object({
    limit: z
      .string()
      .transform(val => parseInt(val))
      .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('50'),
    offset: z
      .string()
      .transform(val => parseInt(val))
      .refine(val => !isNaN(val) && val >= 0, 'Offset must be non-negative')
      .optional()
      .default('0'),
  }),
});

// Get all individual point awards in a session schema
export const getSessionIndividualPointAwardsSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  query: z.object({
    limit: z
      .string()
      .transform(val => parseInt(val))
      .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('50'),
    offset: z
      .string()
      .transform(val => parseInt(val))
      .refine(val => !isNaN(val) && val >= 0, 'Offset must be non-negative')
      .optional()
      .default('0'),
    teamId: z.string().uuid('Invalid team ID').optional(), // Filter by team
    category: z.string().max(100, 'Category cannot exceed 100 characters').optional(), // Filter by category
    sortBy: z.enum(['createdAt', 'points', 'userName']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});
