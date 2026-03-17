"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContentSchema = exports.updateContentSchema = exports.getSessionContentSchema = exports.getContentByIdSchema = exports.uploadContentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.uploadContentSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
        type: zod_1.z.nativeEnum(client_1.ContentType, {
            errorMap: () => ({ message: 'Invalid content type' }),
        }),
    })
        .passthrough(),
});
exports.getContentByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        contentId: zod_1.z.string().uuid('Invalid content ID format'),
    }),
});
exports.getSessionContentSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID format'),
    }),
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .transform(val => (val ? parseInt(val, 10) : 1)),
        limit: zod_1.z
            .string()
            .optional()
            .transform(val => (val ? parseInt(val, 10) : 10)),
        type: zod_1.z
            .nativeEnum(client_1.ContentType, {
            errorMap: () => ({ message: 'Invalid content type' }),
        })
            .optional(),
    }),
});
exports.updateContentSchema = zod_1.z.object({
    params: zod_1.z.object({
        contentId: zod_1.z.string().uuid('Invalid content ID format'),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, 'Title must be at least 3 characters').optional(),
        canView: zod_1.z.array(zod_1.z.string().uuid('Invalid user ID format')).optional(),
        canEdit: zod_1.z.array(zod_1.z.string().uuid('Invalid user ID format')).optional(),
    }),
});
exports.deleteContentSchema = zod_1.z.object({
    params: zod_1.z.object({
        contentId: zod_1.z.string().uuid('Invalid content ID format'),
    }),
});
//# sourceMappingURL=content.validation.js.map