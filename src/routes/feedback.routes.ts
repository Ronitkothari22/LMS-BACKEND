import { Router } from 'express';
import * as feedbackController from '../controllers/feedback.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createFeedbackSchema,
  submitFeedbackResponseSchema,
  updateFeedbackSchema,
  deleteFeedbackSchema,
  addFeedbackQuestionSchema,
  updateFeedbackQuestionSchema,
  deleteFeedbackQuestionSchema,
  reorderFeedbackQuestionsSchema,
  getSingleFeedbackSchema,
  submitFeedbackResponsePathSchema,
} from '../validations/feedback.validation';
import { RequestHandler } from 'express';

const router = Router();

// Create feedback form for a session (admin only)
router.post(
  '/:sessionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(createFeedbackSchema),
  feedbackController.createFeedback,
);

// Get feedback form for a session
router.get('/:sessionId', authenticateToken as RequestHandler, feedbackController.getFeedback);

// Submit feedback response
router.post(
  '/:sessionId/submit',
  authenticateToken as RequestHandler,
  validateRequest(submitFeedbackResponseSchema),
  feedbackController.submitFeedbackResponse,
);

// Get feedback results (admin only)
router.get(
  '/:sessionId/results',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  feedbackController.getFeedbackResults,
);

// Update feedback form (admin only)
router.put(
  '/:sessionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateFeedbackSchema),
  feedbackController.updateFeedback,
);

// Delete feedback form (admin only)
router.delete(
  '/:sessionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(deleteFeedbackSchema),
  feedbackController.deleteFeedback,
);

// ==========================================
// FEEDBACK QUESTION MANAGEMENT ENDPOINTS
// ==========================================

// Add question to feedback form (admin only)
router.post(
  '/:sessionId/questions',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(addFeedbackQuestionSchema),
  feedbackController.addFeedbackQuestion,
);

// Update feedback question (admin only)
router.put(
  '/:sessionId/questions/:questionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateFeedbackQuestionSchema),
  feedbackController.updateFeedbackQuestion,
);

// Delete feedback question (admin only)
router.delete(
  '/:sessionId/questions/:questionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(deleteFeedbackQuestionSchema),
  feedbackController.deleteFeedbackQuestion,
);

// Reorder feedback questions (admin only)
router.put(
  '/:sessionId/reorder-questions',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(reorderFeedbackQuestionsSchema),
  feedbackController.reorderFeedbackQuestions,
);

// Get single feedback form for a session
router.get(
  '/:sessionId/forms/:feedbackId',
  authenticateToken as RequestHandler,
  validateRequest(getSingleFeedbackSchema),
  feedbackController.getSingleFeedback,
);

// Submit feedback response for a specific feedback form
router.post(
  '/:sessionId/forms/:feedbackId/submit',
  authenticateToken as RequestHandler,
  validateRequest(submitFeedbackResponsePathSchema),
  feedbackController.submitFeedbackResponse,
);

export default router;
