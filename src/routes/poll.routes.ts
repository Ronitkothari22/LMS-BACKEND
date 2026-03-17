import { Router } from 'express';
import { RequestHandler } from 'express';
import {
  getPollById,
  joinPoll,
  quickCreatePoll,
  addPollQuestion,
  endPollQuestion,
  getPolls,
  submitResponse,
  createPoll,
  createStandalonePoll,
  getSessionPollResults,
  getSessionPollQuestionResults,
  getStandalonePollResults,
  getStandalonePollQuestionResults,
  getPollResults,
} from '../controllers/poll.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validatePollRequest } from '../middleware/poll.validate.middleware';
import {
  joinPollSchema,
  quickCreatePollSchema,
  addPollQuestionSchema,
  submitPollResponseSchema,
  createPollSchema,
  createStandalonePollSchema,
} from '../validations/poll.validation';
import { isAdmin } from '../middleware/admin.middleware';

const router = Router();

// Get all polls
router.get('/', authenticateToken as RequestHandler, getPolls as unknown as RequestHandler);

// Standard poll creation
router.post(
  '/',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validatePollRequest(createPollSchema),
  createPoll as unknown as RequestHandler,
);

// Quick create a poll (Mentimeter-style)
router.post(
  '/create',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validatePollRequest(quickCreatePollSchema),
  quickCreatePoll as unknown as RequestHandler,
);

// Join a poll with code
router.post(
  '/join',
  authenticateToken as RequestHandler,
  validatePollRequest(joinPollSchema),
  joinPoll as unknown as RequestHandler,
);

// Submit response to a poll
router.post(
  '/:pollId/response',
  authenticateToken as RequestHandler,
  validatePollRequest(submitPollResponseSchema),
  submitResponse as unknown as RequestHandler,
);

// Get a poll by ID
router.get(
  '/:pollId',
  authenticateToken as RequestHandler,
  // isAdmin as RequestHandler,
  getPollById as unknown as RequestHandler,
);

// Get poll results (works for both session-based and standalone polls)
router.get(
  '/:pollId/results',
  authenticateToken as RequestHandler,
  getPollResults as unknown as RequestHandler,
);

// Get session poll results (aggregated, all questions)
router.get(
  '/:pollId/results',
  authenticateToken as RequestHandler,
  getSessionPollResults as unknown as RequestHandler,
);

// Get session poll results for a specific question
router.get(
  '/:pollId/questions/:questionId/results',
  authenticateToken as RequestHandler,
  getSessionPollQuestionResults as unknown as RequestHandler,
);

// Get standalone poll results (aggregated, all questions)
router.get(
  '/standalone/:pollId/results',
  authenticateToken as RequestHandler,
  getStandalonePollResults as unknown as RequestHandler,
);

// Get standalone poll results for a specific question
router.get(
  '/standalone/:pollId/questions/:questionId/results',
  authenticateToken as RequestHandler,
  getStandalonePollQuestionResults as unknown as RequestHandler,
);

// Add a question to an existing poll
router.post(
  '/question',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validatePollRequest(addPollQuestionSchema),
  addPollQuestion as unknown as RequestHandler,
);

// End a poll question and show results
router.post(
  '/:pollId/end-question',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  endPollQuestion as unknown as RequestHandler,
);

// Standalone poll creation (without session requirement)
router.post(
  '/standalone',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validatePollRequest(createStandalonePollSchema),
  createStandalonePoll as unknown as RequestHandler,
);

export default router;
