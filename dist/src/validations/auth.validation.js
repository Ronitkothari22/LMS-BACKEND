"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.resetPasswordSchema = exports.requestPasswordResetSchema = exports.verifyEmailSchema = exports.loginSchema = exports.adminSignupSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        profilePhoto: zod_1.z.string().url('Invalid URL format').optional(),
    }),
});
exports.adminSignupSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        profilePhoto: zod_1.z.string().url('Invalid URL format').optional(),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.verifyEmailSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    }),
});
exports.requestPasswordResetSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
    }),
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
        newPassword: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    }),
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
});
//# sourceMappingURL=auth.validation.js.map