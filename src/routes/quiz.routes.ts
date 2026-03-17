import { Router } from 'express';
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  addQuestionsToQuiz,
  joinQuiz,
  submitQuizResponse,
  updateQuiz,
  deleteQuiz,
  deleteQuestion,
  updateQuestion,
  getQuizLeaderboard,
  getQuizResults,
  downloadQuizResultsExcel,
  getPublicLeaderboard,
  getGlobalLeaderboard,
  checkQuizAccess,
  uploadQuestionImage,
  uploadQuestionImageAndAttach,
  createQuizWithImages,
  updateQuizWithImages,
} from '../controllers/quiz.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { validateQuizAccess } from '../middleware/quiz.middleware';
import { quizImageUpload, quizWithImagesUpload } from '../middleware/upload.middleware';
import {
  createQuizSchema,
  addQuestionsSchema,
  joinQuizSchema,
  submitQuizResponseSchema,
  updateQuizSchema,
  updateQuestionSchema,
  downloadQuizResultsExcelSchema,
} from '../validations/quiz.validation';
import { RequestHandler } from 'express';

const router = Router();

// Protected route to create a quiz (admin only)
router.post(
  '/',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(createQuizSchema),
  createQuiz,
);

// Protected route to create a quiz with images (admin only)
router.post(
  '/with-images',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  quizWithImagesUpload.any(),
  createQuizWithImages,
);

// Protected route to update a quiz with images (admin only)
router.put(
  '/:quizId/with-images',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  quizWithImagesUpload.any(),
  updateQuizWithImages,
);

// Get all quizzes for a session
router.get('/', authenticateToken as RequestHandler, getQuizzes);

// Check quiz access before allowing user to take quiz
router.get('/:quizId/access', authenticateToken as RequestHandler, checkQuizAccess);

// Get quiz by ID
router.get(
  '/:quizId',
  authenticateToken as RequestHandler,
  validateQuizAccess as RequestHandler,
  getQuizById,
);

// Route to add multiple questions to a quiz (admin only)
router.post(
  '/:quizId/questions',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(addQuestionsSchema),
  addQuestionsToQuiz,
);

// Route to join a quiz
router.post(
  '/:quizId/join',
  authenticateToken as RequestHandler,
  validateRequest(joinQuizSchema),
  joinQuiz,
);

// Route to submit quiz responses
router.post(
  '/:quizId/submit',
  authenticateToken as RequestHandler,
  validateQuizAccess as RequestHandler,
  validateRequest(submitQuizResponseSchema),
  submitQuizResponse,
);

// Route to update a quiz (admin only)
router.put(
  '/:quizId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateQuizSchema),
  updateQuiz,
);

// Route to update a question (admin only)
router.put(
  '/:quizId/questions/:questionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateQuestionSchema),
  updateQuestion,
);

// Route to delete a quiz (admin only)
router.delete(
  '/:quizId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  deleteQuiz,
);

// Route to delete a question (admin only)
router.delete(
  '/:quizId/questions/:questionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  deleteQuestion,
);

// Route to get quiz leaderboard
router.get(
  '/:quizId/leaderboard',
  authenticateToken as RequestHandler,
  validateQuizAccess as RequestHandler,
  getQuizLeaderboard,
);

// Route to get quiz results (admin only)
router.get(
  '/:quizId/results',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  getQuizResults,
);

// Route to download quiz results as Excel (admin only)
router.get(
  '/:quizId/results/excel',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(downloadQuizResultsExcelSchema),
  downloadQuizResultsExcel,
);

// Public route to get global leaderboard across all quizzes (no authentication required)
router.get('/leaderboard', getGlobalLeaderboard);

// Public route to get quiz leaderboard (no authentication required)
router.get('/public-leaderboard/:quizId', getPublicLeaderboard);

// Route to upload image for quiz questions (admin only)
router.post(
  '/:quizId/upload-image',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  quizImageUpload.single('image'),
  uploadQuestionImage,
);

// Route to upload image and attach to specific question (admin only)
router.post(
  '/:quizId/questions/:questionId/upload-image',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  quizImageUpload.single('image'),
  uploadQuestionImageAndAttach,
);

export default router;
