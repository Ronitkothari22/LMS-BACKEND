"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuizAccess = void 0;
const client_1 = require("@prisma/client");
const param_parser_1 = require("../utils/param-parser");
const prisma = new client_1.PrismaClient();
const validateQuizAccess = async (req, res, next) => {
    var _a, _b;
    try {
        const quizId = (0, param_parser_1.getParamString)(req.params.quizId);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
        if (isAdmin) {
            return next();
        }
        const existingParticipation = await prisma.quizResponse.findFirst({
            where: {
                quizId,
                userId,
            },
        });
        if (existingParticipation) {
            return next();
        }
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            select: { sessionId: true },
        });
        if (!quiz) {
            res.status(404).json({
                success: false,
                message: 'Quiz not found',
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
                message: 'You must be a participant in the session to access quiz details.',
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.validateQuizAccess = validateQuizAccess;
//# sourceMappingURL=quiz.middleware.js.map