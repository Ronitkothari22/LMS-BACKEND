import { Router } from 'express';
import * as sessionController from '../controllers/session.controller';
import * as sessionAssignmentController from '../controllers/session-assignment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { upload, assignmentSubmissionUpload } from '../middleware/upload.middleware';
import {
  createSessionSchema,
  updateSessionSchema,
  joinSessionSchema,
  toggleSessionStatusSchema,
  getSessionsSchema,
  getSessionByIdSchema,
  bulkSessionInviteSchema,
  addEmailToSessionSchema,
  getSessionQuizScoringSchema,
  assignUsersToSessionSchema,
  deleteSessionSchema,
  createSessionAssignmentSchema,
  updateSessionAssignmentSchema,
  sessionAssignmentParamsSchema,
  listSessionAssignmentsSchema,
  listSessionAssignmentSubmissionsSchema,
  sessionAssignmentTimelineSchema,
  downloadSessionAssignmentFileSchema,
  getMySessionAssignmentsSchema,
  mySessionAssignmentParamsSchema,
  createMySessionAssignmentSubmissionSchema,
  getMySessionAssignmentSubmissionSchema,
} from '../validations/session.validation';
import { RequestHandler } from 'express';

const router = Router();

// Create new session (admin only)
router.post(
  '/',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(createSessionSchema),
  sessionController.createSession,
);

// Update session details (admin only)
router.put(
  '/:sessionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateSessionSchema),
  sessionController.updateSession,
);

// Join a session using joining code
router.post(
  '/join',
  authenticateToken as RequestHandler,
  validateRequest(joinSessionSchema),
  sessionController.joinSession,
);

// Toggle session active status (admin only)
router.patch(
  '/:sessionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(toggleSessionStatusSchema),
  sessionController.toggleSessionStatus,
);

// Bulk invite users to session from CSV/Excel (admin only)
router.post(
  '/bulk-invite',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  upload.single('file'),
  validateRequest(bulkSessionInviteSchema),
  sessionController.bulkSessionInvite,
);

// Add single email to session invite list (admin or session creator)
router.post(
  '/:sessionId/invite',
  authenticateToken as RequestHandler,
  validateRequest(addEmailToSessionSchema),
  sessionController.addEmailToSession,
);

// Assign users directly to a session (admin or session creator)
router.post(
  '/:sessionId/assign',
  authenticateToken as RequestHandler,
  validateRequest(assignUsersToSessionSchema),
  sessionController.assignUsersToSession,
);

// Delete a session (admin or session creator)
router.delete(
  '/:sessionId',
  authenticateToken as RequestHandler,
  validateRequest(deleteSessionSchema),
  sessionController.deleteSession,
);

// Session assignment - admin/session-creator management routes
router.post(
  '/:sessionId/assignments',
  authenticateToken as RequestHandler,
  validateRequest(createSessionAssignmentSchema),
  sessionAssignmentController.createSessionAssignment,
);

router.get(
  '/:sessionId/assignments',
  authenticateToken as RequestHandler,
  validateRequest(listSessionAssignmentsSchema),
  sessionAssignmentController.listSessionAssignments,
);

router.get(
  '/:sessionId/assignments/:assignmentId',
  authenticateToken as RequestHandler,
  validateRequest(sessionAssignmentParamsSchema),
  sessionAssignmentController.getSessionAssignmentById,
);

router.put(
  '/:sessionId/assignments/:assignmentId',
  authenticateToken as RequestHandler,
  validateRequest(updateSessionAssignmentSchema),
  sessionAssignmentController.updateSessionAssignment,
);

router.delete(
  '/:sessionId/assignments/:assignmentId',
  authenticateToken as RequestHandler,
  validateRequest(sessionAssignmentParamsSchema),
  sessionAssignmentController.deleteSessionAssignment,
);

router.get(
  '/:sessionId/assignments/:assignmentId/submissions',
  authenticateToken as RequestHandler,
  validateRequest(listSessionAssignmentSubmissionsSchema),
  sessionAssignmentController.listSessionAssignmentSubmissions,
);

router.get(
  '/:sessionId/assignments/:assignmentId/submissions/:submissionId/files/:fileId/download',
  authenticateToken as RequestHandler,
  validateRequest(downloadSessionAssignmentFileSchema),
  sessionAssignmentController.downloadSessionAssignmentSubmissionFile,
);

router.get(
  '/:sessionId/assignments/:assignmentId/timeline',
  authenticateToken as RequestHandler,
  validateRequest(sessionAssignmentTimelineSchema),
  sessionAssignmentController.getSessionAssignmentTimeline,
);

// Session assignment - participant routes
router.get(
  '/:sessionId/me/assignments',
  authenticateToken as RequestHandler,
  validateRequest(getMySessionAssignmentsSchema),
  sessionAssignmentController.getMySessionAssignments,
);

router.get(
  '/:sessionId/me/assignments/:assignmentId',
  authenticateToken as RequestHandler,
  validateRequest(mySessionAssignmentParamsSchema),
  sessionAssignmentController.getMySessionAssignmentById,
);

router.post(
  '/:sessionId/me/assignments/:assignmentId/submission',
  authenticateToken as RequestHandler,
  assignmentSubmissionUpload.array('files', 20),
  validateRequest(createMySessionAssignmentSubmissionSchema),
  sessionAssignmentController.submitMySessionAssignment,
);

router.get(
  '/:sessionId/me/assignments/:assignmentId/submission',
  authenticateToken as RequestHandler,
  validateRequest(getMySessionAssignmentSubmissionSchema),
  sessionAssignmentController.getMySessionAssignmentSubmission,
);

// Get all sessions with pagination (accessible to all authenticated users)
router.get(
  '/',
  authenticateToken as RequestHandler,
  validateRequest(getSessionsSchema),
  sessionController.getSessions,
);

// Get user's participated sessions - Must appear BEFORE the :sessionId route
router.get('/user', authenticateToken as RequestHandler, sessionController.getUserSessions);

// Get session quiz scoring details - Must appear BEFORE the :sessionId route
router.get(
  '/:sessionId/quiz-scoring',
  authenticateToken as RequestHandler,
  validateRequest(getSessionQuizScoringSchema),
  sessionController.getSessionQuizScoring,
);

// Get session details by ID
router.get(
  '/:sessionId',
  authenticateToken as RequestHandler,
  validateRequest(getSessionByIdSchema),
  sessionController.getSessionById,
);

export default router;
