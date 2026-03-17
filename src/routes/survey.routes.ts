import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { RequestHandler } from 'express';

const router = Router();
const surveyController = new SurveyController();

// Survey CRUD routes
router.post(
  '/surveys',
  authenticateToken,
  surveyController.createSurvey.bind(surveyController) as RequestHandler,
);
router.get(
  '/sessions/:sessionId/surveys',
  authenticateToken,
  surveyController.getSurveysBySession.bind(surveyController) as RequestHandler,
);
router.get(
  '/surveys/:id',
  authenticateToken,
  surveyController.getSurveyById.bind(surveyController) as RequestHandler,
);
router.put(
  '/surveys/:id',
  authenticateToken,
  surveyController.updateSurvey.bind(surveyController) as RequestHandler,
);
router.delete(
  '/surveys/:id',
  authenticateToken,
  surveyController.deleteSurvey.bind(surveyController) as RequestHandler,
);

// Survey Questions routes
router.post(
  '/survey-questions',
  authenticateToken,
  surveyController.addQuestionToSurvey.bind(surveyController) as RequestHandler,
);
router.put(
  '/survey-questions/:id',
  authenticateToken,
  surveyController.updateSurveyQuestion.bind(surveyController) as RequestHandler,
);
router.delete(
  '/survey-questions/:id',
  authenticateToken,
  surveyController.deleteSurveyQuestion.bind(surveyController) as RequestHandler,
);

// Survey Assignment routes (Assign surveys to organizations, departments, teams, individuals)
router.post(
  '/survey-assignments',
  authenticateToken,
  surveyController.assignSurvey.bind(surveyController) as RequestHandler,
);
router.get(
  '/surveys/:surveyId/assignments',
  authenticateToken,
  surveyController.getSurveyAssignments.bind(surveyController) as RequestHandler,
);
router.delete(
  '/survey-assignments/:id',
  authenticateToken,
  surveyController.removeAssignment.bind(surveyController) as RequestHandler,
);

// Survey Response routes
router.post(
  '/survey-responses',
  authenticateToken,
  surveyController.submitSurveyResponse.bind(surveyController) as RequestHandler,
);
router.get(
  '/users/:userId/survey-responses',
  authenticateToken,
  surveyController.getUserSurveyResponses.bind(surveyController) as RequestHandler,
);

// Survey Analytics routes
router.get(
  '/surveys/:surveyId/analytics',
  authenticateToken,
  surveyController.getSurveyAnalytics.bind(surveyController) as RequestHandler,
);
router.get(
  '/surveys/:surveyId/department-breakdown',
  authenticateToken,
  surveyController.getSurveyDepartmentBreakdown.bind(surveyController) as RequestHandler,
);
router.get(
  '/departments/:departmentId/survey-analytics',
  authenticateToken,
  surveyController.getDepartmentSurveyAnalytics.bind(surveyController) as RequestHandler,
);
router.get(
  '/departments/:departmentId/question-analytics',
  authenticateToken,
  surveyController.getDepartmentQuestionAnalytics.bind(surveyController) as RequestHandler,
);

export default router;
