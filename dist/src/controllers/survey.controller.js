"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyController = void 0;
const survey_service_1 = require("../services/survey.service");
const param_parser_1 = require("../utils/param-parser");
const surveyService = new survey_service_1.SurveyService();
class SurveyController {
    async createSurvey(req, res) {
        var _a;
        try {
            const data = req.body;
            const createdById = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create survey',
                error: error.message,
            });
        }
    }
    async getSurveysBySession(req, res) {
        try {
            const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve surveys',
                error: error.message,
            });
        }
    }
    async getSurveyById(req, res) {
        try {
            const id = (0, param_parser_1.getParamString)(req.params.id);
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve survey',
                error: error.message,
            });
        }
    }
    async updateSurvey(req, res) {
        try {
            const id = (0, param_parser_1.getParamString)(req.params.id);
            const data = req.body;
            const survey = await surveyService.updateSurvey(id, data);
            return res.status(200).json({
                success: true,
                message: 'Survey updated successfully',
                data: survey,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update survey',
                error: error.message,
            });
        }
    }
    async deleteSurvey(req, res) {
        try {
            const id = (0, param_parser_1.getParamString)(req.params.id);
            await surveyService.deleteSurvey(id);
            return res.status(200).json({
                success: true,
                message: 'Survey deleted successfully',
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete survey',
                error: error.message,
            });
        }
    }
    async addQuestionToSurvey(req, res) {
        try {
            const data = req.body;
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to add question to survey',
                error: error.message,
            });
        }
    }
    async updateSurveyQuestion(req, res) {
        try {
            const id = (0, param_parser_1.getParamString)(req.params.id);
            const data = req.body;
            const question = await surveyService.updateSurveyQuestion(id, data);
            return res.status(200).json({
                success: true,
                message: 'Survey question updated successfully',
                data: question,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update survey question',
                error: error.message,
            });
        }
    }
    async deleteSurveyQuestion(req, res) {
        try {
            const id = (0, param_parser_1.getParamString)(req.params.id);
            await surveyService.deleteSurveyQuestion(id);
            return res.status(200).json({
                success: true,
                message: 'Survey question deleted successfully',
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete survey question',
                error: error.message,
            });
        }
    }
    async assignSurvey(req, res) {
        var _a;
        try {
            const data = req.body;
            const assignedById = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!data.surveyId || !data.assignedToType || !data.assignedToId || !assignedById) {
                return res.status(400).json({
                    success: false,
                    message: 'Survey ID, assignment type, assignment target ID, and authenticated user are required',
                });
            }
            const assignment = await surveyService.assignSurvey(data, assignedById);
            return res.status(201).json({
                success: true,
                message: 'Survey assigned successfully',
                data: assignment,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to assign survey',
                error: error.message,
            });
        }
    }
    async getSurveyAssignments(req, res) {
        try {
            const surveyId = (0, param_parser_1.getParamString)(req.params.surveyId);
            const assignments = await surveyService.getSurveyAssignments(surveyId);
            return res.status(200).json({
                success: true,
                message: 'Survey assignments retrieved successfully',
                data: assignments,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve survey assignments',
                error: error.message,
            });
        }
    }
    async removeAssignment(req, res) {
        try {
            const id = (0, param_parser_1.getParamString)(req.params.id);
            await surveyService.removeAssignment(id);
            return res.status(200).json({
                success: true,
                message: 'Survey assignment removed successfully',
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to remove survey assignment',
                error: error.message,
            });
        }
    }
    async submitSurveyResponse(req, res) {
        var _a;
        try {
            const data = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to submit survey response',
                error: error.message,
            });
        }
    }
    async getUserSurveyResponses(req, res) {
        try {
            const userId = (0, param_parser_1.getParamString)(req.params.userId);
            const { sessionId } = req.query;
            const responses = await surveyService.getUserSurveyResponses(userId, sessionId);
            return res.status(200).json({
                success: true,
                message: 'User survey responses retrieved successfully',
                data: responses,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve user survey responses',
                error: error.message,
            });
        }
    }
    async getSurveyAnalytics(req, res) {
        try {
            const surveyId = (0, param_parser_1.getParamString)(req.params.surveyId);
            const analytics = await surveyService.getSurveyAnalytics(surveyId);
            return res.status(200).json({
                success: true,
                message: 'Survey analytics retrieved successfully',
                data: analytics,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve survey analytics',
                error: error.message,
            });
        }
    }
    async getSurveyDepartmentBreakdown(req, res) {
        try {
            const surveyId = (0, param_parser_1.getParamString)(req.params.surveyId);
            const breakdown = await surveyService.getSurveyDepartmentBreakdown(surveyId);
            return res.status(200).json({
                success: true,
                message: 'Survey department breakdown retrieved successfully',
                data: breakdown,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve survey department breakdown',
                error: error.message,
            });
        }
    }
    async getDepartmentSurveyAnalytics(req, res) {
        try {
            const departmentId = (0, param_parser_1.getParamString)(req.params.departmentId);
            const { sessionId } = req.query;
            const analytics = await surveyService.getDepartmentSurveyAnalytics(departmentId, sessionId);
            return res.status(200).json({
                success: true,
                message: 'Department survey analytics retrieved successfully',
                data: analytics,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve department survey analytics',
                error: error.message,
            });
        }
    }
    async getDepartmentQuestionAnalytics(req, res) {
        try {
            const departmentId = (0, param_parser_1.getParamString)(req.params.departmentId);
            const { sessionId } = req.query;
            const analytics = await surveyService.getDepartmentQuestionAnalytics(departmentId, sessionId);
            return res.status(200).json({
                success: true,
                message: 'Department question analytics retrieved successfully',
                data: analytics,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve department question analytics',
                error: error.message,
            });
        }
    }
}
exports.SurveyController = SurveyController;
//# sourceMappingURL=survey.controller.js.map