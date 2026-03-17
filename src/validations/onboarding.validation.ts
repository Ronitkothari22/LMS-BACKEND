import { z } from 'zod';

export const updateUserDetailsSchema = z.object({
  body: z.object({
    companyPosition: z.string().min(2, 'Company position must be at least 2 characters').optional(),
    department: z.string().min(2, 'Department must be at least 2 characters').optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Please use E.164 format')
      .optional(),
  }),
});
