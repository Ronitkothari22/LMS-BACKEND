"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserDetailsSchema = void 0;
const zod_1 = require("zod");
exports.updateUserDetailsSchema = zod_1.z.object({
    body: zod_1.z.object({
        companyPosition: zod_1.z.string().min(2, 'Company position must be at least 2 characters').optional(),
        department: zod_1.z.string().min(2, 'Department must be at least 2 characters').optional(),
        phoneNumber: zod_1.z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Please use E.164 format')
            .optional(),
    }),
});
//# sourceMappingURL=onboarding.validation.js.map