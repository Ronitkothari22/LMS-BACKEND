"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderFeedbackQuestions = exports.deleteFeedbackQuestion = exports.updateFeedbackQuestion = exports.addFeedbackQuestion = exports.deleteFeedback = exports.updateFeedback = exports.getFeedbackResults = exports.submitFeedbackResponse = exports.getSingleFeedback = exports.getFeedback = exports.createFeedback = void 0;
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const logger_config_1 = __importDefault(require("../config/logger.config"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const createFeedback = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { title, description, isAnonymous, questions } = req.body;
        const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        const session = await prisma_1.default.session.findUnique({
            where: { id: normalizedSessionId },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const feedback = await prisma_1.default.feedback.create({
            data: {
                title,
                description,
                sessionId: normalizedSessionId,
                isAnonymous: isAnonymous || false,
                questions: {
                    create: questions.map((q, index) => ({
                        question: q.question,
                        type: q.type || client_1.FeedbackType.SMILEY_SCALE,
                        isRequired: q.isRequired !== undefined ? q.isRequired : true,
                        order: index + 1,
                    })),
                },
            },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
                session: {
                    select: {
                        title: true,
                        state: true,
                    },
                },
            },
        });
        logger_config_1.default.info(`Feedback form created for session ${sessionId}`);
        res.status(201).json({
            success: true,
            message: 'Feedback form created successfully',
            data: feedback,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createFeedback = createFeedback;
const getFeedback = async (req, res, next) => {
    var _a, _b;
    try {
        const { sessionId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            throw new http_exception_1.default(401, 'User not authenticated');
        }
        const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        const feedbacks = await prisma_1.default.feedback.findMany({
            where: { sessionId: normalizedSessionId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
                session: {
                    select: {
                        title: true,
                        state: true,
                        participants: {
                            where: { id: userId },
                            select: { id: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (feedbacks.length === 0) {
            throw new http_exception_1.default(404, 'No feedback forms found for this session');
        }
        const isParticipant = feedbacks[0].session.participants.length > 0;
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
        if (!isParticipant && !isAdmin) {
            throw new http_exception_1.default(403, 'You are not authorized to view feedback forms for this session');
        }
        const feedbacksWithStatus = await Promise.all(feedbacks.map(async (feedback) => {
            const existingResponse = await prisma_1.default.feedbackResponse.findFirst({
                where: {
                    feedbackId: feedback.id,
                    userId,
                },
            });
            return {
                ...feedback,
                hasSubmitted: !!existingResponse,
            };
        }));
        res.json({
            success: true,
            data: feedbacksWithStatus,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFeedback = getFeedback;
const getSingleFeedback = async (req, res, next) => {
    var _a, _b;
    try {
        const { sessionId, feedbackId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            throw new http_exception_1.default(401, 'User not authenticated');
        }
        const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        const normalizedFeedbackId = Array.isArray(feedbackId) ? feedbackId[0] : feedbackId;
        const feedback = await prisma_1.default.feedback.findFirst({
            where: { id: normalizedFeedbackId, sessionId: normalizedSessionId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
                session: {
                    select: {
                        title: true,
                        state: true,
                        participants: {
                            where: { id: userId },
                            select: { id: true },
                        },
                    },
                },
            },
        });
        if (!feedback) {
            throw new http_exception_1.default(404, 'Feedback form not found for this session');
        }
        const isParticipant = feedback.session.participants.length > 0;
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
        if (!isParticipant && !isAdmin) {
            throw new http_exception_1.default(403, 'You are not authorized to view this feedback form for this session');
        }
        const existingResponse = await prisma_1.default.feedbackResponse.findFirst({
            where: {
                feedbackId: normalizedFeedbackId,
                userId,
            },
        });
        res.json({
            success: true,
            data: {
                ...feedback,
                hasSubmitted: !!existingResponse,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSingleFeedback = getSingleFeedback;
const submitFeedbackResponse = async (req, res, next) => {
    var _a;
    try {
        const { sessionId, feedbackId: feedbackIdParam } = req.params;
        const { feedbackId: feedbackIdBody, responses } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            throw new http_exception_1.default(401, 'User not authenticated');
        }
        let feedbackId = feedbackIdParam || feedbackIdBody;
        if (Array.isArray(feedbackId)) {
            feedbackId = feedbackId[0];
        }
        if (!feedbackId) {
            throw new http_exception_1.default(400, 'Feedback ID is required');
        }
        const normalizedFeedbackId = String(feedbackId);
        const feedback = await prisma_1.default.feedback.findUnique({
            where: { id: normalizedFeedbackId },
            include: {
                questions: true,
                session: {
                    select: {
                        id: true,
                        participants: {
                            where: { id: userId },
                            select: { id: true },
                        },
                    },
                },
            },
        });
        if (!feedback) {
            throw new http_exception_1.default(404, 'Feedback form not found');
        }
        if (feedback.session.id !== sessionId) {
            throw new http_exception_1.default(400, 'Feedback form does not belong to the specified session');
        }
        if (!feedback.isActive) {
            throw new http_exception_1.default(400, 'Feedback form is not active');
        }
        const isParticipant = feedback.session.participants.length > 0;
        if (!isParticipant) {
            throw new http_exception_1.default(403, 'You are not a participant of this session');
        }
        const existingResponse = await prisma_1.default.feedbackResponse.findFirst({
            where: {
                feedbackId: normalizedFeedbackId,
                userId,
            },
        });
        if (existingResponse) {
            throw new http_exception_1.default(400, 'You have already submitted feedback for this session');
        }
        const requiredQuestionIds = feedback.questions.filter(q => q.isRequired).map(q => q.id);
        const answeredQuestionIds = responses.map((r) => r.questionId);
        const missingRequiredQuestions = requiredQuestionIds.filter(qId => !answeredQuestionIds.includes(qId));
        if (missingRequiredQuestions.length > 0) {
            throw new http_exception_1.default(400, 'Please answer all required questions');
        }
        const feedbackResponses = await Promise.all(responses.map(async (response) => {
            const question = feedback.questions.find(q => q.id === response.questionId);
            if (!question) {
                throw new http_exception_1.default(400, `Invalid question ID: ${response.questionId}`);
            }
            if (question.type === client_1.FeedbackType.SMILEY_SCALE) {
                if (!response.rating ||
                    !Object.values(client_1.SmileyRating).includes(response.rating)) {
                    throw new http_exception_1.default(400, `Invalid smiley rating for question: ${question.question}`);
                }
            }
            return prisma_1.default.feedbackResponse.create({
                data: {
                    feedbackId: feedback.id,
                    questionId: response.questionId,
                    userId,
                    rating: response.rating || null,
                    textAnswer: response.textAnswer || null,
                    isAnonymous: feedback.isAnonymous,
                },
            });
        }));
        logger_config_1.default.info(`Feedback response submitted by user ${userId} for session ${sessionId}`);
        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: {
                responseCount: feedbackResponses.length,
                submittedAt: new Date(),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitFeedbackResponse = submitFeedbackResponse;
const getFeedbackResults = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        const feedbacks = await prisma_1.default.feedback.findMany({
            where: { sessionId: normalizedSessionId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                    include: {
                        responses: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
                session: {
                    select: {
                        title: true,
                        participants: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (feedbacks.length === 0) {
            throw new http_exception_1.default(404, 'No feedback forms found for this session');
        }
        const feedbackResults = await Promise.all(feedbacks.map(async (feedback) => {
            const totalParticipants = feedback.session.participants.length;
            const totalResponses = await prisma_1.default.feedbackResponse.findMany({
                where: { feedbackId: feedback.id },
                distinct: ['userId'],
            });
            const responseRate = totalParticipants > 0 ? (totalResponses.length / totalParticipants) * 100 : 0;
            const questionResults = feedback.questions.map((question) => {
                const responses = question.responses;
                const responseCount = responses.length;
                if (question.type === client_1.FeedbackType.SMILEY_SCALE) {
                    const ratingCounts = {
                        VERY_POOR: 0,
                        POOR: 0,
                        AVERAGE: 0,
                        GOOD: 0,
                        EXCELLENT: 0,
                    };
                    responses.forEach((response) => {
                        if (response.rating) {
                            ratingCounts[response.rating]++;
                        }
                    });
                    const ratingValues = {
                        VERY_POOR: 1,
                        POOR: 2,
                        AVERAGE: 3,
                        GOOD: 4,
                        EXCELLENT: 5,
                    };
                    const totalRatingSum = responses.reduce((sum, response) => {
                        return (sum +
                            (response.rating
                                ? ratingValues[response.rating]
                                : 0));
                    }, 0);
                    const averageRating = responseCount > 0 ? totalRatingSum / responseCount : 0;
                    return {
                        questionId: question.id,
                        question: question.question,
                        type: question.type,
                        responseCount,
                        ratingCounts,
                        averageRating: Math.round(averageRating * 100) / 100,
                        responses: feedback.isAnonymous
                            ? undefined
                            : responses.map((r) => ({
                                user: r.user,
                                rating: r.rating,
                                submittedAt: r.createdAt,
                            })),
                    };
                }
                else {
                    return {
                        questionId: question.id,
                        question: question.question,
                        type: question.type,
                        responseCount,
                        responses: responses.map((r) => ({
                            user: feedback.isAnonymous ? undefined : r.user,
                            textAnswer: r.textAnswer,
                            submittedAt: r.createdAt,
                        })),
                    };
                }
            });
            return {
                feedback: {
                    id: feedback.id,
                    title: feedback.title,
                    description: feedback.description,
                    isAnonymous: feedback.isAnonymous,
                    createdAt: feedback.createdAt,
                },
                statistics: {
                    totalParticipants,
                    totalResponseCount: totalResponses.length,
                    responseRate: Math.round(responseRate * 100) / 100,
                },
                questionResults,
            };
        }));
        res.json({
            success: true,
            data: {
                session: {
                    title: feedbacks[0].session.title,
                },
                feedbackForms: feedbackResults,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFeedbackResults = getFeedbackResults;
const updateFeedback = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { feedbackId, title, description, isActive, isAnonymous } = req.body;
        const feedback = await prisma_1.default.feedback.findUnique({
            where: { id: feedbackId },
            include: {
                session: {
                    select: { id: true },
                },
            },
        });
        if (!feedback) {
            throw new http_exception_1.default(404, 'Feedback form not found');
        }
        if (feedback.session.id !== sessionId) {
            throw new http_exception_1.default(400, 'Feedback form does not belong to the specified session');
        }
        const updatedFeedback = await prisma_1.default.feedback.update({
            where: { id: feedbackId },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
                ...(isAnonymous !== undefined && { isAnonymous }),
            },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        logger_config_1.default.info(`Feedback form ${feedbackId} updated for session ${sessionId}`);
        res.json({
            success: true,
            message: 'Feedback form updated successfully',
            data: updatedFeedback,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateFeedback = updateFeedback;
const deleteFeedback = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { feedbackId } = req.body;
        const feedback = await prisma_1.default.feedback.findUnique({
            where: { id: feedbackId },
            include: {
                session: {
                    select: { id: true },
                },
            },
        });
        if (!feedback) {
            throw new http_exception_1.default(404, 'Feedback form not found');
        }
        if (feedback.session.id !== sessionId) {
            throw new http_exception_1.default(400, 'Feedback form does not belong to the specified session');
        }
        await prisma_1.default.feedback.delete({
            where: { id: feedbackId },
        });
        logger_config_1.default.info(`Feedback form ${feedbackId} deleted for session ${sessionId}`);
        res.json({
            success: true,
            message: 'Feedback form deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteFeedback = deleteFeedback;
const addFeedbackQuestion = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { feedbackId, question, type, isRequired, order } = req.body;
        const feedback = await prisma_1.default.feedback.findUnique({
            where: { id: feedbackId },
            include: {
                session: {
                    select: { id: true },
                },
                questions: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!feedback) {
            throw new http_exception_1.default(404, 'Feedback form not found');
        }
        if (feedback.session.id !== sessionId) {
            throw new http_exception_1.default(400, 'Feedback form does not belong to the specified session');
        }
        const responseCount = await prisma_1.default.feedbackResponse.count({
            where: { feedbackId },
        });
        if (responseCount > 0) {
            throw new http_exception_1.default(400, 'Cannot add questions to feedback form that already has responses');
        }
        const questionOrder = order ||
            (feedback.questions.length > 0 ? Math.max(...feedback.questions.map(q => q.order)) + 1 : 1);
        const newQuestion = await prisma_1.default.feedbackQuestion.create({
            data: {
                feedbackId,
                question,
                type: type || client_1.FeedbackType.SMILEY_SCALE,
                isRequired: isRequired !== undefined ? isRequired : true,
                order: questionOrder,
            },
        });
        logger_config_1.default.info(`Question added to feedback form ${feedbackId} for session ${sessionId}`);
        res.status(201).json({
            success: true,
            message: 'Question added successfully',
            data: newQuestion,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addFeedbackQuestion = addFeedbackQuestion;
const updateFeedbackQuestion = async (req, res, next) => {
    try {
        const { sessionId, questionId } = req.params;
        const { question, type, isRequired, order } = req.body;
        const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;
        const existingQuestion = await prisma_1.default.feedbackQuestion.findUnique({
            where: { id: normalizedQuestionId },
            include: {
                feedback: {
                    include: {
                        session: {
                            select: { id: true },
                        },
                    },
                },
            },
        });
        if (!existingQuestion) {
            throw new http_exception_1.default(404, 'Question not found');
        }
        if (existingQuestion.feedback.session.id !== sessionId) {
            throw new http_exception_1.default(400, 'Question does not belong to the specified session');
        }
        const responseCount = await prisma_1.default.feedbackResponse.count({
            where: { questionId: normalizedQuestionId },
        });
        if (responseCount > 0) {
            throw new http_exception_1.default(400, 'Cannot update question that already has responses');
        }
        const updatedQuestion = await prisma_1.default.feedbackQuestion.update({
            where: { id: normalizedQuestionId },
            data: {
                ...(question && { question }),
                ...(type && { type }),
                ...(isRequired !== undefined && { isRequired }),
                ...(order !== undefined && { order }),
            },
        });
        logger_config_1.default.info(`Question ${questionId} updated for session ${sessionId}`);
        res.json({
            success: true,
            message: 'Question updated successfully',
            data: updatedQuestion,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateFeedbackQuestion = updateFeedbackQuestion;
const deleteFeedbackQuestion = async (req, res, next) => {
    try {
        const { sessionId, questionId } = req.params;
        const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;
        const existingQuestion = await prisma_1.default.feedbackQuestion.findUnique({
            where: { id: normalizedQuestionId },
            include: {
                feedback: {
                    include: {
                        session: {
                            select: { id: true },
                        },
                    },
                },
            },
        });
        if (!existingQuestion) {
            throw new http_exception_1.default(404, 'Question not found');
        }
        if (existingQuestion.feedback.session.id !== sessionId) {
            throw new http_exception_1.default(400, 'Question does not belong to the specified session');
        }
        const responseCount = await prisma_1.default.feedbackResponse.count({
            where: { questionId: normalizedQuestionId },
        });
        if (responseCount > 0) {
            throw new http_exception_1.default(400, 'Cannot delete question that already has responses');
        }
        await prisma_1.default.feedbackQuestion.delete({
            where: { id: normalizedQuestionId },
        });
        logger_config_1.default.info(`Question ${normalizedQuestionId} deleted for session ${sessionId}`);
        res.json({
            success: true,
            message: 'Question deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteFeedbackQuestion = deleteFeedbackQuestion;
const reorderFeedbackQuestions = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { feedbackId, questionOrders } = req.body;
        const feedback = await prisma_1.default.feedback.findUnique({
            where: { id: feedbackId },
            include: {
                session: {
                    select: { id: true },
                },
                questions: true,
            },
        });
        if (!feedback) {
            throw new http_exception_1.default(404, 'Feedback form not found');
        }
        if (feedback.session.id !== sessionId) {
            throw new http_exception_1.default(400, 'Feedback form does not belong to the specified session');
        }
        const responseCount = await prisma_1.default.feedbackResponse.count({
            where: { feedbackId },
        });
        if (responseCount > 0) {
            throw new http_exception_1.default(400, 'Cannot reorder questions in feedback form that already has responses');
        }
        const questionIds = questionOrders.map((item) => item.questionId);
        const existingQuestionIds = feedback.questions.map(q => q.id);
        const invalidQuestions = questionIds.filter((id) => !existingQuestionIds.includes(id));
        if (invalidQuestions.length > 0) {
            throw new http_exception_1.default(400, 'Some question IDs do not belong to this feedback form');
        }
        if (questionIds.length !== existingQuestionIds.length) {
            throw new http_exception_1.default(400, 'All questions must be included in the reorder request');
        }
        await Promise.all(questionOrders.map(async (item) => {
            return prisma_1.default.feedbackQuestion.update({
                where: { id: item.questionId },
                data: { order: item.order },
            });
        }));
        const updatedFeedback = await prisma_1.default.feedback.findUnique({
            where: { id: feedbackId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        logger_config_1.default.info(`Questions reordered for feedback form ${feedbackId} in session ${sessionId}`);
        res.json({
            success: true,
            message: 'Questions reordered successfully',
            data: updatedFeedback,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.reorderFeedbackQuestions = reorderFeedbackQuestions;
//# sourceMappingURL=feedback.controller.js.map