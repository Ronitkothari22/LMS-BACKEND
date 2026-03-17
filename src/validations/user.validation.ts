import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Please use E.164 format')
      .optional(),
    companyPosition: z.string().min(2, 'Company position must be at least 2 characters').optional(),
    department: z.string().min(2, 'Department must be at least 2 characters').optional(),
    profilePhoto: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),
    companyPosition: z.string().min(2, 'Company position must be at least 2 characters').optional(),
    department: z.string().min(2, 'Department must be at least 2 characters').optional(),
    profilePhoto: z.string().url('Invalid URL format').optional(),
  }),
});
