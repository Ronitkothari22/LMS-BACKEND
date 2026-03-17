import { Request, Response } from 'express';
import { SurveyService } from '../services/survey.service';
import {
  CreateSurveyRequest,
  CreateSurveyQuestionRequest,
  CreateSurveyAssignmentRequest,
  SurveyResponseRequest,
} from '../types/survey.types';
import { getParamString } from '../utils/param-parser';

const surveyService = new SurveyService();

export class SurveyController {
  // Survey CRUD
  async createSurvey(req: Request, res: Response) {
    try {
      const data: CreateSurveyRequest = req.body;
      const createdById = req.user?.id;

      if (!data.sessionId || !data.title || !createdById) {
        return res.status(400).json({
          success: false,
          message: 'Session ID, title, and authenticated user are required',
        });
      }

      const survey = await surveyService.createSurvey(data, createdById);

      return res.status(201).json({
        success: true,
        message: 'Survey created successfully',
        data: survey,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create survey',
        error: error.message,
      });
    }
  }

  async getSurveysBySession(req: Request, res: Response) {
    try {
      const sessionId = getParamString(req.params.sessionId);

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
      }

      const surveys = await surveyService.getSurveysBySession(sessionId);

      return res.status(200).json({
        success: true,
        message: 'Surveys retrieved successfully',
        data: surveys,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve surveys',
        error: error.message,
      });
    }
  }

  async getSurveyById(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id);

      const survey = await surveyService.getSurveyById(id);

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: 'Survey not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Survey retrieved successfully',
        data: survey,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve survey',
        error: error.message,
      });
    }
  }

  async updateSurvey(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id);
      const data: Partial<CreateSurveyRequest> = req.body;

      const survey = await surveyService.updateSurvey(id, data);

      return res.status(200).json({
        success: true,
        message: 'Survey updated successfully',
        data: survey,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update survey',
        error: error.message,
      });
    }
  }

  async deleteSurvey(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id);

      await surveyService.deleteSurvey(id);

      return res.status(200).json({
        success: true,
        message: 'Survey deleted successfully',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete survey',
        error: error.message,
      });
    }
  }

  // Survey Questions
  async addQuestionToSurvey(req: Request, res: Response) {
    try {
      const data: CreateSurveyQuestionRequest = req.body;

      if (!data.surveyId || !data.questionText || !data.questionType || !data.surveyType) {
        return res.status(400).json({
          success: false,
          message: 'Survey ID, question text, question type, and survey type are required',
        });
      }

      const question = await surveyService.addQuestionToSurvey(data);

      return res.status(201).json({
        success: true,
        message: 'Question added to survey successfully',
        data: question,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add question to survey',
        error: error.message,
      });
    }
  }

  async updateSurveyQuestion(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id);
      const data: Partial<CreateSurveyQuestionRequest> = req.body;

      const question = await surveyService.updateSurveyQuestion(id, data);

      return res.status(200).json({
        success: true,
        message: 'Survey question updated successfully',
        data: question,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update survey question',
        error: error.message,
      });
    }
  }

  async deleteSurveyQuestion(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id);

      await surveyService.deleteSurveyQuestion(id);

      return res.status(200).json({
        success: true,
        message: 'Survey question deleted successfully',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete survey question',
        error: error.message,
      });
    }
  }

  // Survey Assignments (Connect surveys to organizations/departments/teams/individuals)
  async assignSurvey(req: Request, res: Response) {
    try {
      const data: CreateSurveyAssignmentRequest = req.body;
      const assignedById = req.user?.id;

      if (!data.surveyId || !data.assignedToType || !data.assignedToId || !assignedById) {
        return res.status(400).json({
          success: false,
          message:
            'Survey ID, assignment type, assignment target ID, and authenticated user are required',
        });
      }

      const assignment = await surveyService.assignSurvey(data, assignedById);

      return res.status(201).json({
        success: true,
        message: 'Survey assigned successfully',
        data: assignment,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to assign survey',
        error: error.message,
      });
    }
  }

  async getSurveyAssignments(req: Request, res: Response) {
    try {
      const surveyId = getParamString(req.params.surveyId);

      const assignments = await surveyService.getSurveyAssignments(surveyId);

      return res.status(200).json({
        success: true,
        message: 'Survey assignments retrieved successfully',
        data: assignments,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve survey assignments',
        error: error.message,
      });
    }
  }

  async removeAssignment(req: Request, res: Response) {
    try {
      const id = getParamString(req.params.id);

      await surveyService.removeAssignment(id);

      return res.status(200).json({
        success: true,
        message: 'Survey assignment removed successfully',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to remove survey assignment',
        error: error.message,
      });
    }
  }

  // Survey Responses
  async submitSurveyResponse(req: Request, res: Response) {
    try {
      const data: SurveyResponseRequest = req.body;
      const userId = req.user?.id;

      if (!data.surveyId || !data.responses || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Survey ID, responses, and authenticated user are required',
        });
      }

      const response = await surveyService.submitSurveyResponse(data, userId);

      return res.status(201).json({
        success: true,
        message: 'Survey response submitted successfully',
        data: response,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to submit survey response',
        error: error.message,
      });
    }
  }

  async getUserSurveyResponses(req: Request, res: Response) {
    try {
      const userId = getParamString(req.params.userId);
      const { sessionId } = req.query;

      const responses = await surveyService.getUserSurveyResponses(userId, sessionId as string);

      return res.status(200).json({
        success: true,
        message: 'User survey responses retrieved successfully',
        data: responses,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user survey responses',
        error: error.message,
      });
    }
  }

  // Analytics
  async getSurveyAnalytics(req: Request, res: Response) {
    try {
      const surveyId = getParamString(req.params.surveyId);

      const analytics = await surveyService.getSurveyAnalytics(surveyId);

      return res.status(200).json({
        success: true,
        message: 'Survey analytics retrieved successfully',
        data: analytics,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve survey analytics',
        error: error.message,
      });
    }
  }

  // NEW: Department breakdown for a specific survey
  async getSurveyDepartmentBreakdown(req: Request, res: Response) {
    try {
      const surveyId = getParamString(req.params.surveyId);

      const breakdown = await surveyService.getSurveyDepartmentBreakdown(surveyId);

      return res.status(200).json({
        success: true,
        message: 'Survey department breakdown retrieved successfully',
        data: breakdown,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve survey department breakdown',
        error: error.message,
      });
    }
  }

  // NEW: Analytics for a specific department across all surveys
  async getDepartmentSurveyAnalytics(req: Request, res: Response) {
    try {
      const departmentId = getParamString(req.params.departmentId);
      const { sessionId } = req.query;

      const analytics = await surveyService.getDepartmentSurveyAnalytics(
        departmentId,
        sessionId as string,
      );

      return res.status(200).json({
        success: true,
        message: 'Department survey analytics retrieved successfully',
        data: analytics,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve department survey analytics',
        error: error.message,
      });
    }
  }

  // NEW: Question-level analytics for a specific department across all surveys
  async getDepartmentQuestionAnalytics(req: Request, res: Response) {
    try {
      const departmentId = getParamString(req.params.departmentId);
      const { sessionId } = req.query;

      const analytics = await surveyService.getDepartmentQuestionAnalytics(
        departmentId,
        sessionId as string,
      );

      return res.status(200).json({
        success: true,
        message: 'Department question analytics retrieved successfully',
        data: analytics,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve department question analytics',
        error: error.message,
      });
    }
  }
}
