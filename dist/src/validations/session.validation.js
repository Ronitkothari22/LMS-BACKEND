"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSessionSchema = exports.assignUsersToSessionSchema = exports.getSessionQuizScoringSchema = exports.getSessionByIdSchema = exports.getSessionsSchema = exports.toggleSessionStatusSchema = exports.joinSessionSchema = exports.updateSessionSchema = exports.createSessionSchema = exports.addEmailToSessionSchema = exports.bulkSessionInviteSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.bulkSessionInviteSchema = zod_1.z.object({
    body: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
});
exports.addEmailToSessionSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
    body: zod_1.z
        .object({
        email: zod_1.z.string().email('Invalid email format').optional(),
        emails: zod_1.z.array(zod_1.z.string().email('Invalid email format')).optional(),
    })
        .refine(data => data.email || (data.emails && data.emails.length > 0), {
        message: 'Either email or emails array must be provided',
        path: ['email'],
    }),
});
exports.createSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
        allowGuests: zod_1.z.boolean().default(false),
        participants: zod_1.z.array(zod_1.z.string().email('Invalid email format')).optional(),
        startTime: zod_1.z.string().datetime().optional(),
        endTime: zod_1.z.string().datetime().optional(),
    }),
});
exports.updateSessionSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
    body: zod_1.z.object({
        startTime: zod_1.z.string().datetime().optional(),
        endTime: zod_1.z.string().datetime().optional(),
        maxParticipants: zod_1.z.number().int().positive().optional(),
        allowGuests: zod_1.z.boolean().optional(),
        state: zod_1.z.nativeEnum(client_1.SessionState).optional(),
    }),
});
exports.joinSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        joiningCode: zod_1.z.string().length(6, 'Joining code must be 6 characters'),
    }),
});
exports.toggleSessionStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
});
exports.getSessionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).default('1'),
        limit: zod_1.z.string().transform(Number).default('10'),
        state: zod_1.z.nativeEnum(client_1.SessionState).optional(),
        isActive: zod_1.z
            .string()
            .transform(val => val === 'true')
            .optional(),
    }),
});
exports.getSessionByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
});
exports.getSessionQuizScoringSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
});
exports.assignUsersToSessionSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
    body: zod_1.z.object({
        userIds: zod_1.z
            .array(zod_1.z.string().uuid('Invalid user ID'))
            .min(1, 'At least one user ID must be provided'),
    }),
});
exports.deleteSessionSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
});
//# sourceMappingURL=session.validation.js.map