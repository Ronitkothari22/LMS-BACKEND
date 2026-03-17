"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSessionAccess = void 0;
const client_1 = require("@prisma/client");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const prisma = new client_1.PrismaClient();
const validateSessionAccess = async (req, res, next) => {
    var _a, _b;
    try {
        const { sessionId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const isAdmin = userRole === 'ADMIN';
        logger_config_1.default.debug(`Session access check - SessionID: ${sessionId}, UserID: ${userId}, UserRole: ${userRole}`);
        if (isAdmin) {
            logger_config_1.default.debug('User is admin, bypassing validation');
            return next();
        }
        const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId || '';
        const session = await prisma.session.findFirst({
            where: {
                id: sessionIdStr,
                OR: [
                    {
                        participants: {
                            some: {
                                id: userId,
                            },
                        },
                    },
                    {
                        invited: {
                            some: {
                                id: userId,
                            },
                        },
                    },
                ],
            },
            include: {
                participants: {
                    select: { id: true },
                },
                invited: {
                    select: { id: true },
                },
            },
        });
        logger_config_1.default.debug(`Session found: ${!!session}`);
        if (session) {
            const participants = session.participants || [];
            const invited = session.invited || [];
            const isParticipant = participants.some((p) => p.id === userId);
            const isInvited = invited.some((i) => i.id === userId);
            logger_config_1.default.debug(`User is participant: ${isParticipant}, User is invited: ${isInvited}`);
        }
        if (!session) {
            logger_config_1.default.debug('Access denied: User is neither a participant nor invited to this session');
            res.status(403).json({
                success: false,
                message: 'You must be a participant or invited to this session to access its details.',
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_config_1.default.error('Session access validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.validateSessionAccess = validateSessionAccess;
//# sourceMappingURL=session.middleware.js.map