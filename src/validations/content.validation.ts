import { z } from 'zod';
import { ContentType } from '@prisma/client';

// Schema for uploading content
export const uploadContentSchema = z.object({
  body: z
    .object({
      title: z.string().min(3, 'Title must be at least 3 characters'),
      sessionId: z.string().uuid('Invalid session ID format'),
      type: z.nativeEnum(ContentType, {
        errorMap: () => ({ message: 'Invalid content type' }),
      }),
      // File will be validated by multer middleware
    })
    .passthrough(), // Allow other properties like file to pass through
});

// Schema for getting content by ID
export const getContentByIdSchema = z.object({
  params: z.object({
    contentId: z.string().uuid('Invalid content ID format'),
  }),
});

// Schema for getting session content
export const getSessionContentSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
  }),
  query: z.object({
    page: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val, 10) : 10)),
    type: z
      .nativeEnum(ContentType, {
        errorMap: () => ({ message: 'Invalid content type' }),
      })
      .optional(),
  }),
});

// Schema for updating content
export const updateContentSchema = z.object({
  params: z.object({
    contentId: z.string().uuid('Invalid content ID format'),
  }),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    canView: z.array(z.string().uuid('Invalid user ID format')).optional(),
    canEdit: z.array(z.string().uuid('Invalid user ID format')).optional(),
  }),
});

// Schema for deleting content
export const deleteContentSchema = z.object({
  params: z.object({
    contentId: z.string().uuid('Invalid content ID format'),
  }),
});
