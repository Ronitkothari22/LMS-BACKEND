"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
        phoneNumber: zod_1.z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Please use E.164 format')
            .optional(),
        companyPosition: zod_1.z.string().min(2, 'Company position must be at least 2 characters').optional(),
        department: zod_1.z.string().min(2, 'Department must be at least 2 characters').optional(),
        profilePhoto: zod_1.z.string().optional(),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
        email: zod_1.z.string().email('Invalid email format').optional(),
        phoneNumber: zod_1.z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
            .optional(),
        companyPosition: zod_1.z.string().min(2, 'Company position must be at least 2 characters').optional(),
        department: zod_1.z.string().min(2, 'Department must be at least 2 characters').optional(),
        profilePhoto: zod_1.z.string().url('Invalid URL format').optional(),
    }),
});
//# sourceMappingURL=user.validation.js.map