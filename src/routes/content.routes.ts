import { Router } from 'express';
import {
  uploadContent,
  getContentById,
  getSessionContent,
  updateContent,
  deleteContent,
  downloadContent,
} from '../controllers/content.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { validateContentAccess, validateSessionForContent } from '../middleware/content.middleware';
import { validateContentForm } from '../middleware/content-form.middleware';
import { contentUpload } from '../middleware/upload.middleware';
import {
  getContentByIdSchema,
  getSessionContentSchema,
  updateContentSchema,
  deleteContentSchema,
} from '../validations/content.validation';
import { RequestHandler } from 'express';

const router = Router();

// Upload content to a session (admin only)
router.post(
  '/',
  authenticateToken as RequestHandler,
  contentUpload.single('file'),
  validateContentForm as RequestHandler,
  validateSessionForContent as RequestHandler,
  uploadContent as RequestHandler,
);

// Test endpoint - Simple test to verify deployment
router.get('/test-deployment', (_req, res) => {
  res.json({
    message: 'New endpoint deployed successfully!',
    timestamp: new Date().toISOString(),
    version: 'v1.0.1',
  });
});

// Download content file - Using different pattern to avoid conflicts
router.get(
  '/download/:contentId',
  authenticateToken as RequestHandler,
  validateRequest(getContentByIdSchema) as RequestHandler,
  validateContentAccess as RequestHandler,
  downloadContent as RequestHandler,
);

// Get content by ID - MOVED AFTER download route
router.get(
  '/:contentId',
  authenticateToken as RequestHandler,
  validateRequest(getContentByIdSchema),
  validateContentAccess as RequestHandler,
  getContentById as RequestHandler,
);

// Get all content for a session - MOVED AFTER download route
router.get(
  '/session/:sessionId',
  authenticateToken as RequestHandler,
  validateRequest(getSessionContentSchema),
  getSessionContent as RequestHandler,
);

// Update content metadata
router.put(
  '/:contentId',
  authenticateToken as RequestHandler,
  validateRequest(updateContentSchema),
  validateContentAccess as RequestHandler,
  updateContent as RequestHandler,
);

// Delete content
router.delete(
  '/:contentId',
  authenticateToken as RequestHandler,
  validateRequest(deleteContentSchema),
  validateContentAccess as RequestHandler,
  deleteContent as RequestHandler,
);

export default router;
