import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import * as lmsAdminController from '../controllers/lms-admin.controller';
import * as lmsLearnerController from '../controllers/lms-learner.controller';
import * as lmsAnalyticsController from '../controllers/lms-analytics.controller';
import {
  createTopicSchema,
  getTopicsSchema,
  topicIdParamSchema,
  updateTopicSchema,
  createLevelSchema,
  levelIdParamSchema,
  updateLevelSchema,
  addLevelVideoContentSchema,
  addLevelReadingContentSchema,
  addLevelQuestionsSchema,
  questionIdParamSchema,
  updateQuestionSchema,
  getMyLevelByIdSchema,
  updateVideoProgressSchema,
  createLevelAttemptSchema,
  completeLevelSchema,
  topicLeaderboardSchema,
  topicAnalyticsSchema,
  videoAnalyticsSchema,
  levelAttemptAnalyticsSchema,
} from '../validations/lms.validation';

const router = Router();

// Admin authoring routes
router.post(
  '/topics',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(createTopicSchema),
  lmsAdminController.createTopic,
);

router.get(
  '/topics',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(getTopicsSchema),
  lmsAdminController.getTopics,
);

router.get(
  '/topics/:topicId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(topicIdParamSchema),
  lmsAdminController.getTopicById,
);

router.put(
  '/topics/:topicId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateTopicSchema),
  lmsAdminController.updateTopic,
);

router.delete(
  '/topics/:topicId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(topicIdParamSchema),
  lmsAdminController.deleteTopic,
);

router.post(
  '/topics/:topicId/publish',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(topicIdParamSchema),
  lmsAdminController.publishTopic,
);

router.post(
  '/topics/:topicId/unpublish',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(topicIdParamSchema),
  lmsAdminController.unpublishTopic,
);

router.post(
  '/topics/:topicId/levels',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(createLevelSchema),
  lmsAdminController.createLevel,
);

router.put(
  '/levels/:levelId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateLevelSchema),
  lmsAdminController.updateLevel,
);

router.delete(
  '/levels/:levelId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(levelIdParamSchema),
  lmsAdminController.deleteLevel,
);

router.post(
  '/levels/:levelId/content/video',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(addLevelVideoContentSchema),
  lmsAdminController.addLevelVideoContent,
);

router.post(
  '/levels/:levelId/content/reading',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(addLevelReadingContentSchema),
  lmsAdminController.addLevelReadingContent,
);

router.post(
  '/levels/:levelId/questions',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(addLevelQuestionsSchema),
  lmsAdminController.addLevelQuestions,
);

router.put(
  '/questions/:questionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateQuestionSchema),
  lmsAdminController.updateQuestion,
);

router.delete(
  '/questions/:questionId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(questionIdParamSchema),
  lmsAdminController.deleteQuestion,
);

// Learner routes
router.get('/me/topics', authenticateToken as RequestHandler, lmsLearnerController.getMyTopics);

router.get(
  '/me/topics/:topicId',
  authenticateToken as RequestHandler,
  validateRequest(topicIdParamSchema),
  lmsLearnerController.getMyTopicById,
);

router.get(
  '/me/levels/:levelId',
  authenticateToken as RequestHandler,
  validateRequest(getMyLevelByIdSchema),
  lmsLearnerController.getMyLevelById,
);

router.post(
  '/me/levels/:levelId/video-progress',
  authenticateToken as RequestHandler,
  validateRequest(updateVideoProgressSchema),
  lmsLearnerController.updateMyVideoProgress,
);

router.post(
  '/me/levels/:levelId/attempts',
  authenticateToken as RequestHandler,
  validateRequest(createLevelAttemptSchema),
  lmsLearnerController.createMyLevelAttempt,
);

router.post(
  '/me/levels/:levelId/complete',
  authenticateToken as RequestHandler,
  validateRequest(completeLevelSchema),
  lmsLearnerController.completeMyLevel,
);

router.get('/me/progress', authenticateToken as RequestHandler, lmsLearnerController.getMyProgress);

// Leaderboards
router.get(
  '/leaderboard/global',
  authenticateToken as RequestHandler,
  lmsLearnerController.getGlobalLeaderboard,
);

router.get(
  '/leaderboard/topics/:topicId',
  authenticateToken as RequestHandler,
  validateRequest(topicLeaderboardSchema),
  lmsLearnerController.getTopicLeaderboard,
);

// Analytics
router.get(
  '/analytics/topics/:topicId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(topicAnalyticsSchema),
  lmsAnalyticsController.getTopicAnalytics,
);

router.get(
  '/analytics/videos/:contentId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(videoAnalyticsSchema),
  lmsAnalyticsController.getVideoAnalytics,
);

router.get(
  '/analytics/levels/:levelId/attempts',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(levelAttemptAnalyticsSchema),
  lmsAnalyticsController.getLevelAttemptAnalytics,
);

export default router;
