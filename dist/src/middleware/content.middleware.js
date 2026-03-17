"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSessionForContent = exports.validateContentAccess = void 0;
const client_1 = require("@prisma/client");
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const logger_config_1 = __importDefault(require("../config/logger.config"));
const param_parser_1 = require("../utils/param-parser");
const prisma = new client_1.PrismaClient();
const validateContentAccess = async (req, _res, next) => {
    var _a, _b, _c, _d, _e, _f;
    try {
        const contentId = (0, param_parser_1.getParamString)(req.params.contentId);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            throw new http_exception_1.default(401, 'Unauthorized');
        }
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            include: {
                canView: {
                    select: {
                        id: true,
                    },
                },
                canEdit: {
                    select: {
                        id: true,
                    },
                },
                session: {
                    select: {
                        createdById: true,
                        participants: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });
        if (!content) {
            throw new http_exception_1.default(404, 'Content not found');
        }
        const isSuperAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === client_1.Role.ADMIN;
        const isSessionCreator = ((_c = content.session) === null || _c === void 0 ? void 0 : _c.createdById) === userId;
        const isAdmin = isSuperAdmin || isSessionCreator;
        const canView = isAdmin ||
            ((_d = content.canView) === null || _d === void 0 ? void 0 : _d.some((user) => user.id === userId)) ||
            ((_e = content.session) === null || _e === void 0 ? void 0 : _e.participants.some((participant) => participant.id === userId));
        if (!canView) {
            throw new http_exception_1.default(403, 'You do not have permission to access this content');
        }
        if ((req.method === 'PUT' || req.method === 'DELETE') &&
            !isAdmin &&
            !((_f = content.canEdit) === null || _f === void 0 ? void 0 : _f.some((user) => user.id === userId))) {
            throw new http_exception_1.default(403, 'You do not have permission to modify this content');
        }
        req.content = content.session
            ? {
                ...content,
                session: content.session
                    ? {
                        createdById: content.session.createdById,
                        participants: content.session.participants,
                    }
                    : undefined,
                canView: content.canView,
                canEdit: content.canEdit,
            }
            : undefined;
        next();
    }
    catch (error) {
        logger_config_1.default.error('Error validating content access:', error);
        next(error);
    }
};
exports.validateContentAccess = validateContentAccess;
const validateSessionForContent = async (req, _res, next) => {
    var _a, _b;
    try {
        const { sessionId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const isAdmin = userRole === client_1.Role.ADMIN;
        if (!userId) {
            throw new http_exception_1.default(401, 'Unauthorized');
        }
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                createdById: true,
            },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        if (!isAdmin && session.createdById !== userId) {
            throw new http_exception_1.default(403, 'Only the session creator or an admin can upload content to this session');
        }
        next();
    }
    catch (error) {
        logger_config_1.default.error('Error validating session for content:', error);
        next(error);
    }
};
exports.validateSessionForContent = validateSessionForContent;
//# sourceMappingURL=content.middleware.js.map