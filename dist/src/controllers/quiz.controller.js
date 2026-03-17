"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuizWithImages = exports.downloadQuizResultsExcel = exports.createQuizWithImages = exports.uploadQuestionImageAndAttach = exports.uploadQuestionImage = exports.checkQuizAccess = exports.getGlobalLeaderboard = exports.getPublicLeaderboard = exports.getQuizResults = exports.getQuizLeaderboard = exports.updateQuestion = exports.deleteQuestion = exports.deleteQuiz = exports.updateQuiz = exports.submitQuizResponse = exports.joinQuiz = exports.addQuestionsToQuiz = exports.getQuizById = exports.getQuizzes = exports.createQuiz = void 0;
const client_1 = require("@prisma/client");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const minio_service_1 = require("../services/minio.service");
const xlsx_1 = __importDefault(require("xlsx"));
const prisma = new client_1.PrismaClient();
const parseOptions = (optionsString) => {
    if (!optionsString)
        return null;
    try {
        return JSON.parse(optionsString);
    }
    catch (_a) {
        return optionsString.split(',').map(opt => opt.trim());
    }
};
const createQuiz = async (req, res) => {
    try {
        const { title, sessionId, timeLimitSeconds, pointsPerQuestion, passingPercentage, totalMarks, questions, } = req.body;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const existingQuiz = await prisma.quiz.findFirst({
            where: {
                title: title,
                sessionId: sessionId,
            },
        });
        if (existingQuiz) {
            res
                .status(409)
                .json({ success: false, message: 'A quiz with this title already exists in the session.' });
            return;
        }
        const quiz = await prisma.quiz.create({
            data: {
                title,
                session: { connect: { id: sessionId } },
                timeLimitSeconds,
                pointsPerQuestion,
                passingScore: (passingPercentage / 100) * totalMarks,
                totalMarks,
                retryQuiz: req.body.retryQuiz || false,
            },
        });
        if (questions && questions.length > 0) {
            await Promise.all(questions.map(async (question, index) => {
                await prisma.question.create({
                    data: {
                        text: question.text,
                        type: question.type,
                        options: question.options ? JSON.stringify(question.options) : null,
                        correctAnswer: question.correctAnswer,
                        order: index + 1,
                        quiz: { connect: { id: quiz.id } },
                        marks: question.marks,
                    },
                });
            }));
        }
        res.status(201).json({
            success: true,
            message: 'Quiz created successfully',
            data: quiz,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error creating quiz:', error);
        if (error instanceof http_exception_1.default) {
            res.status(error.status).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'An unexpected error occurred' });
        }
    }
};
exports.createQuiz = createQuiz;
const getQuizzes = async (req, res) => {
    var _a, _b;
    const { sessionId } = req.query;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
    try {
        if (!sessionId) {
            res.status(400).json({ success: false, message: 'Session ID is required' });
            return;
        }
        if (!isAdmin) {
            const sessionParticipation = await prisma.session.findFirst({
                where: {
                    id: String(sessionId),
                    participants: {
                        some: {
                            id: userId,
                        },
                    },
                },
            });
            if (!sessionParticipation) {
                res.status(403).json({
                    success: false,
                    message: 'You must be a participant in this session to view its quizzes',
                });
                return;
            }
        }
        const quizzes = await prisma.quiz.findMany({
            where: {
                sessionId: String(sessionId),
            },
            include: {
                questions: {
                    select: {
                        id: true,
                        text: true,
                        type: true,
                        order: true,
                        marks: true,
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });
        res.status(200).json({
            success: true,
            data: quizzes,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error retrieving quizzes:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getQuizzes = getQuizzes;
const getQuizById = async (req, res) => {
    var _a, _b;
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        if (!isAdmin && userId) {
            const existingResponse = await prisma.quizResponse.findFirst({
                where: {
                    quizId: normalizedQuizId,
                    userId: userId,
                },
            });
            if (existingResponse && !quiz.retryQuiz) {
                res.status(200).json({
                    success: true,
                    data: {
                        ...quiz,
                        questions: quiz.questions.map(q => ({
                            ...q,
                            options: parseOptions(q.options),
                            correctAnswer: undefined,
                        })),
                        userStatus: 'COMPLETED',
                        canRetake: false,
                        message: 'You have already completed this quiz and retries are not allowed.',
                        userResponse: {
                            completedAt: existingResponse.completedAt,
                            totalScore: existingResponse.totalScore,
                        },
                    },
                });
                return;
            }
            if (existingResponse && quiz.retryQuiz) {
                res.status(200).json({
                    success: true,
                    data: {
                        ...quiz,
                        questions: quiz.questions.map(q => ({
                            ...q,
                            options: parseOptions(q.options),
                            correctAnswer: undefined,
                        })),
                        userStatus: 'CAN_RETRY',
                        canRetake: true,
                        message: 'You can retake this quiz.',
                        userResponse: {
                            completedAt: existingResponse.completedAt,
                            totalScore: existingResponse.totalScore,
                        },
                    },
                });
                return;
            }
        }
        const transformedQuiz = {
            ...quiz,
            questions: quiz.questions.map(question => ({
                ...question,
                options: parseOptions(question.options),
                correctAnswer: isAdmin ? question.correctAnswer : undefined,
            })),
            userStatus: isAdmin ? 'ADMIN_ACCESS' : 'AVAILABLE',
            canRetake: quiz.retryQuiz,
            message: 'Quiz is available to take.',
        };
        res.status(200).json({
            success: true,
            data: transformedQuiz,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error retrieving quiz by ID:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getQuizById = getQuizById;
const addQuestionsToQuiz = async (req, res) => {
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const questions = req.body;
    const skippedQuestions = [];
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        const existingQuestions = await prisma.question.findMany({
            where: { quizId: normalizedQuizId },
            orderBy: { order: 'asc' },
        });
        let nextOrderNumber = existingQuestions.length > 0 ? Math.max(...existingQuestions.map(q => q.order)) + 1 : 1;
        for (const question of questions) {
            const existingQuestion = await prisma.question.findFirst({
                where: {
                    text: question.text.toLowerCase(),
                    quizId: normalizedQuizId,
                },
            });
            if (existingQuestion) {
                skippedQuestions.push(question.text);
                continue;
            }
            await prisma.question.create({
                data: {
                    text: question.text.toLowerCase(),
                    type: question.type,
                    options: question.options
                        ? JSON.stringify(question.options.map((option) => option.toLowerCase()))
                        : null,
                    correctAnswer: question.correctAnswer.toString().toLowerCase(),
                    order: nextOrderNumber,
                    quiz: { connect: { id: normalizedQuizId } },
                    imageUrl: question.imageUrl,
                    timeTaken: question.timeTaken,
                    marks: question.marks,
                },
            });
            nextOrderNumber++;
        }
        res.status(201).json({
            success: true,
            message: 'Questions added successfully',
            skipped: skippedQuestions,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error adding questions to quiz:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.addQuestionsToQuiz = addQuestionsToQuiz;
const joinQuiz = async (req, res) => {
    var _a;
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        const existingParticipation = await prisma.quizResponse.findFirst({
            where: {
                quizId: normalizedQuizId,
                userId,
            },
        });
        if (existingParticipation) {
            res
                .status(409)
                .json({ success: false, message: 'You are already participating in this quiz.' });
            return;
        }
        const quizResponse = await prisma.quizResponse.create({
            data: {
                quiz: { connect: { id: normalizedQuizId } },
                user: { connect: { id: userId } },
            },
        });
        res.status(200).json({
            success: true,
            message: 'Successfully joined the quiz.',
            data: quizResponse,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error joining quiz:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.joinQuiz = joinQuiz;
const submitQuizResponse = async (req, res) => {
    var _a;
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { answers, attemptTime, timeTaken } = req.body;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        const existingResponse = await prisma.quizResponse.findFirst({
            where: {
                quizId: normalizedQuizId,
                userId: userId,
            },
        });
        if (existingResponse && !quiz.retryQuiz) {
            res.status(403).json({
                success: false,
                message: 'You have already submitted this quiz and retries are not allowed.',
            });
            return;
        }
        let marksObtained = 0;
        const questionResults = [];
        quiz.questions.forEach(question => {
            const correctAnswer = question.correctAnswer;
            const questionMark = question.marks || quiz.pointsPerQuestion || 0;
            if (correctAnswer !== null) {
                let isCorrect = false;
                const userAnswer = answers[question.id];
                if (question.type === 'MULTI_CORRECT') {
                    const normalizedCorrectAnswer = correctAnswer
                        .toString()
                        .split(',')
                        .map((ans) => ans.trim().toLowerCase())
                        .sort()
                        .join(',');
                    const normalizedUserAnswer = userAnswer === null || userAnswer === void 0 ? void 0 : userAnswer.split(',').map((ans) => ans.trim().toLowerCase()).sort().join(',');
                    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
                }
                else {
                    const normalizedCorrectAnswer = correctAnswer.toString().trim().toLowerCase();
                    const normalizedUserAnswer = (userAnswer === null || userAnswer === void 0 ? void 0 : userAnswer.trim().toLowerCase()) || '';
                    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
                }
                if (isCorrect) {
                    marksObtained += questionMark;
                }
                questionResults.push({
                    questionId: question.id,
                    questionText: question.text,
                    userAnswer: answers[question.id] || '',
                    correctAnswer: question.correctAnswer,
                    isCorrect,
                    marks: questionMark,
                    marksObtained: isCorrect ? questionMark : 0,
                    timeTaken: timeTaken[question.id] || 0,
                });
            }
        });
        const totalTimeTaken = Object.values(timeTaken).reduce((total, time) => total + time, 0);
        const quizResponse = await prisma.quizResponse.create({
            data: {
                quiz: { connect: { id: normalizedQuizId } },
                user: { connect: { id: userId } },
                completedAt: new Date(attemptTime),
                answers: JSON.stringify(answers),
                totalScore: marksObtained,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Quiz submitted successfully.',
            data: {
                marksObtained,
                totalMarks: quiz.totalMarks,
                totalTimeTaken,
                passingScore: quiz.passingScore,
                passed: marksObtained >= (quiz.passingScore || 0),
                questionResults,
                quizResponse: {
                    id: quizResponse.id,
                    quizId: quizResponse.quizId,
                    userId: quizResponse.userId,
                    completedAt: quizResponse.completedAt,
                    answers: quizResponse.answers,
                    createdAt: quizResponse.createdAt,
                },
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error submitting quiz response:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.submitQuizResponse = submitQuizResponse;
const updateQuiz = async (req, res) => {
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const { title, timeLimitSeconds, pointsPerQuestion, passingScore, questions } = req.body;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        const updatedQuiz = await prisma.quiz.update({
            where: { id: normalizedQuizId },
            data: {
                title,
                timeLimitSeconds,
                pointsPerQuestion,
                passingScore,
            },
        });
        if (questions && Array.isArray(questions)) {
            await Promise.all(questions.map(async (question, index) => {
                if (question.id) {
                    await prisma.question.update({
                        where: { id: question.id },
                        data: {
                            text: question.text,
                            type: question.type,
                            options: question.options ? JSON.stringify(question.options) : null,
                            correctAnswer: question.correctAnswer,
                            timeTaken: question.timeTaken,
                            imageUrl: question.imageUrl,
                        },
                    });
                }
                else {
                    await prisma.question.create({
                        data: {
                            text: question.text,
                            type: question.type,
                            options: question.options ? JSON.stringify(question.options) : null,
                            correctAnswer: question.correctAnswer,
                            quiz: { connect: { id: normalizedQuizId } },
                            timeTaken: question.timeTaken,
                            imageUrl: question.imageUrl,
                            order: index + 1,
                        },
                    });
                }
            }));
        }
        res.status(200).json({
            success: true,
            message: 'Quiz updated successfully',
            data: updatedQuiz,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error updating quiz:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.updateQuiz = updateQuiz;
const deleteQuiz = async (req, res) => {
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        await prisma.quizResponse.deleteMany({
            where: { quizId: normalizedQuizId },
        });
        await prisma.question.deleteMany({
            where: { quizId: normalizedQuizId },
        });
        await prisma.quiz.delete({
            where: { id: normalizedQuizId },
        });
        res.status(200).json({
            success: true,
            message: 'Quiz deleted successfully',
        });
    }
    catch (error) {
        logger_config_1.default.error('Error deleting quiz:', error);
        if (error instanceof http_exception_1.default) {
            res.status(error.status).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};
exports.deleteQuiz = deleteQuiz;
const deleteQuestion = async (req, res) => {
    const { quizId, questionId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
        });
        if (!quiz) {
            throw new http_exception_1.default(404, 'Quiz not found');
        }
        const question = await prisma.question.findUnique({
            where: { id: normalizedQuestionId },
        });
        if (!question) {
            throw new http_exception_1.default(404, 'Question not found');
        }
        await prisma.question.delete({
            where: { id: normalizedQuestionId },
        });
        res.status(200).json({
            success: true,
            message: 'Question deleted successfully',
        });
    }
    catch (error) {
        logger_config_1.default.error('Error deleting question:', error);
        if (error instanceof http_exception_1.default) {
            res.status(error.status).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};
exports.deleteQuestion = deleteQuestion;
const updateQuestion = async (req, res) => {
    const { quizId, questionId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;
    const { text, type, options, correctAnswer } = req.body;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
        });
        if (!quiz) {
            throw new http_exception_1.default(404, 'Quiz not found');
        }
        const question = await prisma.question.findUnique({
            where: { id: normalizedQuestionId },
        });
        if (!question) {
            throw new http_exception_1.default(404, 'Question not found');
        }
        const updatedQuestion = await prisma.question.update({
            where: { id: normalizedQuestionId },
            data: {
                text,
                type,
                options: options ? JSON.stringify(options) : null,
                correctAnswer,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            data: updatedQuestion,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error updating question:', error);
        if (error instanceof http_exception_1.default) {
            res.status(error.status).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};
exports.updateQuestion = updateQuestion;
const getQuizLeaderboard = async (req, res) => {
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    try {
        const leaderboard = await prisma.quizResponse.groupBy({
            by: ['userId'],
            where: { quizId: normalizedQuizId },
            _max: {
                totalScore: true,
            },
            _count: {
                userId: true,
            },
        });
        const userIds = leaderboard.map(response => response.userId);
        const users = await prisma.user.findMany({
            where: {
                id: { in: userIds },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
        const formattedLeaderboard = leaderboard.map(response => {
            const user = users.find(u => u.id === response.userId);
            return {
                userId: user === null || user === void 0 ? void 0 : user.id,
                userName: user === null || user === void 0 ? void 0 : user.name,
                score: response._max.totalScore || 0,
                attempts: response._count.userId,
            };
        });
        formattedLeaderboard.sort((a, b) => (b.score || 0) - (a.score || 0));
        res.status(200).json({
            success: true,
            data: formattedLeaderboard,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error retrieving quiz leaderboard:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getQuizLeaderboard = getQuizLeaderboard;
const getQuizResults = async (req, res) => {
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        const responses = await prisma.quizResponse.findMany({
            where: { quizId: normalizedQuizId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        const results = responses.map(response => {
            const answers = response.answers ? JSON.parse(response.answers) : {};
            const questionAnswers = quiz.questions.map(question => {
                const userAnswer = answers[question.id] || '';
                const questionMark = question.marks || quiz.pointsPerQuestion || 0;
                let isCorrect = false;
                const correctAnswer = question.correctAnswer || '';
                if (question.type === 'MULTI_CORRECT') {
                    const normalizedCorrectAnswer = correctAnswer
                        .toString()
                        .split(',')
                        .map((ans) => ans.trim().toLowerCase())
                        .sort()
                        .join(',');
                    const normalizedUserAnswer = userAnswer
                        .split(',')
                        .map((ans) => ans.trim().toLowerCase())
                        .sort()
                        .join(',');
                    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
                }
                else {
                    const normalizedCorrectAnswer = correctAnswer.toString().trim().toLowerCase();
                    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
                    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
                }
                return {
                    questionId: question.id,
                    questionText: question.text,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    isCorrect,
                    marks: questionMark,
                    marksObtained: isCorrect ? questionMark : 0,
                };
            });
            const totalMarksObtained = questionAnswers.reduce((total, q) => total + (q.marksObtained || 0), 0);
            return {
                userId: response.user.id,
                userName: response.user.name,
                userEmail: response.user.email,
                totalScore: response.totalScore || totalMarksObtained,
                completedAt: response.completedAt,
                answers: questionAnswers,
                passed: (response.totalScore || totalMarksObtained) >= (quiz.passingScore || 0),
            };
        });
        res.status(200).json({
            success: true,
            data: {
                quizId: quiz.id,
                quizTitle: quiz.title,
                totalMarks: quiz.totalMarks,
                passingScore: quiz.passingScore,
                results,
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error retrieving quiz results:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getQuizResults = getQuizResults;
const getPublicLeaderboard = async (req, res) => {
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
            select: { id: true, title: true },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        const leaderboard = await prisma.quizResponse.groupBy({
            by: ['userId'],
            where: { quizId: normalizedQuizId },
            _max: {
                totalScore: true,
            },
        });
        const userIds = leaderboard.map(response => response.userId);
        const users = await prisma.user.findMany({
            where: {
                id: { in: userIds },
            },
            select: {
                id: true,
                name: true,
            },
        });
        const formattedLeaderboard = leaderboard.map(response => {
            const user = users.find(u => u.id === response.userId);
            return {
                userId: user === null || user === void 0 ? void 0 : user.id,
                userName: user === null || user === void 0 ? void 0 : user.name,
                score: response._max.totalScore || 0,
            };
        });
        formattedLeaderboard.sort((a, b) => (b.score || 0) - (a.score || 0));
        res.status(200).json({
            success: true,
            data: {
                quizId: quiz.id,
                quizTitle: quiz.title,
                leaderboard: formattedLeaderboard,
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error retrieving public leaderboard:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getPublicLeaderboard = getPublicLeaderboard;
const getGlobalLeaderboard = async (_req, res) => {
    try {
        const leaderboard = await prisma.quizResponse.groupBy({
            by: ['userId'],
            _sum: {
                totalScore: true,
            },
            orderBy: {
                _sum: {
                    totalScore: 'desc',
                },
            },
            take: 50,
        });
        const userIds = leaderboard.map(response => response.userId);
        const users = await prisma.user.findMany({
            where: {
                id: { in: userIds },
            },
            select: {
                id: true,
                name: true,
            },
        });
        const formattedLeaderboard = leaderboard.map(response => {
            const user = users.find(u => u.id === response.userId);
            return {
                userId: user === null || user === void 0 ? void 0 : user.id,
                userName: user === null || user === void 0 ? void 0 : user.name,
                totalScore: response._sum.totalScore || 0,
            };
        });
        res.status(200).json({
            success: true,
            data: {
                leaderboard: formattedLeaderboard,
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error retrieving global leaderboard:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getGlobalLeaderboard = getGlobalLeaderboard;
const checkQuizAccess = async (req, res) => {
    var _a, _b;
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
            select: {
                id: true,
                title: true,
                retryQuiz: true,
                sessionId: true,
                timeLimitSeconds: true,
                pointsPerQuestion: true,
                passingScore: true,
                totalMarks: true,
            },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        if (isAdmin) {
            res.status(200).json({
                success: true,
                data: {
                    canAccess: true,
                    userStatus: 'ADMIN_ACCESS',
                    message: 'Admin access granted.',
                    quiz: quiz,
                },
            });
            return;
        }
        const sessionParticipation = await prisma.session.findFirst({
            where: {
                id: quiz.sessionId,
                participants: {
                    some: {
                        id: userId,
                    },
                },
            },
        });
        if (!sessionParticipation) {
            res.status(403).json({
                success: false,
                message: 'You must be a participant in the session to access this quiz.',
            });
            return;
        }
        const existingResponse = await prisma.quizResponse.findFirst({
            where: {
                quizId: normalizedQuizId,
                userId: userId,
            },
            select: {
                id: true,
                completedAt: true,
                totalScore: true,
                createdAt: true,
            },
        });
        if (existingResponse && !quiz.retryQuiz) {
            res.status(403).json({
                success: false,
                data: {
                    canAccess: false,
                    userStatus: 'COMPLETED',
                    message: 'You have already completed this quiz and retries are not allowed.',
                    quiz: quiz,
                    userResponse: {
                        completedAt: existingResponse.completedAt,
                        totalScore: existingResponse.totalScore,
                    },
                },
            });
            return;
        }
        if (existingResponse && quiz.retryQuiz) {
            res.status(200).json({
                success: true,
                data: {
                    canAccess: true,
                    userStatus: 'CAN_RETRY',
                    message: 'You can retake this quiz.',
                    quiz: quiz,
                    userResponse: {
                        completedAt: existingResponse.completedAt,
                        totalScore: existingResponse.totalScore,
                    },
                },
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                canAccess: true,
                userStatus: 'AVAILABLE',
                message: 'Quiz is available to take.',
                quiz: quiz,
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error checking quiz access:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.checkQuizAccess = checkQuizAccess;
const uploadQuestionImage = async (req, res) => {
    try {
        const { quizId } = req.params;
        const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
        const file = req.file;
        if (!file) {
            throw new http_exception_1.default(400, 'No image file uploaded');
        }
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
            include: { session: true },
        });
        if (!quiz) {
            throw new http_exception_1.default(404, 'Quiz not found');
        }
        const key = `quizzes/${normalizedQuizId}/images/${file.originalname}`;
        const uploadResult = await (0, minio_service_1.uploadToMinIO)(file.buffer, key, 'image/jpeg');
        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                imageUrl: uploadResult.url,
                key: uploadResult.key,
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error uploading question image:', error);
        if (error instanceof http_exception_1.default) {
            res.status(error.status).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'Failed to upload image' });
        }
    }
};
exports.uploadQuestionImage = uploadQuestionImage;
const uploadQuestionImageAndAttach = async (req, res) => {
    try {
        const { quizId, questionId } = req.params;
        const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
        const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;
        const file = req.file;
        if (!file) {
            throw new http_exception_1.default(400, 'No image file uploaded');
        }
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
            include: {
                session: true,
                questions: {
                    where: { id: normalizedQuestionId },
                },
            },
        });
        if (!quiz) {
            throw new http_exception_1.default(404, 'Quiz not found');
        }
        if (quiz.questions.length === 0) {
            throw new http_exception_1.default(404, 'Question not found in this quiz');
        }
        const key = `quizzes/${normalizedQuizId}/questions/${normalizedQuestionId}/${file.originalname}`;
        const uploadResult = await (0, minio_service_1.uploadToMinIO)(file.buffer, key, 'image/jpeg');
        const updatedQuestion = await prisma.question.update({
            where: { id: normalizedQuestionId },
            data: {
                imageUrl: uploadResult.url,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Image uploaded and attached to question successfully',
            data: {
                question: {
                    id: updatedQuestion.id,
                    text: updatedQuestion.text,
                    type: updatedQuestion.type,
                    imageUrl: updatedQuestion.imageUrl,
                    options: updatedQuestion.options,
                    correctAnswer: updatedQuestion.correctAnswer,
                    order: updatedQuestion.order,
                    marks: updatedQuestion.marks,
                },
                uploadInfo: {
                    url: uploadResult.url,
                    key: uploadResult.key,
                },
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error uploading and attaching question image:', error);
        if (error instanceof http_exception_1.default) {
            res.status(error.status).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'Failed to upload and attach image' });
        }
    }
};
exports.uploadQuestionImageAndAttach = uploadQuestionImageAndAttach;
const createQuizWithImages = async (req, res) => {
    try {
        const quizDataString = req.body.quizData;
        if (!quizDataString) {
            throw new http_exception_1.default(400, 'Quiz data is required');
        }
        let quizData;
        try {
            quizData = JSON.parse(quizDataString);
        }
        catch (error) {
            throw new http_exception_1.default(400, 'Invalid JSON in quizData field');
        }
        const { title, sessionId, timeLimitSeconds, pointsPerQuestion, passingPercentage, totalMarks, questions, } = quizData;
        if (!title || !sessionId || !questions || !Array.isArray(questions)) {
            throw new http_exception_1.default(400, 'Title, sessionId, and questions array are required');
        }
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const existingQuiz = await prisma.quiz.findFirst({
            where: {
                title: title,
                sessionId: sessionId,
            },
        });
        if (existingQuiz) {
            throw new http_exception_1.default(409, 'A quiz with this title already exists in the session');
        }
        const quiz = await prisma.quiz.create({
            data: {
                title,
                session: { connect: { id: sessionId } },
                timeLimitSeconds,
                pointsPerQuestion,
                passingScore: passingPercentage ? (passingPercentage / 100) * totalMarks : null,
                totalMarks,
                retryQuiz: quizData.retryQuiz || false,
            },
        });
        const createdQuestions = [];
        const files = req.files;
        for (let index = 0; index < questions.length; index++) {
            const question = questions[index];
            let imageUrl = null;
            const imageFieldName = `question_${index}_image`;
            const imageFile = files === null || files === void 0 ? void 0 : files.find(file => file.fieldname === imageFieldName);
            if (imageFile) {
                const key = `quizzes/${quiz.id}/questions/question_${index}/${imageFile.originalname}`;
                try {
                    const uploadResult = await (0, minio_service_1.uploadToMinIO)(imageFile.buffer, key, 'image/jpeg');
                    imageUrl = uploadResult.url;
                }
                catch (uploadError) {
                    logger_config_1.default.error(`Error uploading image for question ${index}:`, uploadError);
                }
            }
            const createdQuestion = await prisma.question.create({
                data: {
                    text: question.text,
                    type: question.type,
                    options: question.options ? JSON.stringify(question.options) : null,
                    correctAnswer: question.correctAnswer,
                    order: index + 1,
                    quiz: { connect: { id: quiz.id } },
                    marks: question.marks || pointsPerQuestion,
                    imageUrl: imageUrl,
                    timeTaken: question.timeTaken,
                },
            });
            createdQuestions.push(createdQuestion);
        }
        res.status(201).json({
            success: true,
            message: 'Quiz created successfully with images',
            data: {
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    sessionId: quiz.sessionId,
                    timeLimitSeconds: quiz.timeLimitSeconds,
                    pointsPerQuestion: quiz.pointsPerQuestion,
                    passingScore: quiz.passingScore,
                    totalMarks: quiz.totalMarks,
                    retryQuiz: quiz.retryQuiz,
                    createdAt: quiz.createdAt,
                    updatedAt: quiz.updatedAt,
                },
                questions: createdQuestions.map(q => ({
                    id: q.id,
                    text: q.text,
                    type: q.type,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    order: q.order,
                    marks: q.marks,
                    imageUrl: q.imageUrl,
                    hasImage: !!q.imageUrl,
                })),
                summary: {
                    totalQuestions: createdQuestions.length,
                    questionsWithImages: createdQuestions.filter(q => q.imageUrl).length,
                },
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error creating quiz with images:', error);
        if (error instanceof http_exception_1.default) {
            res.status(error.status).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'An unexpected error occurred' });
        }
    }
};
exports.createQuizWithImages = createQuizWithImages;
const downloadQuizResultsExcel = async (req, res) => {
    var _a;
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
                session: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        if (!quiz) {
            res.status(404).json({ success: false, message: 'Quiz not found' });
            return;
        }
        const responses = await prisma.quizResponse.findMany({
            where: { quizId: normalizedQuizId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: true,
                        companyPosition: true,
                    },
                },
            },
            orderBy: {
                completedAt: 'desc',
            },
        });
        if (responses.length === 0) {
            res.status(404).json({ success: false, message: 'No quiz responses found' });
            return;
        }
        const excelData = [];
        responses.forEach(response => {
            const answers = response.answers ? JSON.parse(response.answers) : {};
            const rowData = {
                'User Name': response.user.name,
                Email: response.user.email,
                Department: response.user.department || 'N/A',
                Position: response.user.companyPosition || 'N/A',
                'Total Score': response.totalScore || 0,
                'Total Marks': quiz.totalMarks || 0,
                Percentage: quiz.totalMarks
                    ? (((response.totalScore || 0) / quiz.totalMarks) * 100).toFixed(2) + '%'
                    : 'N/A',
                'Passing Score': quiz.passingScore || 0,
                Status: (response.totalScore || 0) >= (quiz.passingScore || 0) ? 'PASSED' : 'FAILED',
                'Completed At': response.completedAt
                    ? new Date(response.completedAt).toLocaleDateString() +
                        ' ' +
                        new Date(response.completedAt).toLocaleTimeString()
                    : 'N/A',
                'Time Taken (seconds)': response.timeTaken || 'N/A',
            };
            quiz.questions.forEach((question, index) => {
                const userAnswer = answers[question.id] || '';
                const questionMark = question.marks || quiz.pointsPerQuestion || 0;
                const isCorrect = userAnswer.toLowerCase() === (question.correctAnswer || '').toLowerCase();
                rowData[`Q${index + 1} - ${question.text.substring(0, 50)}...`] = userAnswer;
                rowData[`Q${index + 1} - Correct Answer`] = question.correctAnswer || 'N/A';
                rowData[`Q${index + 1} - Is Correct`] = isCorrect ? 'YES' : 'NO';
                rowData[`Q${index + 1} - Marks Obtained`] = isCorrect ? questionMark : 0;
                rowData[`Q${index + 1} - Total Marks`] = questionMark;
            });
            excelData.push(rowData);
        });
        const workbook = xlsx_1.default.utils.book_new();
        const worksheet = xlsx_1.default.utils.json_to_sheet(excelData);
        const columnWidths = [
            { wch: 20 },
            { wch: 25 },
            { wch: 15 },
            { wch: 20 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 10 },
            { wch: 20 },
            { wch: 15 },
        ];
        quiz.questions.forEach(() => {
            columnWidths.push({ wch: 30 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 12 });
        });
        worksheet['!cols'] = columnWidths;
        xlsx_1.default.utils.book_append_sheet(workbook, worksheet, 'Quiz Results');
        const summaryData = [
            { Metric: 'Quiz Title', Value: quiz.title },
            { Metric: 'Session', Value: ((_a = quiz.session) === null || _a === void 0 ? void 0 : _a.title) || 'N/A' },
            { Metric: 'Total Questions', Value: quiz.questions.length },
            { Metric: 'Total Participants', Value: responses.length },
            { Metric: 'Total Marks', Value: quiz.totalMarks || 0 },
            { Metric: 'Passing Score', Value: quiz.passingScore || 0 },
            {
                Metric: 'Average Score',
                Value: responses.length > 0
                    ? (responses.reduce((sum, r) => sum + (r.totalScore || 0), 0) / responses.length).toFixed(2)
                    : 0,
            },
            {
                Metric: 'Pass Rate',
                Value: responses.length > 0
                    ? ((responses.filter(r => (r.totalScore || 0) >= (quiz.passingScore || 0)).length /
                        responses.length) *
                        100).toFixed(2) + '%'
                    : '0%',
            },
            {
                Metric: 'Export Date',
                Value: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            },
        ];
        const summaryWorksheet = xlsx_1.default.utils.json_to_sheet(summaryData);
        summaryWorksheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
        xlsx_1.default.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
        const excelBuffer = xlsx_1.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const fileName = `Quiz_Results_${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);
        res.send(excelBuffer);
        logger_config_1.default.info(`Quiz results Excel exported: ${quiz.title} by admin`);
    }
    catch (error) {
        logger_config_1.default.error('Error downloading quiz results Excel:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.downloadQuizResultsExcel = downloadQuizResultsExcel;
const updateQuizWithImages = async (req, res) => {
    try {
        const { quizId } = req.params;
        const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
        const quizDataString = req.body.quizData;
        if (!quizDataString) {
            throw new http_exception_1.default(400, 'Quiz data is required');
        }
        let quizData;
        try {
            quizData = JSON.parse(quizDataString);
        }
        catch (error) {
            throw new http_exception_1.default(400, 'Invalid JSON in quizData field');
        }
        const { title, timeLimitSeconds, pointsPerQuestion, passingPercentage, totalMarks, questions } = quizData;
        const existingQuiz = await prisma.quiz.findUnique({
            where: { id: normalizedQuizId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!existingQuiz) {
            throw new http_exception_1.default(404, 'Quiz not found');
        }
        const updatedQuiz = await prisma.quiz.update({
            where: { id: normalizedQuizId },
            data: {
                title,
                timeLimitSeconds,
                pointsPerQuestion,
                passingScore: passingPercentage ? (passingPercentage / 100) * totalMarks : null,
                totalMarks,
                retryQuiz: quizData.retryQuiz,
            },
        });
        const processedQuestions = [];
        const files = req.files;
        if (questions && Array.isArray(questions)) {
            const existingQuestionIds = existingQuiz.questions.map(q => q.id);
            const updatedQuestionIds = [];
            for (let index = 0; index < questions.length; index++) {
                const question = questions[index];
                let imageUrl = question.imageUrl || null;
                const imageFieldName = `question_${index}_image`;
                const imageFile = files === null || files === void 0 ? void 0 : files.find(file => file.fieldname === imageFieldName);
                if (imageFile) {
                    const key = `quizzes/${quizId}/questions/question_${index}/${imageFile.originalname}`;
                    try {
                        const uploadResult = await (0, minio_service_1.uploadToMinIO)(imageFile.buffer, key, 'image/jpeg');
                        imageUrl = uploadResult.url;
                    }
                    catch (uploadError) {
                        logger_config_1.default.error(`Error uploading image for question ${index}:`, uploadError);
                    }
                }
                if (question.id && existingQuestionIds.includes(question.id)) {
                    const updatedQuestion = await prisma.question.update({
                        where: { id: question.id },
                        data: {
                            text: question.text,
                            type: question.type,
                            options: question.options ? JSON.stringify(question.options) : null,
                            correctAnswer: question.correctAnswer,
                            order: index + 1,
                            marks: question.marks || pointsPerQuestion,
                            imageUrl: imageUrl,
                            timeTaken: question.timeTaken,
                        },
                    });
                    processedQuestions.push(updatedQuestion);
                    updatedQuestionIds.push(question.id);
                }
                else {
                    const newQuestion = await prisma.question.create({
                        data: {
                            text: question.text,
                            type: question.type,
                            options: question.options ? JSON.stringify(question.options) : null,
                            correctAnswer: question.correctAnswer,
                            order: index + 1,
                            quiz: { connect: { id: normalizedQuizId } },
                            marks: question.marks || pointsPerQuestion,
                            imageUrl: imageUrl,
                            timeTaken: question.timeTaken,
                        },
                    });
                    processedQuestions.push(newQuestion);
                    if (question.id)
                        updatedQuestionIds.push(question.id);
                }
            }
            const questionsToDelete = existingQuestionIds.filter(id => !updatedQuestionIds.includes(id));
            if (questionsToDelete.length > 0) {
                await prisma.question.deleteMany({
                    where: {
                        id: { in: questionsToDelete },
                        quizId: normalizedQuizId,
                    },
                });
            }
        }
        res.status(200).json({
            success: true,
            message: 'Quiz updated successfully with images',
            data: {
                quiz: {
                    id: updatedQuiz.id,
                    title: updatedQuiz.title,
                    sessionId: updatedQuiz.sessionId,
                    timeLimitSeconds: updatedQuiz.timeLimitSeconds,
                    pointsPerQuestion: updatedQuiz.pointsPerQuestion,
                    passingScore: updatedQuiz.passingScore,
                    totalMarks: updatedQuiz.totalMarks,
                    retryQuiz: updatedQuiz.retryQuiz,
                    updatedAt: updatedQuiz.updatedAt,
                },
                questions: processedQuestions.map(q => ({
                    id: q.id,
                    text: q.text,
                    type: q.type,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    order: q.order,
                    marks: q.marks,
                    imageUrl: q.imageUrl,
                    hasImage: !!q.imageUrl,
                })),
                summary: {
                    totalQuestions: processedQuestions.length,
                    questionsWithImages: processedQuestions.filter(q => q.imageUrl).length,
                },
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error updating quiz with images:', error);
        if (error instanceof http_exception_1.default) {
            res.status(error.status).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: 'An unexpected error occurred' });
        }
    }
};
exports.updateQuizWithImages = updateQuizWithImages;
//# sourceMappingURL=quiz.controller.js.map