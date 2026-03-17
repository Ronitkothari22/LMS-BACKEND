"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSession = exports.assignUsersToSession = exports.getSessionQuizScoring = exports.addEmailToSession = exports.bulkSessionInvite = exports.getUserSessions = exports.getSessionById = exports.getSessions = exports.toggleSessionStatus = exports.joinSession = exports.updateSession = exports.createSession = void 0;
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const logger_config_1 = __importDefault(require("../config/logger.config"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const email_util_1 = require("../utils/email.util");
const xlsx_1 = __importDefault(require("xlsx"));
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
const param_parser_1 = require("../utils/param-parser");
function generateJoiningCode() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
const createSession = async (req, res, next) => {
    try {
        const { title, allowGuests, participants, startTime, endTime } = req.body;
        const adminId = req.user.id;
        let registeredUsers = [];
        if (participants && participants.length > 0) {
            registeredUsers = await prisma_1.default.user.findMany({
                where: {
                    email: {
                        in: participants,
                    },
                },
                select: {
                    id: true,
                    email: true,
                },
            });
            if (!allowGuests) {
                const registeredEmails = new Set(registeredUsers.map(user => user.email));
                const unregisteredEmails = participants.filter((email) => !registeredEmails.has(email));
                if (unregisteredEmails.length > 0) {
                    throw new http_exception_1.default(400, `The following participants are not registered users: ${unregisteredEmails.join(', ')}. Please register them first or enable guest access.`);
                }
            }
        }
        const joiningCode = generateJoiningCode();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        const session = await prisma_1.default.session.create({
            data: {
                title,
                joiningCode,
                allowGuests,
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
                state: 'UPCOMING',
                isActive: true,
                invitedEmails: participants || [],
                createdBy: { connect: { id: adminId } },
                ...(registeredUsers.length > 0 && {
                    invited: {
                        connect: registeredUsers.map(user => ({ id: user.id })),
                    },
                }),
            },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                invited: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        if (participants && participants.length > 0) {
            try {
                await Promise.all(participants.map(async (email) => {
                    try {
                        await (0, email_util_1.sendSessionInvitation)(email, title, joiningCode, session.createdBy.name, expiryDate);
                        logger_config_1.default.info(`Session invitation sent to ${email}`);
                    }
                    catch (error) {
                        logger_config_1.default.error(`Failed to send session invitation to ${email}:`, error);
                    }
                }));
            }
            catch (error) {
                logger_config_1.default.error('Error in sending session invitations:', error);
            }
        }
        logger_config_1.default.info(`New session created: ${title} with code ${joiningCode}`);
        const registeredEmails = new Set(session.invited.map(user => user.email));
        const unregisteredEmails = (participants === null || participants === void 0 ? void 0 : participants.filter((email) => !registeredEmails.has(email))) || [];
        res.status(201).json({
            success: true,
            message: 'Session created successfully. Invitations are being sent.',
            data: {
                session: {
                    id: session.id,
                    title: session.title,
                    joiningCode: session.joiningCode,
                    allowGuests: session.allowGuests,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    state: session.state,
                    createdAt: session.createdAt,
                    createdBy: {
                        name: session.createdBy.name,
                        email: session.createdBy.email,
                    },
                    registeredInvitees: session.invited.map(user => user.email),
                    unregisteredInvitees: unregisteredEmails,
                    allInvitedEmails: [...session.invited.map(user => user.email), ...unregisteredEmails],
                },
                invitationsSent: (participants === null || participants === void 0 ? void 0 : participants.length) || 0,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createSession = createSession;
const updateSession = async (req, res, next) => {
    try {
        const normalizedSessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const updateData = req.body;
        const existingSession = await prisma_1.default.session.findUnique({
            where: { id: normalizedSessionId },
        });
        if (!existingSession) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const updatedSession = await prisma_1.default.session.update({
            where: { id: normalizedSessionId },
            data: {
                ...(updateData.startTime && { startTime: new Date(updateData.startTime) }),
                ...(updateData.endTime && { endTime: new Date(updateData.endTime) }),
                ...(updateData.maxParticipants && { maxParticipants: updateData.maxParticipants }),
                ...(typeof updateData.allowGuests !== 'undefined' && {
                    allowGuests: updateData.allowGuests,
                }),
                ...(updateData.state && { state: updateData.state }),
            },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        logger_config_1.default.info(`Session ${normalizedSessionId} updated successfully`);
        res.status(200).json({
            success: true,
            message: 'Session updated successfully',
            data: {
                session: {
                    id: updatedSession.id,
                    title: updatedSession.title,
                    startTime: updatedSession.startTime,
                    endTime: updatedSession.endTime,
                    maxParticipants: updatedSession.maxParticipants,
                    allowGuests: updatedSession.allowGuests,
                    state: updatedSession.state,
                    createdBy: {
                        name: updatedSession.createdBy.name,
                        email: updatedSession.createdBy.email,
                    },
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSession = updateSession;
const joinSession = async (req, res, next) => {
    try {
        const { joiningCode } = req.body;
        const userId = req.user.id;
        const session = await prisma_1.default.session.findUnique({
            where: { joiningCode },
            include: {
                participants: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        companyPosition: true,
                        department: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invited: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        timeLimitSeconds: true,
                        pointsPerQuestion: true,
                        passingScore: true,
                    },
                },
                polls: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                    },
                },
                content: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        url: true,
                    },
                },
            },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        if (!session.isActive) {
            throw new http_exception_1.default(400, 'This session is no longer active');
        }
        if (session.state !== 'UPCOMING' && session.state !== 'IN_PROGRESS') {
            throw new http_exception_1.default(400, 'This session is not available for joining');
        }
        if (session.expiryDate && new Date() > session.expiryDate) {
            throw new http_exception_1.default(400, 'Joining code has expired');
        }
        const isParticipant = session.participants.some(p => p.id === userId);
        let updatedSession = session;
        if (!isParticipant) {
            if (session.maxParticipants && session.participants.length >= session.maxParticipants) {
                throw new http_exception_1.default(400, 'Session has reached maximum participants limit');
            }
            updatedSession = await prisma_1.default.session.update({
                where: { id: session.id },
                data: {
                    participants: {
                        connect: { id: userId },
                    },
                },
                include: {
                    participants: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            companyPosition: true,
                            department: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    invited: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    quizzes: {
                        select: {
                            id: true,
                            title: true,
                            timeLimitSeconds: true,
                            pointsPerQuestion: true,
                            passingScore: true,
                        },
                    },
                    polls: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                        },
                    },
                    content: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            url: true,
                        },
                    },
                },
            });
            await prisma_1.default.activityLog.create({
                data: {
                    user: { connect: { id: userId } },
                    action: 'session_joined',
                    details: `Joined session: ${session.title}`,
                },
            });
            logger_config_1.default.info(`User ${userId} joined session ${session.id}`);
        }
        else {
            logger_config_1.default.info(`User ${userId} already a participant in session ${session.id}`);
        }
        res.status(200).json({
            success: true,
            message: isParticipant
                ? 'Already a participant in this session'
                : 'Successfully joined the session',
            data: {
                sessionId: updatedSession.id,
                session: {
                    id: updatedSession.id,
                    title: updatedSession.title,
                    description: updatedSession.description,
                    state: updatedSession.state,
                    isActive: updatedSession.isActive,
                    joiningCode: updatedSession.joiningCode,
                    startTime: updatedSession.startTime,
                    endTime: updatedSession.endTime,
                    expiryDate: updatedSession.expiryDate,
                    maxParticipants: updatedSession.maxParticipants,
                    allowGuests: updatedSession.allowGuests,
                    createdAt: updatedSession.createdAt,
                    updatedAt: updatedSession.updatedAt,
                    createdBy: updatedSession.createdBy,
                    participantsCount: updatedSession.participants.length,
                    participants: updatedSession.participants,
                    invitedUsers: updatedSession.invited,
                    invitedEmails: updatedSession.invitedEmails,
                    quizzes: updatedSession.quizzes,
                    polls: updatedSession.polls,
                    content: updatedSession.content,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.joinSession = joinSession;
const toggleSessionStatus = async (req, res, next) => {
    try {
        const normalizedSessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const existingSession = await prisma_1.default.session.findUnique({
            where: { id: normalizedSessionId },
        });
        if (!existingSession) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const updatedSession = await prisma_1.default.session.update({
            where: { id: normalizedSessionId },
            data: {
                isActive: !existingSession.isActive,
            },
            select: {
                id: true,
                title: true,
                isActive: true,
                state: true,
                updatedAt: true,
            },
        });
        logger_config_1.default.info(`Session ${normalizedSessionId} status toggled to ${updatedSession.isActive}`);
        res.status(200).json({
            success: true,
            message: `Session ${updatedSession.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                session: updatedSession,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleSessionStatus = toggleSessionStatus;
const getSessions = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, state, isActive } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ADMIN';
        let where = {
            ...(state && { state: state }),
            ...(typeof isActive !== 'undefined' && { isActive: isActive === 'true' }),
        };
        if (!isAdmin) {
            where = {
                ...where,
                participants: {
                    some: {
                        id: userId,
                    },
                },
            };
        }
        const totalCount = await prisma_1.default.session.count({ where });
        const sessions = await prisma_1.default.session.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                participants: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invited: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        timeLimitSeconds: true,
                        pointsPerQuestion: true,
                        passingScore: true,
                    },
                },
                polls: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                    },
                },
                content: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        url: true,
                    },
                },
            },
        });
        const totalPages = Math.ceil(totalCount / Number(limit));
        const hasNextPage = Number(page) < totalPages;
        const hasPrevPage = Number(page) > 1;
        logger_config_1.default.info(`Retrieved ${sessions.length} sessions for page ${page}`);
        res.status(200).json({
            success: true,
            message: 'Sessions retrieved successfully',
            data: {
                sessions: sessions.map(session => ({
                    id: session.id,
                    title: session.title,
                    description: session.description,
                    state: session.state,
                    isActive: session.isActive,
                    joiningCode: session.joiningCode,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    createdBy: session.createdBy,
                    participantsCount: session.participants.length,
                    participants: session.participants,
                    invitedUsers: session.invited,
                    invitedEmails: session.invitedEmails,
                    quizzes: session.quizzes,
                    polls: session.polls,
                    content: session.content,
                })),
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalItems: totalCount,
                    hasNextPage,
                    hasPrevPage,
                    limit: Number(limit),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessions = getSessions;
const getSessionById = async (req, res, next) => {
    try {
        const normalizedSessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const session = await prisma_1.default.session.findUnique({
            where: { id: normalizedSessionId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                participants: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        companyPosition: true,
                        department: true,
                    },
                },
                invited: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        timeLimitSeconds: true,
                        pointsPerQuestion: true,
                        passingScore: true,
                    },
                },
                polls: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                    },
                },
                content: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        url: true,
                    },
                },
            },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        logger_config_1.default.info(`Retrieved details for session ${normalizedSessionId}`);
        res.status(200).json({
            success: true,
            message: 'Session details retrieved successfully',
            data: {
                session: {
                    id: session.id,
                    title: session.title,
                    description: session.description,
                    state: session.state,
                    isActive: session.isActive,
                    joiningCode: session.joiningCode,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    expiryDate: session.expiryDate,
                    maxParticipants: session.maxParticipants,
                    allowGuests: session.allowGuests,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    createdBy: session.createdBy,
                    participantsCount: session.participants.length,
                    participants: session.participants,
                    invitedUsers: session.invited,
                    invitedEmails: session.invitedEmails,
                    quizzes: session.quizzes,
                    polls: session.polls,
                    content: session.content,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionById = getSessionById;
const getUserSessions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const sessions = await prisma_1.default.session.findMany({
            where: {
                participants: {
                    some: {
                        id: userId,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                participants: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        timeLimitSeconds: true,
                        pointsPerQuestion: true,
                        passingScore: true,
                    },
                },
                polls: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                    },
                },
                content: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        url: true,
                    },
                },
            },
        });
        logger_config_1.default.info(`Retrieved ${sessions.length} sessions for user ${userId}`);
        res.status(200).json({
            success: true,
            message: 'User sessions retrieved successfully',
            data: {
                sessions: sessions.map(session => ({
                    id: session.id,
                    title: session.title,
                    description: session.description,
                    state: session.state,
                    isActive: session.isActive,
                    joiningCode: session.joiningCode,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    participantsCount: session.participants.length,
                    createdBy: session.createdBy,
                    quizzes: session.quizzes,
                    polls: session.polls,
                    content: session.content,
                })),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserSessions = getUserSessions;
const bulkSessionInvite = async (req, res, next) => {
    var _a;
    try {
        if (!req.file) {
            throw new http_exception_1.default(400, 'Please upload a file');
        }
        const normalizedSessionId = (0, param_parser_1.getParamString)(req.body.sessionId);
        const session = await prisma_1.default.session.findUnique({
            where: { id: normalizedSessionId },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                invited: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        const emails = [];
        const fileBuffer = req.file.buffer;
        const fileExtension = (_a = req.file.originalname.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const workbook = xlsx_1.default.read(fileBuffer);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx_1.default.utils.sheet_to_json(worksheet);
            data.forEach((row) => {
                if (row.email) {
                    emails.push(row.email);
                }
            });
        }
        else if (fileExtension === 'csv') {
            const csvData = [];
            await new Promise((resolve, reject) => {
                stream_1.Readable.from(fileBuffer)
                    .pipe((0, csv_parser_1.default)())
                    .on('data', row => csvData.push(row))
                    .on('end', () => resolve(csvData))
                    .on('error', error => reject(error));
            });
            csvData.forEach(row => {
                if (row.email) {
                    emails.push(row.email);
                }
            });
        }
        else {
            throw new http_exception_1.default(400, 'Unsupported file format. Please upload CSV or Excel file.');
        }
        if (emails.length === 0) {
            throw new http_exception_1.default(400, 'No valid emails found in the uploaded file');
        }
        const validEmails = emails.filter(email => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        });
        if (validEmails.length === 0) {
            throw new http_exception_1.default(400, 'No valid emails found in the uploaded file');
        }
        const existingUsers = await prisma_1.default.user.findMany({
            where: {
                email: {
                    in: validEmails,
                },
            },
            select: {
                id: true,
                email: true,
            },
        });
        const existingInvitedEmails = new Set(session.invited.map(user => user.email));
        const existingSessionEmails = new Set(session.invitedEmails);
        const newUserEmails = validEmails.filter(email => !existingInvitedEmails.has(email) && !existingSessionEmails.has(email));
        if (newUserEmails.length === 0) {
            throw new http_exception_1.default(400, 'All emails in the file are already invited to this session');
        }
        const newRegisteredUsers = existingUsers.filter(user => newUserEmails.includes(user.email) && !existingInvitedEmails.has(user.email));
        await prisma_1.default.session.update({
            where: { id: normalizedSessionId },
            data: {
                invitedEmails: {
                    push: newUserEmails,
                },
                ...(newRegisteredUsers.length > 0 && {
                    invited: {
                        connect: newRegisteredUsers.map(user => ({ id: user.id })),
                    },
                }),
            },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        const invitationResults = await Promise.all(newUserEmails.map(async (email) => {
            try {
                await (0, email_util_1.sendSessionInvitation)(email, session.title, session.joiningCode, session.createdBy.name, expiryDate);
                logger_config_1.default.info(`Session invitation sent to ${email}`);
                return {
                    email,
                    status: 'success',
                };
            }
            catch (error) {
                logger_config_1.default.error(`Failed to send session invitation to ${email}:`, error);
                return {
                    email,
                    status: 'failed',
                    error: error.message,
                };
            }
        }));
        const summary = {
            total: invitationResults.length,
            successful: invitationResults.filter(r => r.status === 'success').length,
            failed: invitationResults.filter(r => r.status === 'failed').length,
        };
        logger_config_1.default.info(`Bulk session invitations processed: ${JSON.stringify(summary)}`);
        res.status(200).json({
            success: true,
            message: 'Bulk session invitations processed successfully',
            data: {
                summary,
                sessionId: session.id,
                sessionTitle: session.title,
                results: invitationResults,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkSessionInvite = bulkSessionInvite;
const addEmailToSession = async (req, res, next) => {
    var _a, _b;
    try {
        const normalizedSessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const { email, emails } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const emailsToAdd = [];
        if (email) {
            emailsToAdd.push(email);
        }
        if (emails && Array.isArray(emails)) {
            emailsToAdd.push(...emails);
        }
        const uniqueEmails = [...new Set(emailsToAdd)];
        if (uniqueEmails.length === 0) {
            throw new http_exception_1.default(400, 'At least one email must be provided');
        }
        const session = await prisma_1.default.session.findUnique({
            where: { id: normalizedSessionId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invited: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
        const isCreator = session.createdById === userId;
        if (!isAdmin && !isCreator) {
            throw new http_exception_1.default(403, 'You do not have permission to invite users to this session');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = uniqueEmails.filter(emailAddr => !emailRegex.test(emailAddr));
        if (invalidEmails.length > 0) {
            throw new http_exception_1.default(400, `Invalid email format(s): ${invalidEmails.join(', ')}`);
        }
        const existingInvitedEmails = new Set(session.invited.map(user => user.email));
        const existingSessionEmails = new Set(session.invitedEmails);
        const alreadyInvitedEmails = uniqueEmails.filter(emailAddr => existingInvitedEmails.has(emailAddr) || existingSessionEmails.has(emailAddr));
        const newEmails = uniqueEmails.filter(emailAddr => !existingInvitedEmails.has(emailAddr) && !existingSessionEmails.has(emailAddr));
        if (newEmails.length === 0) {
            throw new http_exception_1.default(400, `All provided emails are already invited to this session: ${alreadyInvitedEmails.join(', ')}`);
        }
        const existingUsers = await prisma_1.default.user.findMany({
            where: {
                email: { in: newEmails },
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        const registeredUserEmails = new Set(existingUsers.map(user => user.email));
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        const updatedSession = await prisma_1.default.session.update({
            where: { id: normalizedSessionId },
            data: {
                invitedEmails: {
                    push: newEmails,
                },
                ...(existingUsers.length > 0 && {
                    invited: {
                        connect: existingUsers.map(user => ({ id: user.id })),
                    },
                }),
            },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                invited: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        const emailResults = await Promise.all(newEmails.map(async (emailAddr) => {
            try {
                await (0, email_util_1.sendSessionInvitation)(emailAddr, session.title, session.joiningCode, session.createdBy.name, expiryDate);
                logger_config_1.default.info(`Session invitation sent to ${emailAddr} for session: ${session.title}`);
                return {
                    email: emailAddr,
                    status: 'success',
                    isRegisteredUser: registeredUserEmails.has(emailAddr),
                };
            }
            catch (emailError) {
                logger_config_1.default.error(`Failed to send session invitation to ${emailAddr}:`, emailError);
                return {
                    email: emailAddr,
                    status: 'email_failed',
                    isRegisteredUser: registeredUserEmails.has(emailAddr),
                    error: emailError.message,
                };
            }
        }));
        const summary = {
            totalRequested: uniqueEmails.length,
            alreadyInvited: alreadyInvitedEmails.length,
            newlyAdded: newEmails.length,
            registeredUsers: existingUsers.length,
            emailsSent: emailResults.filter(r => r.status === 'success').length,
            emailsFailed: emailResults.filter(r => r.status === 'email_failed').length,
        };
        res.status(200).json({
            success: true,
            message: `${newEmails.length} email(s) added to session successfully`,
            data: {
                sessionId: session.id,
                sessionTitle: session.title,
                summary,
                addedEmails: newEmails,
                alreadyInvitedEmails: alreadyInvitedEmails.length > 0 ? alreadyInvitedEmails : undefined,
                registeredUsers: existingUsers,
                emailResults,
                totalInvitedEmails: updatedSession.invitedEmails.length,
                totalInvitedUsers: updatedSession.invited.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addEmailToSession = addEmailToSession;
const getSessionQuizScoring = async (req, res, next) => {
    var _a, _b;
    try {
        const normalizedSessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const session = await prisma_1.default.session.findUnique({
            where: { id: normalizedSessionId },
            include: {
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        totalMarks: true,
                        passingScore: true,
                        pointsPerQuestion: true,
                    },
                },
                participants: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invited: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
        const isCreator = session.createdById === userId;
        const isParticipant = session.participants.some(p => p.id === userId);
        const isInvited = session.invited.some(i => i.id === userId);
        if (!isAdmin && !isCreator && !isParticipant && !isInvited) {
            throw new http_exception_1.default(403, "You do not have permission to view this session's quiz scores");
        }
        if (session.quizzes.length === 0) {
            res.status(200).json({
                success: true,
                message: 'No quizzes found in this session',
                data: {
                    sessionId: session.id,
                    sessionTitle: session.title,
                    totalQuizzes: 0,
                    participants: [],
                },
            });
            return;
        }
        const quizResponses = await prisma_1.default.quizResponse.findMany({
            where: {
                quiz: {
                    sessionId: normalizedSessionId,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        totalMarks: true,
                        passingScore: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const userScoresMap = new Map();
        [...session.participants, ...session.invited].forEach(user => {
            if (!userScoresMap.has(user.id)) {
                userScoresMap.set(user.id, {
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    quizResults: [],
                    totalAttempts: 0,
                    totalScore: 0,
                    averageScore: 0,
                    quizzesCompleted: 0,
                    quizzesPassed: 0,
                    participationRate: 0,
                });
            }
        });
        quizResponses.forEach(response => {
            const userId = response.user.id;
            if (!userScoresMap.has(userId)) {
                userScoresMap.set(userId, {
                    userId: response.user.id,
                    userName: response.user.name,
                    userEmail: response.user.email,
                    quizResults: [],
                    totalAttempts: 0,
                    totalScore: 0,
                    averageScore: 0,
                    quizzesCompleted: 0,
                    quizzesPassed: 0,
                    participationRate: 0,
                });
            }
            const userData = userScoresMap.get(userId);
            userData.totalAttempts += 1;
            let quizResult = userData.quizResults.find((q) => q.quizId === response.quiz.id);
            if (!quizResult) {
                quizResult = {
                    quizId: response.quiz.id,
                    quizTitle: response.quiz.title,
                    attempts: 0,
                    bestScore: 0,
                    latestScore: response.totalScore || 0,
                    totalMarks: response.quiz.totalMarks,
                    passingScore: response.quiz.passingScore,
                    passed: false,
                };
                userData.quizResults.push(quizResult);
            }
            quizResult.attempts += 1;
            quizResult.bestScore = Math.max(quizResult.bestScore, response.totalScore || 0);
            quizResult.latestScore = response.totalScore || 0;
            quizResult.passed = quizResult.bestScore >= (response.quiz.passingScore || 0);
        });
        const participants = Array.from(userScoresMap.values()).map((userData) => {
            const completedQuizzes = userData.quizResults.filter((q) => q.attempts > 0);
            const passedQuizzes = userData.quizResults.filter((q) => q.passed);
            const totalScore = userData.quizResults.reduce((sum, q) => sum + q.bestScore, 0);
            userData.quizzesCompleted = completedQuizzes.length;
            userData.quizzesPassed = passedQuizzes.length;
            userData.totalScore = totalScore;
            userData.averageScore =
                completedQuizzes.length > 0
                    ? Math.round((totalScore / completedQuizzes.length) * 100) / 100
                    : 0;
            userData.participationRate =
                session.quizzes.length > 0
                    ? Math.round((completedQuizzes.length / session.quizzes.length) * 100)
                    : 0;
            return userData;
        });
        participants.sort((a, b) => b.totalScore - a.totalScore);
        const rankedParticipants = participants.map((participant, index) => ({
            ...participant,
            rank: index + 1,
        }));
        const sessionSummary = {
            totalQuizzes: session.quizzes.length,
            totalParticipants: participants.length,
            participantsWithAttempts: participants.filter(p => p.totalAttempts > 0).length,
            averageParticipationRate: participants.length > 0
                ? Math.round((participants.reduce((sum, p) => sum + p.participationRate, 0) /
                    participants.length) *
                    100) / 100
                : 0,
            highestScore: participants.length > 0 ? participants[0].totalScore : 0,
            averageScore: participants.length > 0
                ? Math.round((participants.reduce((sum, p) => sum + p.totalScore, 0) / participants.length) * 100) / 100
                : 0,
        };
        res.status(200).json({
            success: true,
            message: 'Session quiz scoring retrieved successfully',
            data: {
                sessionId: session.id,
                sessionTitle: session.title,
                quizzes: session.quizzes,
                summary: sessionSummary,
                participants: rankedParticipants,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionQuizScoring = getSessionQuizScoring;
const assignUsersToSession = async (req, res, next) => {
    var _a, _b;
    try {
        const normalizedSessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const { userIds } = req.body;
        const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const uniqueUserIds = [...new Set(userIds)];
        const session = await prisma_1.default.session.findUnique({
            where: { id: normalizedSessionId },
            include: {
                participants: { select: { id: true } },
                createdBy: { select: { id: true } },
            },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
        const isCreator = session.createdBy.id === requesterId;
        if (!isAdmin && !isCreator) {
            throw new http_exception_1.default(403, 'You do not have permission to assign users to this session');
        }
        const existingParticipantIds = new Set(session.participants.map(p => p.id));
        const newParticipantIds = uniqueUserIds.filter(id => !existingParticipantIds.has(id));
        if (newParticipantIds.length === 0) {
            throw new http_exception_1.default(400, 'All provided users are already participants of this session');
        }
        const users = await prisma_1.default.user.findMany({
            where: {
                id: { in: newParticipantIds },
                isActive: true,
            },
            select: { id: true, name: true, email: true },
        });
        if (users.length !== newParticipantIds.length) {
            const foundIds = new Set(users.map(u => u.id));
            const missingIds = newParticipantIds.filter(id => !foundIds.has(id));
            throw new http_exception_1.default(400, `Some user IDs are invalid or inactive: ${missingIds.join(', ')}`);
        }
        if (session.maxParticipants &&
            session.participants.length + newParticipantIds.length > session.maxParticipants) {
            throw new http_exception_1.default(400, 'Session would exceed maximum participants limit with these users');
        }
        const updatedSession = await prisma_1.default.session.update({
            where: { id: normalizedSessionId },
            data: {
                participants: {
                    connect: newParticipantIds.map(id => ({ id })),
                },
            },
            include: {
                participants: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        companyPosition: true,
                        department: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invited: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        timeLimitSeconds: true,
                        pointsPerQuestion: true,
                        passingScore: true,
                    },
                },
                polls: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                    },
                },
                content: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        url: true,
                    },
                },
            },
        });
        await prisma_1.default.activityLog.createMany({
            data: newParticipantIds.map(uid => ({
                userId: uid,
                action: 'assigned_to_session',
                details: `Assigned to session: ${session.title}`,
            })),
        });
        logger_config_1.default.info(`Users [${newParticipantIds.join(', ')}] assigned to session ${normalizedSessionId} by ${requesterId}`);
        res.status(200).json({
            success: true,
            message: 'Users successfully assigned to the session',
            data: {
                sessionId: updatedSession.id,
                participantsCount: updatedSession.participants.length,
                participants: updatedSession.participants,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignUsersToSession = assignUsersToSession;
const deleteSession = async (req, res, next) => {
    var _a, _b;
    try {
        const normalizedSessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const session = await prisma_1.default.session.findUnique({
            where: { id: normalizedSessionId },
            select: { id: true, createdById: true, title: true },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
        const isCreator = session.createdById === requesterId;
        if (!isAdmin && !isCreator) {
            throw new http_exception_1.default(403, 'You do not have permission to delete this session');
        }
        await prisma_1.default.session.delete({ where: { id: normalizedSessionId } });
        logger_config_1.default.info(`Session ${normalizedSessionId} deleted by user ${requesterId}`);
        res.status(200).json({
            success: true,
            message: 'Session deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSession = deleteSession;
//# sourceMappingURL=session.controller.js.map