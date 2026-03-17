"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const jwt_utils_1 = require("../utils/jwt.utils");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class SocketService {
    constructor(server) {
        this.pollRooms = new Map();
        this.activeQuestions = new Map();
        this.pollParticipants = new Map();
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            allowEIO3: true,
            maxHttpBufferSize: 1e8,
            pingTimeout: 60000,
            transports: ['websocket', 'polling'],
            allowUpgrades: true,
            connectTimeout: 45000,
        });
        console.log('Socket.IO server initialized');
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                let token = null;
                console.log('Socket handshake query:', socket.handshake.query);
                if (socket.handshake.query && socket.handshake.query.token) {
                    token = socket.handshake.query.token;
                    console.log('Found token in query.token');
                }
                if (!token && socket.handshake.query && socket.handshake.query.authorization) {
                    const authParam = socket.handshake.query.authorization;
                    token = authParam.startsWith('Bearer ') ? authParam.substring(7) : authParam;
                    console.log('Found token in query.authorization');
                }
                if (!token && socket.handshake.headers.authorization) {
                    const authHeader = socket.handshake.headers.authorization;
                    token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
                    console.log('Found token in headers.authorization');
                }
                if (!token && socket.handshake.auth && socket.handshake.auth.token) {
                    token = socket.handshake.auth.token;
                    console.log('Found token in auth.token');
                }
                if (!token) {
                    console.log('No token found in connection attempt');
                    return next(new Error('Authentication token required'));
                }
                console.log('Verifying token');
                const user = await (0, jwt_utils_1.verifyToken)(token);
                if (!user) {
                    console.log('Invalid token');
                    return next(new Error('Invalid token'));
                }
                console.log('User authenticated:', user.name || user.email);
                socket.user = user;
                next();
            }
            catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Socket connected: ${socket.id}`);
            socket.on('join-poll', (pollId) => {
                var _a;
                console.log('🔸 DEBUG - Received join-poll event:', pollId);
                console.log('🔸 DEBUG - From socket:', socket.id);
                console.log('🔸 DEBUG - User:', ((_a = socket.user) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown');
                this.handleJoinPoll(socket, pollId);
                const activeQuestion = this.activeQuestions.get(pollId);
                if (activeQuestion) {
                    console.log('🔸 DEBUG - Sending active question to new participant:', socket.id);
                    socket.emit('active-question', activeQuestion);
                }
                else {
                    console.log('🔸 DEBUG - No active question found for poll:', pollId);
                }
            });
            socket.on('leave-poll', (pollId) => {
                console.log('Received leave-poll event:', pollId);
                this.handleLeavePoll(socket, pollId);
            });
            socket.on('poll-response', (response) => {
                console.log('Received poll response:', response);
                this.handlePollResponse(socket, response);
            });
            socket.on('message', (message) => {
                console.log('Received message:', message);
                try {
                    const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
                    if (parsedMessage.event === 'join-poll' && parsedMessage.data) {
                        this.handleJoinPoll(socket, parsedMessage.data);
                    }
                    else if (parsedMessage.event === 'leave-poll' && parsedMessage.data) {
                        this.handleLeavePoll(socket, parsedMessage.data);
                    }
                    else if (parsedMessage.event === 'poll-response' && parsedMessage.data) {
                        this.handlePollResponse(socket, parsedMessage.data);
                    }
                    else {
                        console.log('Unknown event or invalid format:', parsedMessage);
                    }
                }
                catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            socket.onAny((event, ...args) => {
                console.log('Debug - Received event:', event, 'with args:', args);
            });
            socket.on('disconnect', () => {
                console.log(`Socket disconnected: ${socket.id}`);
                this.handleDisconnect(socket);
            });
        });
    }
    async getPollParticipants(pollId) {
        try {
            const dbParticipants = await prisma.poll.findUnique({
                where: { id: pollId },
                include: {
                    participants: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePhoto: true,
                        },
                    },
                },
            });
            const participants = [];
            if (dbParticipants === null || dbParticipants === void 0 ? void 0 : dbParticipants.participants) {
                for (const dbParticipant of dbParticipants.participants) {
                    participants.push({
                        id: dbParticipant.id,
                        name: dbParticipant.name,
                        email: dbParticipant.email,
                        profilePhoto: dbParticipant.profilePhoto,
                    });
                }
            }
            const socketParticipants = this.pollParticipants.get(pollId);
            if (socketParticipants) {
                for (const socketParticipant of socketParticipants.values()) {
                    const alreadyExists = participants.some(p => p.id === socketParticipant.id);
                    if (!alreadyExists) {
                        participants.push(socketParticipant);
                    }
                }
            }
            return participants;
        }
        catch (error) {
            console.error('Error fetching poll participants:', error);
            const socketParticipants = this.pollParticipants.get(pollId);
            if (!socketParticipants)
                return [];
            return Array.from(socketParticipants.values());
        }
    }
    async emitParticipantUpdates(socket, pollId) {
        var _a;
        const participantCount = ((_a = this.pollRooms.get(pollId)) === null || _a === void 0 ? void 0 : _a.size) || 0;
        const participants = await this.getPollParticipants(pollId);
        socket.emit('participant-count-updated', {
            pollId,
            count: participantCount,
        });
        socket.emit('participant-list-updated', {
            pollId,
            participants,
        });
        socket.broadcast.to(`poll:${pollId}`).emit('participant-count-updated', {
            pollId,
            count: participantCount,
        });
        socket.broadcast.to(`poll:${pollId}`).emit('participant-list-updated', {
            pollId,
            participants,
        });
    }
    handleJoinPoll(socket, pollId) {
        var _a, _b, _c;
        console.log(`Socket ${socket.id} joining poll ${pollId}`);
        const roomName = `poll:${pollId}`;
        socket.join(roomName);
        if (!this.pollRooms.has(pollId)) {
            this.pollRooms.set(pollId, new Set());
        }
        (_a = this.pollRooms.get(pollId)) === null || _a === void 0 ? void 0 : _a.add(socket.id);
        const user = socket.user;
        if (user) {
            if (!this.pollParticipants.has(pollId)) {
                this.pollParticipants.set(pollId, new Map());
            }
            (_b = this.pollParticipants.get(pollId)) === null || _b === void 0 ? void 0 : _b.set(socket.id, {
                id: user.id,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
            });
        }
        this.emitParticipantUpdates(socket, pollId);
        const participantCount = ((_c = this.pollRooms.get(pollId)) === null || _c === void 0 ? void 0 : _c.size) || 0;
        const updateMessage = {
            type: 'participant-count-updated',
            data: {
                pollId,
                count: participantCount,
                user: user
                    ? {
                        id: user.id,
                        name: user.name,
                    }
                    : null,
            },
        };
        socket.emit('message', updateMessage);
        socket.broadcast.to(roomName).emit('message', updateMessage);
        this.io.to(roomName).emit('poll-update', updateMessage);
        socket.emit('message', {
            type: 'joined-poll',
            data: {
                pollId,
                count: participantCount,
                socketId: socket.id,
                user: user
                    ? {
                        id: user.id,
                        name: user.name,
                    }
                    : null,
            },
        });
        const activeQuestion = this.activeQuestions.get(pollId);
        if (activeQuestion) {
            console.log('🔸 DEBUG - Sending active question to new participant:', socket.id);
            socket.emit('active-question', activeQuestion);
        }
        console.log(`Poll ${pollId} now has ${participantCount} participants`);
    }
    handleLeavePoll(socket, pollId) {
        var _a, _b, _c, _d, _e;
        console.log(`Socket ${socket.id} leaving poll ${pollId}`);
        const roomName = `poll:${pollId}`;
        socket.leave(roomName);
        (_a = this.pollRooms.get(pollId)) === null || _a === void 0 ? void 0 : _a.delete(socket.id);
        if (((_b = this.pollRooms.get(pollId)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
            this.pollRooms.delete(pollId);
        }
        (_c = this.pollParticipants.get(pollId)) === null || _c === void 0 ? void 0 : _c.delete(socket.id);
        if (((_d = this.pollParticipants.get(pollId)) === null || _d === void 0 ? void 0 : _d.size) === 0) {
            this.pollParticipants.delete(pollId);
        }
        this.emitParticipantUpdates(socket, pollId);
        const participantCount = ((_e = this.pollRooms.get(pollId)) === null || _e === void 0 ? void 0 : _e.size) || 0;
        const updateMessage = {
            type: 'participant-count-updated',
            data: {
                pollId,
                count: participantCount,
                leftSocketId: socket.id,
            },
        };
        socket.emit('message', {
            type: 'left-poll',
            data: {
                pollId,
                count: participantCount,
            },
        });
        socket.broadcast.to(roomName).emit('message', updateMessage);
        console.log(`Poll ${pollId} now has ${participantCount} participants`);
    }
    handlePollResponse(socket, response) {
        var _a, _b, _c;
        const { pollId, answer, type } = response;
        if (!pollId || !answer) {
            return;
        }
        const roomName = `poll:${pollId}`;
        let responseData = {
            type: 'new-response',
            data: {
                pollId,
                userId: (_a = socket.user) === null || _a === void 0 ? void 0 : _a.id,
                userName: (_b = socket.user) === null || _b === void 0 ? void 0 : _b.name,
                answer,
                responseType: type,
                timestamp: new Date().toISOString(),
            },
        };
        this.io.to(roomName).emit('poll-update', responseData);
        if (type === 'WORD_CLOUD') {
            this.io.to(roomName).emit('word-cloud-update', {
                type: 'word-cloud-update',
                data: {
                    pollId,
                    word: answer,
                    userId: (_c = socket.user) === null || _c === void 0 ? void 0 : _c.id,
                    timestamp: new Date().toISOString(),
                },
            });
        }
    }
    handleDisconnect(socket) {
        this.pollRooms.forEach((sockets, pollId) => {
            var _a, _b;
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    this.pollRooms.delete(pollId);
                }
                (_a = this.pollParticipants.get(pollId)) === null || _a === void 0 ? void 0 : _a.delete(socket.id);
                if (((_b = this.pollParticipants.get(pollId)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
                    this.pollParticipants.delete(pollId);
                }
                this.emitParticipantUpdates(socket, pollId);
                const roomName = `poll:${pollId}`;
                this.io.to(roomName).emit('poll-update', {
                    type: 'participant-count-updated',
                    data: {
                        pollId,
                        count: sockets.size,
                    },
                });
            }
        });
    }
    getPollParticipantCount(pollId) {
        var _a;
        return ((_a = this.pollRooms.get(pollId)) === null || _a === void 0 ? void 0 : _a.size) || 0;
    }
    broadcastPollUpdate(pollId, data) {
        var _a, _b, _c, _d, _e, _f;
        console.log(`🔹 DEBUG - Socket: Broadcasting update for poll ${pollId}`);
        console.log(`🔹 DEBUG - Socket: Room exists: ${this.io.sockets.adapter.rooms.has(`poll:${pollId}`)}`);
        console.log(`🔹 DEBUG - Socket: Room size: ${((_a = this.pollRooms.get(pollId)) === null || _a === void 0 ? void 0 : _a.size) || 0}`);
        console.log(`🔹 DEBUG - Socket: Update action: ${data.action}`);
        if (data.action === 'new-question') {
            console.log(`🔹 DEBUG - Socket: Setting active question for poll ${pollId}`);
            console.log(`🔹 DEBUG - Socket: Question started at: ${((_b = data.data) === null || _b === void 0 ? void 0 : _b.startedAt) || new Date().toISOString()}`);
            this.activeQuestions.set(pollId, {
                ...data,
                startedAt: ((_c = data.data) === null || _c === void 0 ? void 0 : _c.startedAt) || new Date().toISOString(),
            });
        }
        if (data.action === 'question-results') {
            console.log(`🔹 DEBUG - Socket: Broadcasting question results for poll ${pollId}`);
            console.log(`🔹 DEBUG - Socket: Question type: ${(_d = data.data) === null || _d === void 0 ? void 0 : _d.type}`);
            console.log(`🔹 DEBUG - Socket: Total responses: ${((_f = (_e = data.data) === null || _e === void 0 ? void 0 : _e.results) === null || _f === void 0 ? void 0 : _f.totalResponses) || 0}`);
        }
        console.log(`🔹 DEBUG - Socket: Emitting poll-updated to room poll:${pollId}`);
        this.io.to(`poll:${pollId}`).emit('poll-updated', data);
        if (data.action === 'new-question') {
            console.log(`🔹 DEBUG - Socket: Emitting active-question to room poll:${pollId}`);
            this.io.to(`poll:${pollId}`).emit('active-question', data);
        }
        console.log(`🔹 DEBUG - Socket: Broadcast complete`);
    }
    endPollQuestion(pollId) {
        var _a, _b, _c, _d, _e;
        console.log(`🔹 DEBUG - Socket: Ending active question for poll ${pollId}`);
        console.log(`🔹 DEBUG - Socket: Active question exists: ${this.activeQuestions.has(pollId)}`);
        const activeQuestion = this.activeQuestions.get(pollId);
        console.log(`🔹 DEBUG - Socket: Active question data:`, activeQuestion);
        this.activeQuestions.delete(pollId);
        console.log(`🔹 DEBUG - Socket: Emitting question-ended event to room poll:${pollId}`);
        console.log(`🔹 DEBUG - Socket: Room exists: ${this.io.sockets.adapter.rooms.has(`poll:${pollId}`)}`);
        console.log(`🔹 DEBUG - Socket: Room size: ${((_a = this.pollRooms.get(pollId)) === null || _a === void 0 ? void 0 : _a.size) || 0}`);
        this.io.to(`poll:${pollId}`).emit('question-ended', {
            pollId,
            timestamp: new Date().toISOString(),
            questionId: ((_c = (_b = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _b === void 0 ? void 0 : _b.question) === null || _c === void 0 ? void 0 : _c.id) || (activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.id),
        });
        this.io.to(`poll:${pollId}`).emit('poll-updated', {
            action: 'question-ended',
            data: {
                pollId,
                timestamp: new Date().toISOString(),
                questionId: ((_e = (_d = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _d === void 0 ? void 0 : _d.question) === null || _e === void 0 ? void 0 : _e.id) || (activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.id),
            },
        });
        console.log(`🔹 DEBUG - Socket: Question ended event emitted`);
    }
    getActiveQuestion(pollId) {
        return this.activeQuestions.get(pollId);
    }
    setActiveQuestion(pollId, questionData) {
        this.activeQuestions.set(pollId, questionData);
    }
}
exports.SocketService = SocketService;
exports.default = SocketService;
//# sourceMappingURL=socket.service.js.map