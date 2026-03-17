"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionIndividualPointAwardsSchema = exports.getIndividualPointAwardsSchema = exports.awardIndividualPointsSchema = exports.getTeamPointAwardsSchema = exports.awardTeamPointsSchema = exports.getTeamLeaderboardSchema = exports.autoAssignTeamsSchema = exports.deleteTeamSchema = exports.bulkAssignMembersSchema = exports.updateTeamMemberRoleSchema = exports.removeTeamMemberSchema = exports.addTeamMemberSchema = exports.getTeamByIdSchema = exports.getTeamsSchema = exports.updateTeamSchema = exports.createTeamSchema = void 0;
const zod_1 = require("zod");
exports.createTeamSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
        description: zod_1.z.string().max(500, 'Description too long').optional(),
        color: zod_1.z
            .string()
            .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
            .optional(),
        maxMembers: zod_1.z.number().int().positive().max(100, 'Maximum 100 members allowed').optional(),
    }),
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
});
exports.updateTeamSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Team name is required').max(100, 'Team name too long').optional(),
        description: zod_1.z.string().max(500, 'Description too long').optional(),
        color: zod_1.z
            .string()
            .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
            .optional(),
        maxMembers: zod_1.z.number().int().positive().max(100, 'Maximum 100 members allowed').optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        teamId: zod_1.z.string().uuid('Invalid team ID'),
    }),
});
exports.getTeamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
    query: zod_1.z.object({
        includeInactive: zod_1.z
            .string()
            .transform(val => val === 'true')
            .optional(),
    }),
});
exports.getTeamByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        teamId: zod_1.z.string().uuid('Invalid team ID'),
    }),
});
exports.addTeamMemberSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().uuid('Invalid user ID'),
        role: zod_1.z.enum(['LEADER', 'MEMBER']).default('MEMBER'),
    }),
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        teamId: zod_1.z.string().uuid('Invalid team ID'),
    }),
});
exports.removeTeamMemberSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        teamId: zod_1.z.string().uuid('Invalid team ID'),
        userId: zod_1.z.string().uuid('Invalid user ID'),
    }),
});
exports.updateTeamMemberRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        role: zod_1.z.enum(['LEADER', 'MEMBER']),
    }),
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        teamId: zod_1.z.string().uuid('Invalid team ID'),
        userId: zod_1.z.string().uuid('Invalid user ID'),
    }),
});
exports.bulkAssignMembersSchema = zod_1.z.object({
    body: zod_1.z.object({
        assignments: zod_1.z
            .array(zod_1.z.object({
            userId: zod_1.z.string().uuid('Invalid user ID'),
            teamId: zod_1.z.string().uuid('Invalid team ID'),
            role: zod_1.z.enum(['LEADER', 'MEMBER']).default('MEMBER'),
        }))
            .min(1, 'At least one assignment required'),
    }),
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
});
exports.deleteTeamSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        teamId: zod_1.z.string().uuid('Invalid team ID'),
    }),
});
exports.autoAssignTeamsSchema = zod_1.z.object({
    body: zod_1.z.object({
        strategy: zod_1.z.enum(['RANDOM', 'BALANCED']).default('BALANCED'),
        teamsCount: zod_1.z.number().int().positive().max(50, 'Maximum 50 teams allowed').optional(),
        maxMembersPerTeam: zod_1.z
            .number()
            .int()
            .positive()
            .max(100, 'Maximum 100 members per team')
            .optional(),
    }),
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
});
exports.getTeamLeaderboardSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
    query: zod_1.z.object({
        sortBy: zod_1.z
            .enum(['quizScore', 'totalScore', 'totalXP', 'averageXP', 'participationRate', 'memberCount'])
            .default('totalScore'),
        order: zod_1.z.enum(['asc', 'desc']).default('desc'),
        includeInactive: zod_1.z
            .string()
            .transform(val => val === 'true')
            .optional(),
    }),
});
exports.awardTeamPointsSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        teamId: zod_1.z.string().uuid('Invalid team ID'),
    }),
    body: zod_1.z.object({
        points: zod_1.z
            .number()
            .int('Points must be an integer')
            .min(-1000, 'Minimum -1000 points')
            .max(1000, 'Maximum 1000 points'),
        reason: zod_1.z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters'),
        category: zod_1.z.string().max(100, 'Category cannot exceed 100 characters').optional(),
    }),
});
exports.getTeamPointAwardsSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        teamId: zod_1.z.string().uuid('Invalid team ID'),
    }),
    query: zod_1.z.object({
        limit: zod_1.z
            .string()
            .transform(val => parseInt(val))
            .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
            .optional()
            .default('50'),
        offset: zod_1.z
            .string()
            .transform(val => parseInt(val))
            .refine(val => !isNaN(val) && val >= 0, 'Offset must be non-negative')
            .optional()
            .default('0'),
    }),
});
exports.awardIndividualPointsSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        userId: zod_1.z.string().uuid('Invalid user ID'),
    }),
    body: zod_1.z.object({
        points: zod_1.z
            .number()
            .int('Points must be an integer')
            .min(-1000, 'Minimum -1000 points')
            .max(1000, 'Maximum 1000 points'),
        reason: zod_1.z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters'),
        category: zod_1.z.string().max(100, 'Category cannot exceed 100 characters').optional(),
    }),
});
exports.getIndividualPointAwardsSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
        userId: zod_1.z.string().uuid('Invalid user ID'),
    }),
    query: zod_1.z.object({
        limit: zod_1.z
            .string()
            .transform(val => parseInt(val))
            .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
            .optional()
            .default('50'),
        offset: zod_1.z
            .string()
            .transform(val => parseInt(val))
            .refine(val => !isNaN(val) && val >= 0, 'Offset must be non-negative')
            .optional()
            .default('0'),
    }),
});
exports.getSessionIndividualPointAwardsSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
    query: zod_1.z.object({
        limit: zod_1.z
            .string()
            .transform(val => parseInt(val))
            .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
            .optional()
            .default('50'),
        offset: zod_1.z
            .string()
            .transform(val => parseInt(val))
            .refine(val => !isNaN(val) && val >= 0, 'Offset must be non-negative')
            .optional()
            .default('0'),
        teamId: zod_1.z.string().uuid('Invalid team ID').optional(),
        category: zod_1.z.string().max(100, 'Category cannot exceed 100 characters').optional(),
        sortBy: zod_1.z.enum(['createdAt', 'points', 'userName']).default('createdAt'),
        order: zod_1.z.enum(['asc', 'desc']).default('desc'),
    }),
});
//# sourceMappingURL=team.validation.js.map