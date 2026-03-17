"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStandalonePollQuestionResults = exports.getStandalonePollResults = exports.createStandalonePoll = exports.endPollQuestion = exports.addPollQuestion = exports.getSessionPollQuestionResults = exports.getSessionPollResults = exports.getPollResults = exports.submitResponse = exports.joinPoll = exports.deletePoll = exports.updatePoll = exports.createPoll = exports.previewPoll = exports.quickCreatePoll = exports.getPollById = exports.getPolls = void 0;
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const poll_validation_1 = require("../validations/poll.validation");
const param_parser_1 = require("../utils/param-parser");
const prisma = new client_1.PrismaClient();
const getPolls = async (req, res) => {
    try {
        const { sessionId, isLive } = req.query;
        const sessionBasedPolls = await prisma.poll.findMany({
            where: {
                ...(sessionId && { sessionId: sessionId }),
                ...(isLive !== undefined && { isLive: isLive === 'true' }),
                sessionId: { not: null },
                OR: [
                    { isPublic: true },
                    {
                        session: {
                            participants: {
                                some: { id: req.user.id },
                            },
                        },
                    },
                ],
            },
            include: {
                options: true,
                _count: {
                    select: {
                        responses: true,
                        participants: true,
                    },
                },
            },
        });
        let polls = sessionBasedPolls;
        if (req.user.role === 'ADMIN') {
            const standalonePolls = await prisma.poll.findMany({
                where: {
                    ...(isLive !== undefined && { isLive: isLive === 'true' }),
                    sessionId: null,
                    isPublic: true,
                },
                include: {
                    options: true,
                    _count: {
                        select: {
                            responses: true,
                            participants: true,
                        },
                    },
                },
            });
            polls = [...sessionBasedPolls, ...standalonePolls];
        }
        res.json(polls);
    }
    catch (error) {
        console.error('Error getting polls:', error);
        res.status(400).json({ message: 'Failed to get polls', error: error.message });
    }
};
exports.getPolls = getPolls;
const getPollById = async (req, res) => {
    try {
        const { pollId } = req.params;
        const normalizedPollId = Array.isArray(pollId) ? pollId[0] : pollId;
        const poll = await prisma.poll.findUnique({
            where: { id: normalizedPollId },
            include: {
                options: true,
                participants: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        responses: true,
                        participants: true,
                    },
                },
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        if (!poll.isPublic) {
            if (!poll.sessionId) {
                if (req.user.role !== 'ADMIN') {
                    return res.status(403).json({ message: 'Not authorized to view this poll' });
                }
            }
            else {
                const hasAccess = await prisma.session.findFirst({
                    where: {
                        id: poll.sessionId,
                        participants: {
                            some: { id: req.user.id },
                        },
                    },
                });
                if (!hasAccess) {
                    return res.status(403).json({ message: 'Not authorized to view this poll' });
                }
            }
        }
        res.json(poll);
    }
    catch (error) {
        console.error('Error getting poll:', error);
        res.status(400).json({ message: 'Failed to get poll', error: error.message });
    }
};
exports.getPollById = getPollById;
const generateJoiningCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
const quickCreatePoll = async (req, res) => {
    try {
        const validatedData = poll_validation_1.quickCreatePollSchema.parse(req.body);
        const { title, sessionId, isPublic } = validatedData;
        let session = null;
        if (sessionId) {
            session = await prisma.session.findUnique({
                where: {
                    id: sessionId,
                    isActive: true,
                },
                include: {
                    createdBy: true,
                    participants: {
                        where: { id: req.user.id },
                    },
                },
            });
            if (!session) {
                return res.status(404).json({ message: 'Session not found or inactive' });
            }
            const hasPermission = session.createdById === req.user.id ||
                req.user.role === 'ADMIN' ||
                session.participants.length > 0;
            if (!hasPermission) {
                return res.status(403).json({ message: 'Not authorized to create polls in this session' });
            }
        }
        else {
            if (req.user.role !== 'ADMIN') {
                return res
                    .status(403)
                    .json({ message: 'Admin privileges required to create standalone polls' });
            }
        }
        let joiningCode = generateJoiningCode();
        let isCodeUnique = false;
        while (!isCodeUnique) {
            const existingPoll = await prisma.poll.findUnique({
                where: { joiningCode },
            });
            if (!existingPoll) {
                isCodeUnique = true;
            }
            else {
                joiningCode = generateJoiningCode();
            }
        }
        const poll = await prisma.poll.create({
            data: {
                title,
                question: '',
                type: 'SINGLE_CHOICE',
                joiningCode,
                isLive: false,
                showResults: false,
                isPublic,
                sessionId: sessionId || null,
            },
            include: {
                options: true,
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });
        return res.status(201).json({
            pollId: poll.id,
            title: poll.title,
            joiningCode: poll.joiningCode,
        });
    }
    catch (error) {
        console.error('Error creating quick poll:', error);
        return res.status(400).json({
            message: 'Failed to create quick poll',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.quickCreatePoll = quickCreatePoll;
const previewPoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const normalizedPollId = Array.isArray(pollId) ? pollId[0] : pollId;
        const poll = await prisma.poll.findUnique({
            where: { id: normalizedPollId },
            include: {
                options: true,
                _count: {
                    select: {
                        responses: true,
                    },
                },
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        res.json({
            id: poll.id,
            title: poll.title,
            question: poll.question,
            type: poll.type,
            options: poll.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
                imageUrl: opt.imageUrl,
            })),
            isLive: poll.isLive,
            showResults: poll.showResults,
            responseCount: poll._count.responses,
        });
    }
    catch (error) {
        console.error('Error previewing poll:', error);
        res.status(400).json({ message: 'Failed to preview poll', error: error.message });
    }
};
exports.previewPoll = previewPoll;
const createPoll = async (req, res) => {
    try {
        const validatedData = poll_validation_1.createPollSchema.parse(req.body);
        const { title, sessionId, type, isLive, showResults, isPublic, maxVotes, timeLimit, question, questions, options, } = validatedData;
        let session = null;
        if (sessionId) {
            session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: { createdBy: true },
            });
            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }
            if (session.createdById !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Not authorized to create polls in this session' });
            }
        }
        else {
            if (req.user.role !== 'ADMIN') {
                return res
                    .status(403)
                    .json({ message: 'Admin privileges required to create standalone polls' });
            }
        }
        let existingPoll = null;
        if (req.query.pollId) {
            existingPoll = await prisma.poll.findUnique({
                where: { id: req.query.pollId },
            });
        }
        const joiningCode = existingPoll
            ? existingPoll.joiningCode
            : (0, uuid_1.v4)().slice(0, 8).toUpperCase();
        const poll = existingPoll
            ? await prisma.poll.update({
                where: { id: existingPoll.id },
                data: {
                    type: type,
                    isLive,
                    showResults,
                    isPublic,
                    maxVotes,
                    timeLimit,
                    options: options
                        ? {
                            deleteMany: {},
                            create: options.map((opt) => ({
                                text: opt.text,
                                imageUrl: opt.imageUrl,
                                order: opt.order,
                            })),
                        }
                        : undefined,
                },
            })
            : await prisma.poll.create({
                data: {
                    title,
                    question: question || '',
                    type: type,
                    joiningCode,
                    isLive,
                    showResults,
                    isPublic,
                    maxVotes,
                    timeLimit,
                    sessionId: sessionId || null,
                    options: options
                        ? {
                            create: options.map((opt) => ({
                                text: opt.text,
                                imageUrl: opt.imageUrl,
                                order: opt.order,
                            })),
                        }
                        : undefined,
                },
            });
        if (questions && questions.length > 0) {
            for (const q of questions) {
                await prisma.pollQuestion.create({
                    data: {
                        poll: { connect: { id: poll.id } },
                        question: q.question,
                        type: q.type,
                        order: q.order,
                        options: q.options
                            ? {
                                create: q.options.map((opt) => ({
                                    text: opt.text,
                                    imageUrl: opt.imageUrl,
                                    order: opt.order,
                                })),
                            }
                            : undefined,
                    },
                });
            }
        }
        else if (question) {
            await prisma.pollQuestion.create({
                data: {
                    poll: { connect: { id: poll.id } },
                    question: question,
                    type: type,
                    order: 0,
                    options: options
                        ? {
                            create: options.map((opt) => ({
                                text: opt.text,
                                imageUrl: opt.imageUrl,
                                order: opt.order,
                            })),
                        }
                        : undefined,
                },
            });
        }
        const completePoll = await prisma.poll.findUnique({
            where: { id: poll.id },
            include: {
                options: true,
            },
        });
        const pollQuestions = await prisma.pollQuestion.findMany({
            where: { pollId: poll.id },
            include: {
                options: true,
            },
        });
        res.status(201).json({
            ...completePoll,
            questions: pollQuestions,
            previewUrl: `/polls/${poll.id}/preview`,
        });
    }
    catch (error) {
        console.error('Error creating/updating poll:', error);
        res.status(400).json({ message: 'Failed to create/update poll', error: error.message });
    }
};
exports.createPoll = createPoll;
const updatePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const normalizedPollId = Array.isArray(pollId) ? pollId[0] : pollId;
        const validatedData = poll_validation_1.updatePollSchema.parse(req.body);
        const poll = await prisma.poll.findUnique({
            where: { id: normalizedPollId },
            include: {
                session: true,
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        if (poll.session && poll.session.createdById !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to update this poll' });
        }
        else if (!poll.session && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to update this poll' });
        }
        const updatedPoll = await prisma.poll.update({
            where: { id: normalizedPollId },
            data: {
                title: validatedData.title,
                question: validatedData.question,
                isLive: validatedData.isLive,
                showResults: validatedData.showResults,
                isPublic: validatedData.isPublic,
                maxVotes: validatedData.maxVotes,
                timeLimit: validatedData.timeLimit,
            },
            include: {
                options: true,
            },
        });
        res.json(updatedPoll);
    }
    catch (error) {
        console.error('Error updating poll:', error);
        res.status(400).json({ message: 'Failed to update poll', error: error.message });
    }
};
exports.updatePoll = updatePoll;
const deletePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const normalizedPollId = Array.isArray(pollId) ? pollId[0] : pollId;
        const poll = await prisma.poll.findUnique({
            where: { id: normalizedPollId },
            include: {
                session: true,
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        if (poll.session && poll.session.createdById !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to delete this poll' });
        }
        else if (!poll.session && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to delete this poll' });
        }
        await prisma.poll.delete({
            where: { id: normalizedPollId },
        });
        res.json({ message: 'Poll deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting poll:', error);
        res.status(400).json({ message: 'Failed to delete poll', error: error.message });
    }
};
exports.deletePoll = deletePoll;
const joinPoll = async (req, res) => {
    try {
        console.log('🔍 DEBUG - joinPoll called');
        console.log('🔍 DEBUG - User ID:', req.user.id);
        console.log('🔍 DEBUG - User Name:', req.user.name);
        console.log('🔍 DEBUG - Request body:', req.body);
        const { joiningCode } = poll_validation_1.joinPollSchema.parse(req.body);
        console.log('🔍 DEBUG - Joining code:', joiningCode);
        const poll = await prisma.poll.findUnique({
            where: { joiningCode },
            include: {
                session: true,
                participants: true,
            },
        });
        console.log('🔍 DEBUG - Poll found:', poll ? 'Yes' : 'No');
        if (poll) {
            console.log('🔍 DEBUG - Poll ID:', poll.id);
            console.log('🔍 DEBUG - Current participants:', poll.participants.map((p) => ({ id: p.id, name: p.name })));
        }
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        const isAlreadyParticipant = poll.participants.some((participant) => participant.id === req.user.id);
        console.log('🔍 DEBUG - Is already participant:', isAlreadyParticipant);
        if (isAlreadyParticipant) {
            console.log('🔍 DEBUG - User already joined, returning error');
            return res.status(400).json({ message: 'User has already joined this poll' });
        }
        if (!poll.isPublic && poll.session) {
            console.log('🔍 DEBUG - Poll is not public, checking session participation');
            const isSessionParticipant = await prisma.session.findFirst({
                where: {
                    id: poll.session.id,
                    participants: {
                        some: {
                            id: req.user.id,
                        },
                    },
                },
            });
            console.log('🔍 DEBUG - Is session participant:', isSessionParticipant ? 'Yes' : 'No');
            if (!isSessionParticipant) {
                return res
                    .status(403)
                    .json({ message: 'You must be a session participant to join this poll' });
            }
        }
        console.log('🔍 DEBUG - Adding user to poll participants');
        const updatedPoll = await prisma.poll.update({
            where: { id: poll.id },
            data: {
                participants: {
                    connect: { id: req.user.id },
                },
            },
            include: {
                options: true,
                participants: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });
        console.log('🔍 DEBUG - Poll updated successfully');
        console.log('🔍 DEBUG - Updated participants:', updatedPoll.participants);
        console.log('🔍 DEBUG - Participant count:', updatedPoll._count.participants);
        const socketService = req.app.get('socketService');
        if (socketService) {
            console.log('🔍 DEBUG - Broadcasting poll update via socket');
            socketService.broadcastPollUpdate(poll.id, {
                id: updatedPoll.id,
                title: updatedPoll.title,
                participantCount: updatedPoll._count.participants,
                participants: updatedPoll.participants,
            });
        }
        else {
            console.log('🔍 DEBUG - Socket service not available');
        }
        console.log('🔍 DEBUG - Returning success response');
        return res.json({
            message: 'Successfully joined poll',
            poll: {
                id: updatedPoll.id,
                title: updatedPoll.title,
                options: updatedPoll.options,
                participantCount: updatedPoll._count.participants,
                participants: updatedPoll.participants,
            },
        });
    }
    catch (error) {
        console.error('🔍 DEBUG - Error in joinPoll:', error);
        return res.status(400).json({
            message: 'Failed to join poll',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.joinPoll = joinPoll;
const submitResponse = async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        console.log('🔍 DEBUG - Submitting poll response');
        const validatedData = poll_validation_1.submitPollResponseSchema.parse(req.body);
        (0, poll_validation_1.validatePollResponse)(validatedData);
        const { pollId, questionOptionId, textResponse, ranking, scale, anonymous } = validatedData;
        const socketService = req.app.get('socketService');
        const activeQuestion = socketService === null || socketService === void 0 ? void 0 : socketService.getActiveQuestion(pollId);
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                session: true,
                participants: true,
                options: true,
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        if (!poll.isLive) {
            return res.status(400).json({ message: 'This poll is not currently active' });
        }
        if (!activeQuestion) {
            return res.status(400).json({ message: 'No active question found for this poll' });
        }
        if (activeQuestion && activeQuestion.startedAt && poll.timeLimit) {
            const startTime = new Date(activeQuestion.startedAt);
            const currentTime = new Date();
            const elapsedSeconds = (currentTime.getTime() - startTime.getTime()) / 1000;
            if (elapsedSeconds > poll.timeLimit) {
                return res.status(400).json({ message: 'The time limit for this question has expired' });
            }
        }
        if (!poll.isPublic) {
            if (!poll.session) {
                if (req.user.role !== 'ADMIN') {
                    return res
                        .status(403)
                        .json({ message: 'You must be an admin to submit a response to this poll' });
                }
            }
            else {
                const isParticipant = await prisma.session.findFirst({
                    where: {
                        id: poll.session.id,
                        participants: {
                            some: { id: req.user.id },
                        },
                    },
                });
                if (!isParticipant) {
                    return res
                        .status(403)
                        .json({ message: 'You must be a session participant to submit a response' });
                }
            }
        }
        if (poll.maxVotes === 1) {
            const existingResponse = await prisma.pollResponse.findFirst({
                where: {
                    pollId,
                    userId: req.user.id,
                },
            });
            if (existingResponse) {
                return res
                    .status(400)
                    .json({ message: 'You have already submitted a response to this poll' });
            }
        }
        console.log('🔍 DEBUG - Creating poll response with data:', {
            pollId,
            userId: req.user.id,
            questionOptionId,
            questionId: (_b = (_a = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _a === void 0 ? void 0 : _a.question) === null || _b === void 0 ? void 0 : _b.id,
            textResponse,
            ranking,
            scale,
            anonymous,
        });
        const response = await prisma.pollResponse.create({
            data: {
                poll: { connect: { id: pollId } },
                user: { connect: { id: req.user.id } },
                ...(questionOptionId && { questionOption: { connect: { id: questionOptionId } } }),
                ...(((_d = (_c = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _c === void 0 ? void 0 : _c.question) === null || _d === void 0 ? void 0 : _d.id) && {
                    question: { connect: { id: activeQuestion.data.question.id } },
                }),
                textResponse,
                ranking,
                scale,
                anonymous,
            },
        });
        console.log('🔍 DEBUG - Created response:', response);
        const questionType = ((_f = (_e = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _e === void 0 ? void 0 : _e.question) === null || _f === void 0 ? void 0 : _f.type) || poll.type;
        console.log('🔍 DEBUG - Question type:', questionType);
        let responseType = questionType;
        let answer = questionOptionId || textResponse || (ranking === null || ranking === void 0 ? void 0 : ranking.toString()) || (scale === null || scale === void 0 ? void 0 : scale.toString());
        console.log(`🔍 DEBUG - Response type: ${responseType}, Answer: ${answer}`);
        if (socketService) {
            console.log('🔍 DEBUG - Broadcasting response via WebSocket');
            const responseData = {
                action: 'new-response',
                data: {
                    pollId,
                    questionId: (_h = (_g = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _g === void 0 ? void 0 : _g.question) === null || _h === void 0 ? void 0 : _h.id,
                    response: {
                        id: response.id,
                        userId: req.user.id,
                        userName: req.user.name,
                        answer,
                        type: responseType,
                        timestamp: new Date().toISOString(),
                        anonymous,
                    },
                },
            };
            socketService.broadcastPollUpdate(pollId, responseData);
            console.log('🔍 DEBUG - Response broadcast completed');
        }
        else {
            console.log('❌ ERROR - Socket service not available for response broadcast');
        }
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error submitting response:', error);
        res.status(400).json({ message: 'Failed to submit response', error: error.message });
    }
};
exports.submitResponse = submitResponse;
const getPollResults = async (req, res) => {
    try {
        const { pollId } = req.params;
        const normalizedPollId = Array.isArray(pollId) ? pollId[0] : pollId;
        const poll = await prisma.poll.findUnique({
            where: { id: normalizedPollId },
            include: {
                session: {
                    select: {
                        id: true,
                        createdById: true,
                        participants: { select: { id: true } },
                    },
                },
                questions: {
                    include: {
                        options: {
                            include: {
                                responses: {
                                    include: {
                                        user: { select: { id: true, name: true } },
                                    },
                                },
                            },
                        },
                        responses: {
                            include: {
                                user: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
                options: {
                    include: {
                        responses: true,
                    },
                },
                responses: {
                    select: {
                        textResponse: true,
                        ranking: true,
                        scale: true,
                        anonymous: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        if (poll.sessionId && poll.session) {
            const isAdmin = req.user.role === 'ADMIN';
            const isSessionCreator = poll.session.createdById === req.user.id;
            const isParticipant = poll.session.participants.some((p) => p.id === req.user.id);
            if (!isAdmin && !isSessionCreator && !isParticipant) {
                return res.status(403).json({ message: 'Not authorized to view this poll results' });
            }
            if (poll.questions && poll.questions.length > 0) {
                const questionsResults = poll.questions.map((question) => {
                    let results = {};
                    const allResponses = [];
                    question.options.forEach((option) => {
                        allResponses.push(...option.responses);
                    });
                    allResponses.push(...question.responses);
                    switch (question.type) {
                        case 'SINGLE_CHOICE':
                        case 'MULTIPLE_CHOICE': {
                            const totalResponses = question.options.reduce((sum, opt) => sum + opt.responses.length, 0);
                            const options = question.options.map((option) => {
                                const count = option.responses.length;
                                return {
                                    optionId: option.id,
                                    text: option.text,
                                    count,
                                    percentage: totalResponses ? (count / totalResponses) * 100 : 0,
                                };
                            });
                            results = { totalResponses, options };
                            break;
                        }
                        case 'WORD_CLOUD': {
                            const wordCounts = {};
                            allResponses.forEach((response) => {
                                if (response.textResponse) {
                                    wordCounts[response.textResponse] = (wordCounts[response.textResponse] || 0) + 1;
                                }
                            });
                            const words = Object.entries(wordCounts).map(([text, count]) => ({
                                text,
                                count,
                                weight: count,
                            }));
                            results = { totalResponses: allResponses.length, words };
                            break;
                        }
                        case 'OPEN_TEXT': {
                            results = {
                                totalResponses: allResponses.length,
                                responses: allResponses.map((response) => {
                                    var _a;
                                    return ({
                                        id: response.id,
                                        text: response.textResponse,
                                        userName: response.anonymous ? 'Anonymous' : (_a = response.user) === null || _a === void 0 ? void 0 : _a.name,
                                        timestamp: response.createdAt,
                                    });
                                }),
                            };
                            break;
                        }
                        case 'RANKING': {
                            results = {
                                totalResponses: allResponses.length,
                                rankings: allResponses.map((response) => ({
                                    ranking: response.ranking,
                                    user: response.anonymous ? null : response.user,
                                })),
                            };
                            break;
                        }
                        case 'SCALE': {
                            results = {
                                totalResponses: allResponses.length,
                                scales: allResponses.map((response) => ({
                                    scale: response.scale,
                                    user: response.anonymous ? null : response.user,
                                })),
                            };
                            break;
                        }
                        default:
                            results = {
                                totalResponses: allResponses.length,
                                message: `Results for ${question.type} not implemented yet`,
                            };
                    }
                    return {
                        questionId: question.id,
                        question: question.question,
                        type: question.type,
                        results,
                    };
                });
                res.json({
                    pollId: poll.id,
                    title: poll.title,
                    sessionId: poll.sessionId,
                    type: poll.type,
                    questions: questionsResults,
                });
            }
            else {
                let results = [];
                switch (poll.type) {
                    case 'SINGLE_CHOICE':
                    case 'MULTIPLE_CHOICE':
                        results = poll.options.map((option) => ({
                            text: option.text,
                            count: option.responses.length,
                        }));
                        break;
                    case 'WORD_CLOUD':
                        results = poll.responses
                            .map((r) => ({ text: r.textResponse }))
                            .filter((r) => !!r.text);
                        break;
                    case 'RANKING':
                        results = poll.responses.map((r) => ({
                            ranking: r.ranking,
                            user: r.anonymous ? null : r.user,
                        }));
                        break;
                    case 'SCALE':
                        results = poll.responses.map((r) => ({
                            scale: r.scale,
                            user: r.anonymous ? null : r.user,
                        }));
                        break;
                    default:
                        results = [];
                }
                res.json({
                    pollId: poll.id,
                    title: poll.title,
                    sessionId: poll.sessionId,
                    type: poll.type,
                    results,
                });
            }
        }
        else {
            const isAdmin = req.user.role === 'ADMIN';
            if (!isAdmin) {
                return res.status(403).json({ message: 'Not authorized to view this poll results' });
            }
            if (poll.questions && poll.questions.length > 0) {
                const questionsResults = poll.questions.map((question) => {
                    let results = {};
                    const allResponses = [];
                    question.options.forEach((option) => {
                        allResponses.push(...option.responses);
                    });
                    allResponses.push(...question.responses);
                    switch (question.type) {
                        case 'SINGLE_CHOICE':
                        case 'MULTIPLE_CHOICE': {
                            const totalResponses = question.options.reduce((sum, opt) => sum + opt.responses.length, 0);
                            const options = question.options.map((option) => {
                                const count = option.responses.length;
                                return {
                                    optionId: option.id,
                                    text: option.text,
                                    count,
                                    percentage: totalResponses ? (count / totalResponses) * 100 : 0,
                                };
                            });
                            results = { totalResponses, options };
                            break;
                        }
                        case 'WORD_CLOUD': {
                            const wordCounts = {};
                            allResponses.forEach((response) => {
                                if (response.textResponse) {
                                    wordCounts[response.textResponse] = (wordCounts[response.textResponse] || 0) + 1;
                                }
                            });
                            const words = Object.entries(wordCounts).map(([text, count]) => ({
                                text,
                                count,
                                weight: count,
                            }));
                            results = { totalResponses: allResponses.length, words };
                            break;
                        }
                        case 'OPEN_TEXT': {
                            results = {
                                totalResponses: allResponses.length,
                                responses: allResponses.map((response) => {
                                    var _a;
                                    return ({
                                        id: response.id,
                                        text: response.textResponse,
                                        userName: response.anonymous ? 'Anonymous' : (_a = response.user) === null || _a === void 0 ? void 0 : _a.name,
                                        timestamp: response.createdAt,
                                    });
                                }),
                            };
                            break;
                        }
                        case 'RANKING': {
                            results = {
                                totalResponses: allResponses.length,
                                rankings: allResponses.map((response) => ({
                                    ranking: response.ranking,
                                    user: response.anonymous ? null : response.user,
                                })),
                            };
                            break;
                        }
                        case 'SCALE': {
                            results = {
                                totalResponses: allResponses.length,
                                scales: allResponses.map((response) => ({
                                    scale: response.scale,
                                    user: response.anonymous ? null : response.user,
                                })),
                            };
                            break;
                        }
                        default:
                            results = {
                                totalResponses: allResponses.length,
                                message: `Results for ${question.type} not implemented yet`,
                            };
                    }
                    return {
                        questionId: question.id,
                        question: question.question,
                        type: question.type,
                        results,
                    };
                });
                res.json({
                    pollId: poll.id,
                    title: poll.title,
                    type: poll.type,
                    questions: questionsResults,
                });
            }
            else {
                let results = [];
                switch (poll.type) {
                    case 'SINGLE_CHOICE':
                    case 'MULTIPLE_CHOICE':
                        results = poll.options.map((option) => ({
                            text: option.text,
                            count: option.responses.length,
                        }));
                        break;
                    case 'WORD_CLOUD':
                        results = poll.responses
                            .map((r) => ({ text: r.textResponse }))
                            .filter((r) => !!r.text);
                        break;
                    case 'RANKING':
                        results = poll.responses.map((r) => ({
                            ranking: r.ranking,
                            user: r.anonymous ? null : r.user,
                        }));
                        break;
                    case 'SCALE':
                        results = poll.responses.map((r) => ({
                            scale: r.scale,
                            user: r.anonymous ? null : r.user,
                        }));
                        break;
                    default:
                        results = [];
                }
                res.json({
                    pollId: poll.id,
                    title: poll.title,
                    type: poll.type,
                    results,
                });
            }
        }
    }
    catch (error) {
        console.error('Error getting poll results:', error);
        res.status(400).json({ message: 'Failed to get poll results', error: error.message });
    }
};
exports.getPollResults = getPollResults;
const getSessionPollResults = async (req, res) => {
    try {
        const { pollId } = req.params;
        const normalizedPollId = Array.isArray(pollId) ? pollId[0] : pollId;
        const poll = await prisma.poll.findUnique({
            where: { id: normalizedPollId },
            include: {
                session: {
                    select: {
                        id: true,
                        createdById: true,
                        participants: { select: { id: true } },
                    },
                },
                questions: {
                    include: {
                        options: {
                            include: {
                                responses: {
                                    include: {
                                        user: { select: { id: true, name: true } },
                                    },
                                },
                            },
                        },
                        responses: {
                            include: {
                                user: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        if (!poll.sessionId || !poll.session) {
            return res
                .status(400)
                .json({ message: 'Only session-based polls are supported by this endpoint.' });
        }
        const isAdmin = req.user.role === 'ADMIN';
        const isSessionCreator = poll.session.createdById === req.user.id;
        const isParticipant = poll.session.participants.some((p) => p.id === req.user.id);
        if (!isAdmin && !isSessionCreator && !isParticipant) {
            return res.status(403).json({ message: 'Not authorized to view this poll results' });
        }
        const questionsResults = poll.questions.map((question) => {
            let results = {};
            const allResponses = [];
            question.options.forEach((option) => {
                allResponses.push(...option.responses);
            });
            allResponses.push(...question.responses);
            console.log(`🔍 DEBUG - Question ${question.id} (${question.type}):`);
            console.log(`  - Options responses: ${question.options.reduce((sum, opt) => sum + opt.responses.length, 0)}`);
            console.log(`  - Direct question responses: ${question.responses.length}`);
            console.log(`  - Total responses: ${allResponses.length}`);
            console.log(`  - Response details:`, allResponses.map((r) => ({
                id: r.id,
                textResponse: r.textResponse,
                questionOptionId: r.questionOptionId,
                questionId: r.questionId,
            })));
            switch (question.type) {
                case 'SINGLE_CHOICE':
                case 'MULTIPLE_CHOICE': {
                    const totalResponses = question.options.reduce((sum, opt) => sum + opt.responses.length, 0);
                    const options = question.options.map((option) => {
                        const count = option.responses.length;
                        return {
                            optionId: option.id,
                            text: option.text,
                            count,
                            percentage: totalResponses ? (count / totalResponses) * 100 : 0,
                        };
                    });
                    results = { totalResponses, options };
                    break;
                }
                case 'WORD_CLOUD': {
                    const wordCounts = {};
                    allResponses.forEach((response) => {
                        if (response.textResponse) {
                            wordCounts[response.textResponse] = (wordCounts[response.textResponse] || 0) + 1;
                        }
                    });
                    const words = Object.entries(wordCounts).map(([text, count]) => ({
                        text,
                        count,
                        weight: count,
                    }));
                    results = { totalResponses: allResponses.length, words };
                    break;
                }
                case 'OPEN_TEXT': {
                    results = {
                        totalResponses: allResponses.length,
                        responses: allResponses.map((response) => {
                            var _a;
                            return ({
                                id: response.id,
                                text: response.textResponse,
                                userName: response.anonymous ? 'Anonymous' : (_a = response.user) === null || _a === void 0 ? void 0 : _a.name,
                                timestamp: response.createdAt,
                            });
                        }),
                    };
                    break;
                }
                case 'RANKING': {
                    results = {
                        totalResponses: allResponses.length,
                        rankings: allResponses.map((response) => ({
                            ranking: response.ranking,
                            user: response.anonymous ? null : response.user,
                        })),
                    };
                    break;
                }
                case 'SCALE': {
                    results = {
                        totalResponses: allResponses.length,
                        scales: allResponses.map((response) => ({
                            scale: response.scale,
                            user: response.anonymous ? null : response.user,
                        })),
                    };
                    break;
                }
                default:
                    results = {
                        totalResponses: allResponses.length,
                        message: `Results for ${question.type} not implemented yet`,
                    };
            }
            return {
                questionId: question.id,
                question: question.question,
                type: question.type,
                results,
            };
        });
        res.json({
            pollId: poll.id,
            title: poll.title,
            sessionId: poll.sessionId,
            questions: questionsResults,
        });
    }
    catch (error) {
        console.error('Error getting session poll results:', error);
        res.status(400).json({ message: 'Failed to get session poll results', error: error.message });
    }
};
exports.getSessionPollResults = getSessionPollResults;
const getSessionPollQuestionResults = async (req, res) => {
    try {
        const { pollId, questionId } = req.params;
        const normalizedPollId = Array.isArray(pollId) ? pollId[0] : pollId;
        const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;
        const poll = await prisma.poll.findUnique({
            where: { id: normalizedPollId },
            include: {
                session: {
                    select: {
                        id: true,
                        createdById: true,
                        participants: { select: { id: true } },
                    },
                },
                questions: {
                    where: { id: normalizedQuestionId },
                    include: {
                        options: {
                            include: {
                                responses: {
                                    include: {
                                        user: { select: { id: true, name: true } },
                                    },
                                },
                            },
                        },
                        responses: {
                            include: {
                                user: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        if (!poll.sessionId || !poll.session) {
            return res
                .status(400)
                .json({ message: 'Only session-based polls are supported by this endpoint.' });
        }
        const isAdmin = req.user.role === 'ADMIN';
        const isSessionCreator = poll.session.createdById === req.user.id;
        const isParticipant = poll.session.participants.some((p) => p.id === req.user.id);
        if (!isAdmin && !isSessionCreator && !isParticipant) {
            return res.status(403).json({ message: 'Not authorized to view this poll results' });
        }
        const question = poll.questions[0];
        if (!question) {
            return res.status(404).json({ message: 'Question not found in this poll' });
        }
        const allResponses = [];
        question.options.forEach((option) => {
            allResponses.push(...option.responses);
        });
        allResponses.push(...question.responses);
        let results = {};
        switch (question.type) {
            case 'SINGLE_CHOICE':
            case 'MULTIPLE_CHOICE': {
                const totalResponses = question.options.reduce((sum, opt) => sum + opt.responses.length, 0);
                const options = question.options.map((option) => {
                    const count = option.responses.length;
                    return {
                        optionId: option.id,
                        text: option.text,
                        count,
                        percentage: totalResponses ? (count / totalResponses) * 100 : 0,
                    };
                });
                results = { totalResponses, options };
                break;
            }
            case 'WORD_CLOUD': {
                const wordCounts = {};
                allResponses.forEach((response) => {
                    if (response.textResponse) {
                        wordCounts[response.textResponse] = (wordCounts[response.textResponse] || 0) + 1;
                    }
                });
                const words = Object.entries(wordCounts).map(([text, count]) => ({
                    text,
                    count,
                    weight: count,
                }));
                results = { totalResponses: allResponses.length, words };
                break;
            }
            case 'OPEN_TEXT': {
                results = {
                    totalResponses: allResponses.length,
                    responses: allResponses.map((response) => {
                        var _a;
                        return ({
                            id: response.id,
                            text: response.textResponse,
                            userName: response.anonymous ? 'Anonymous' : (_a = response.user) === null || _a === void 0 ? void 0 : _a.name,
                            timestamp: response.createdAt,
                        });
                    }),
                };
                break;
            }
            case 'RANKING': {
                results = {
                    totalResponses: allResponses.length,
                    rankings: allResponses.map((response) => ({
                        ranking: response.ranking,
                        user: response.anonymous ? null : response.user,
                    })),
                };
                break;
            }
            case 'SCALE': {
                results = {
                    totalResponses: allResponses.length,
                    scales: allResponses.map((response) => ({
                        scale: response.scale,
                        user: response.anonymous ? null : response.user,
                    })),
                };
                break;
            }
            default:
                results = {
                    totalResponses: allResponses.length,
                    message: `Results for ${question.type} not implemented yet`,
                };
        }
        res.json({
            pollId: poll.id,
            questionId: question.id,
            question: question.question,
            type: question.type,
            results,
        });
    }
    catch (error) {
        console.error('Error getting session poll question results:', error);
        res
            .status(400)
            .json({ message: 'Failed to get session poll question results', error: error.message });
    }
};
exports.getSessionPollQuestionResults = getSessionPollQuestionResults;
const addPollQuestion = async (req, res) => {
    try {
        const validatedData = poll_validation_1.addPollQuestionSchema.parse(req.body);
        const { pollId, question, type, order, timeLimit, options } = validatedData;
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                session: {
                    select: {
                        createdById: true,
                        participants: {
                            select: { id: true },
                        },
                    },
                },
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        const hasPermission = req.user.role === 'ADMIN' ||
            (poll.session && poll.session.createdById === req.user.id) ||
            !poll.session;
        if (!hasPermission) {
            return res.status(403).json({ message: 'Not authorized to add questions to this poll' });
        }
        const questionStartTime = new Date();
        await prisma.poll.update({
            where: { id: pollId },
            data: {
                isLive: true,
                ...(timeLimit && { timeLimit }),
            },
        });
        const newQuestion = await prisma.pollQuestion.create({
            data: {
                poll: { connect: { id: pollId } },
                question: question,
                type: type,
                order: order || 0,
                isActive: true,
            },
        });
        if (options && ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RANKING'].includes(type)) {
            await Promise.all(options.map(async (option) => {
                return prisma.pollQuestionOption.create({
                    data: {
                        text: option.text,
                        imageUrl: option.imageUrl,
                        order: option.order,
                        question: { connect: { id: newQuestion.id } },
                    },
                });
            }));
        }
        const completeQuestion = await prisma.pollQuestion.findUnique({
            where: { id: newQuestion.id },
            include: {
                options: true,
            },
        });
        if (!completeQuestion) {
            return res.status(500).json({ message: 'Failed to retrieve created question' });
        }
        const socketService = req.app.get('socketService');
        console.log('🔍 DEBUG - Adding poll question - Socket service exists:', !!socketService);
        if (socketService) {
            console.log('🔍 DEBUG - Broadcasting new question for poll:', pollId);
            console.log('🔍 DEBUG - Poll room size:', socketService.getPollParticipantCount(pollId));
            socketService.setActiveQuestion(pollId, {
                id: completeQuestion.id,
                question: completeQuestion.question,
                type: completeQuestion.type,
                startedAt: questionStartTime.toISOString(),
                options: completeQuestion.options,
            });
            const eventData = {
                action: 'new-question',
                data: {
                    poll: {
                        id: poll.id,
                        title: poll.title,
                    },
                    question: {
                        id: completeQuestion.id,
                        question: completeQuestion.question,
                        type: completeQuestion.type,
                        timeLimit: timeLimit || poll.timeLimit,
                        options: completeQuestion.options.map((opt) => ({
                            id: opt.id,
                            text: opt.text,
                            imageUrl: opt.imageUrl,
                            order: opt.order,
                        })),
                    },
                    startedAt: questionStartTime.toISOString(),
                },
            };
            console.log('🔍 DEBUG - Event data being sent:', JSON.stringify(eventData));
            socketService.broadcastPollUpdate(pollId, eventData);
            if (timeLimit && timeLimit > 0) {
                console.log(`🔍 DEBUG - Setting timer to end question after ${timeLimit} seconds`);
                setTimeout(async () => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    try {
                        console.log(`🔍 DEBUG - Timer expired for poll ${pollId}. Ending question automatically.`);
                        const currentPoll = await prisma.poll.findUnique({
                            where: { id: pollId },
                            include: {
                                _count: {
                                    select: {
                                        questions: true,
                                    },
                                },
                            },
                        });
                        const activeQuestion = socketService.getActiveQuestion(pollId);
                        console.log('🔍 DEBUG - Current poll:', currentPoll);
                        console.log('🔍 DEBUG - Active question:', activeQuestion);
                        if (currentPoll === null || currentPoll === void 0 ? void 0 : currentPoll.isLive) {
                            console.log('🔍 DEBUG - Poll is still live, proceeding with auto-end');
                            try {
                                let questionStartTime = null;
                                if (activeQuestion && activeQuestion.startedAt) {
                                    questionStartTime = new Date(activeQuestion.startedAt);
                                }
                                const pollWithResponses = await prisma.poll.findUnique({
                                    where: { id: pollId },
                                    include: {
                                        responses: {
                                            include: {
                                                user: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                    },
                                                },
                                                questionOption: true,
                                            },
                                            ...(questionStartTime && {
                                                where: {
                                                    createdAt: {
                                                        gte: questionStartTime,
                                                    },
                                                },
                                            }),
                                        },
                                        _count: {
                                            select: {
                                                questions: true,
                                            },
                                        },
                                    },
                                });
                                console.log('🔍 DEBUG - Question start time:', questionStartTime);
                                console.log('🔍 DEBUG - Filtered responses found:', (pollWithResponses === null || pollWithResponses === void 0 ? void 0 : pollWithResponses.responses.length) || 0);
                                if (!pollWithResponses) {
                                    console.log(`🔍 DEBUG - Poll ${pollId} not found`);
                                    return;
                                }
                                let resultsData;
                                const questionType = ((_b = (_a = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _a === void 0 ? void 0 : _a.question) === null || _b === void 0 ? void 0 : _b.type) || pollWithResponses.type;
                                console.log('🔍 DEBUG - About to process poll type:', pollWithResponses.type);
                                console.log('🔍 DEBUG - About to process question type:', questionType);
                                switch (questionType) {
                                    case 'SINGLE_CHOICE':
                                    case 'MULTIPLE_CHOICE':
                                        const questionOptions = ((_d = (_c = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _c === void 0 ? void 0 : _c.question) === null || _d === void 0 ? void 0 : _d.options) || [];
                                        const optionCounts = questionOptions.map((option) => {
                                            const responses = pollWithResponses.responses.filter((r) => r.questionOptionId === option.id);
                                            return {
                                                optionId: option.id,
                                                text: option.text,
                                                count: responses.length,
                                                percentage: pollWithResponses.responses.length
                                                    ? (responses.length / pollWithResponses.responses.length) * 100
                                                    : 0,
                                            };
                                        });
                                        resultsData = {
                                            totalResponses: pollWithResponses.responses.length,
                                            options: optionCounts,
                                        };
                                        break;
                                    case 'WORD_CLOUD':
                                        console.log('🔍 DEBUG - Processing WORD_CLOUD responses:', pollWithResponses.responses.length);
                                        console.log('🔍 DEBUG - Responses data:', pollWithResponses.responses.map((r) => ({
                                            id: r.id,
                                            textResponse: r.textResponse,
                                            userId: r.userId,
                                            createdAt: r.createdAt,
                                        })));
                                        const wordCounts = {};
                                        pollWithResponses.responses.forEach((response) => {
                                            console.log('🔍 DEBUG - Processing response:', {
                                                id: response.id,
                                                textResponse: response.textResponse,
                                            });
                                            if (response.textResponse) {
                                                if (wordCounts[response.textResponse]) {
                                                    wordCounts[response.textResponse]++;
                                                }
                                                else {
                                                    wordCounts[response.textResponse] = 1;
                                                }
                                            }
                                        });
                                        console.log('🔍 DEBUG - Word counts:', wordCounts);
                                        const words = Object.entries(wordCounts).map(([text, count]) => ({
                                            text,
                                            count,
                                            weight: count,
                                        }));
                                        console.log('🔍 DEBUG - Final words array:', words);
                                        resultsData = {
                                            totalResponses: pollWithResponses.responses.length,
                                            words,
                                        };
                                        break;
                                    case 'OPEN_TEXT':
                                        resultsData = {
                                            totalResponses: pollWithResponses.responses.length,
                                            responses: pollWithResponses.responses.map((response) => {
                                                var _a;
                                                return ({
                                                    id: response.id,
                                                    text: response.textResponse,
                                                    userName: response.anonymous ? 'Anonymous' : (_a = response.user) === null || _a === void 0 ? void 0 : _a.name,
                                                    timestamp: response.createdAt,
                                                });
                                            }),
                                        };
                                        break;
                                    default:
                                        resultsData = {
                                            totalResponses: pollWithResponses.responses.length,
                                            message: `Results for ${pollWithResponses.type} not implemented yet`,
                                        };
                                }
                                const isSingleQuestion = currentPoll._count.questions === 1;
                                await prisma.poll.update({
                                    where: { id: pollId },
                                    data: {
                                        showResults: true,
                                        isLive: !isSingleQuestion,
                                        updatedAt: new Date(),
                                    },
                                });
                                socketService.endPollQuestion(pollId);
                                socketService.broadcastPollUpdate(pollId, {
                                    action: 'question-results',
                                    data: {
                                        pollId,
                                        questionId: (_f = (_e = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _e === void 0 ? void 0 : _e.question) === null || _f === void 0 ? void 0 : _f.id,
                                        question: (_h = (_g = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _g === void 0 ? void 0 : _g.question) === null || _h === void 0 ? void 0 : _h.question,
                                        type: questionType,
                                        results: resultsData,
                                        endedAt: new Date().toISOString(),
                                        questionStartedAt: questionStartTime === null || questionStartTime === void 0 ? void 0 : questionStartTime.toISOString(),
                                        isFinalQuestion: isSingleQuestion,
                                    },
                                });
                                if (isSingleQuestion) {
                                    socketService.broadcastPollUpdate(pollId, {
                                        action: 'poll-ended',
                                        data: {
                                            pollId,
                                            endedAt: new Date().toISOString(),
                                        },
                                    });
                                }
                                console.log('🔍 DEBUG - Question ended automatically after time limit');
                            }
                            catch (error) {
                                console.error('Error processing auto-end question:', error);
                            }
                        }
                        else {
                            console.log('🔍 DEBUG - Poll is no longer live. Skipping auto-end.');
                        }
                    }
                    catch (error) {
                        console.error('Error in auto-ending poll question:', error);
                    }
                }, timeLimit * 1000);
            }
        }
        else {
            console.log('❌ ERROR - Socket service not available in req.app!');
        }
        res.status(201).json({
            questionId: completeQuestion.id,
            question: completeQuestion.question,
            type: completeQuestion.type,
            options: completeQuestion.options,
            startedAt: questionStartTime.toISOString(),
            timeLimit: timeLimit || poll.timeLimit,
        });
    }
    catch (error) {
        console.error('Error adding poll question:', error);
        res.status(400).json({ message: 'Failed to add poll question', error: error.message });
    }
};
exports.addPollQuestion = addPollQuestion;
const endPollQuestion = async (req, res) => {
    var _a, _b;
    try {
        console.log('🔍 DEBUG - endPollQuestion called for poll:', req.params.pollId);
        const pollId = (0, param_parser_1.getParamString)(req.params.pollId);
        const socketService = req.app.get('socketService');
        let questionStartTime = null;
        if (socketService) {
            const activeQuestion = socketService.getActiveQuestion(pollId);
            if (activeQuestion && activeQuestion.startedAt) {
                questionStartTime = new Date(activeQuestion.startedAt);
                console.log(`🔍 DEBUG - Found question start time: ${questionStartTime.toISOString()}`);
            }
            else {
                console.log('🔍 DEBUG - No start time found for question, will count all responses');
            }
        }
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                session: {
                    select: {
                        createdById: true,
                    },
                },
                responses: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        questionOption: true,
                    },
                    ...(questionStartTime && {
                        where: {
                            createdAt: {
                                gte: questionStartTime,
                            },
                        },
                    }),
                },
                options: true,
                _count: {
                    select: {
                        questions: true,
                    },
                },
            },
        });
        console.log('🔍 DEBUG - Question start time:', questionStartTime);
        console.log('🔍 DEBUG - Filtered responses found:', (poll === null || poll === void 0 ? void 0 : poll.responses.length) || 0);
        if (!poll) {
            console.log(`🔍 DEBUG - Poll ${pollId} not found`);
            return res.status(404).json({ message: 'Poll not found' });
        }
        const hasPermission = req.user.role === 'ADMIN' ||
            (poll.session && poll.session.createdById === req.user.id) ||
            !poll.session;
        if (!hasPermission) {
            console.log(`🔍 DEBUG - User ${req.user.id} not authorized to end poll ${pollId}`);
            return res.status(403).json({ message: 'Not authorized to end this poll question' });
        }
        console.log(`🔍 DEBUG - Processing responses for poll ${pollId}, type: ${poll.type}`);
        console.log(`🔍 DEBUG - Number of responses: ${poll.responses.length}`);
        if (questionStartTime) {
            console.log(`🔍 DEBUG - Filtering responses created after: ${questionStartTime.toISOString()}`);
        }
        else {
            console.log('🔍 DEBUG - Using all responses (no start time filter)');
        }
        let resultsData;
        switch (poll.type) {
            case 'SINGLE_CHOICE':
            case 'MULTIPLE_CHOICE':
                const activeQuestion = socketService === null || socketService === void 0 ? void 0 : socketService.getActiveQuestion(pollId);
                const questionOptions = ((_b = (_a = activeQuestion === null || activeQuestion === void 0 ? void 0 : activeQuestion.data) === null || _a === void 0 ? void 0 : _a.question) === null || _b === void 0 ? void 0 : _b.options) || [];
                const optionCounts = questionOptions.map((option) => {
                    const responses = poll.responses.filter((response) => response.questionOptionId === option.id);
                    return {
                        optionId: option.id,
                        text: option.text,
                        count: responses.length,
                        percentage: poll.responses.length
                            ? (responses.length / poll.responses.length) * 100
                            : 0,
                    };
                });
                resultsData = {
                    totalResponses: poll.responses.length,
                    options: optionCounts,
                };
                break;
            case 'WORD_CLOUD':
                console.log('🔍 DEBUG - Processing WORD_CLOUD responses:', poll.responses.length);
                console.log('🔍 DEBUG - Responses data:', poll.responses.map((r) => ({
                    id: r.id,
                    textResponse: r.textResponse,
                    userId: r.userId,
                    createdAt: r.createdAt,
                })));
                const wordCounts = {};
                poll.responses.forEach((response) => {
                    console.log('🔍 DEBUG - Processing response:', {
                        id: response.id,
                        textResponse: response.textResponse,
                    });
                    if (response.textResponse) {
                        if (wordCounts[response.textResponse]) {
                            wordCounts[response.textResponse]++;
                        }
                        else {
                            wordCounts[response.textResponse] = 1;
                        }
                    }
                });
                console.log('🔍 DEBUG - Word counts:', wordCounts);
                const words = Object.entries(wordCounts).map(([text, count]) => ({
                    text,
                    count,
                    weight: count,
                }));
                console.log('🔍 DEBUG - Final words array:', words);
                resultsData = {
                    totalResponses: poll.responses.length,
                    words,
                };
                break;
            case 'OPEN_TEXT':
                resultsData = {
                    totalResponses: poll.responses.length,
                    responses: poll.responses.map((response) => ({
                        id: response.id,
                        text: response.textResponse,
                        userName: response.anonymous ? 'Anonymous' : response.user.name,
                        timestamp: response.createdAt,
                    })),
                };
                break;
            default:
                resultsData = {
                    totalResponses: poll.responses.length,
                    message: `Results for ${poll.type} not implemented yet`,
                };
        }
        console.log(`🔍 DEBUG - Updating poll ${pollId} to show results and set as not live`);
        const isSingleQuestion = poll._count.questions === 1;
        console.log(`🔍 DEBUG - Is single question poll: ${isSingleQuestion}`);
        await prisma.poll.update({
            where: { id: pollId },
            data: {
                showResults: true,
                isLive: !isSingleQuestion,
                updatedAt: new Date(),
            },
        });
        if (socketService) {
            console.log(`🔍 DEBUG - Broadcasting end of question for poll ${pollId}`);
            socketService.endPollQuestion(pollId);
            const eventData = {
                action: 'question-results',
                data: {
                    pollId,
                    question: poll.question,
                    type: poll.type,
                    results: resultsData,
                    endedAt: new Date().toISOString(),
                    questionStartedAt: questionStartTime === null || questionStartTime === void 0 ? void 0 : questionStartTime.toISOString(),
                    isFinalQuestion: isSingleQuestion,
                },
            };
            socketService.broadcastPollUpdate(pollId, eventData);
            if (isSingleQuestion) {
                socketService.broadcastPollUpdate(pollId, {
                    action: 'poll-ended',
                    data: {
                        pollId,
                        endedAt: new Date().toISOString(),
                    },
                });
            }
        }
        else {
            console.log('❌ ERROR - Socket service not available in req.app!');
        }
        return res.status(200).json({
            message: 'Poll question ended successfully',
            results: resultsData,
            endedAt: new Date().toISOString(),
            isFinalQuestion: isSingleQuestion,
        });
    }
    catch (error) {
        console.error('Error ending poll question:', error);
        return res.status(400).json({
            message: 'Failed to end poll question',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.endPollQuestion = endPollQuestion;
const createStandalonePoll = async (req, res) => {
    try {
        const validatedData = poll_validation_1.createStandalonePollSchema.parse(req.body);
        const { title, type, isLive, showResults, isPublic, maxVotes, timeLimit, question, questions, options, } = validatedData;
        let joiningCode = generateJoiningCode();
        let isCodeUnique = false;
        while (!isCodeUnique) {
            const existingPoll = await prisma.poll.findUnique({
                where: { joiningCode },
            });
            if (!existingPoll) {
                isCodeUnique = true;
            }
            else {
                joiningCode = generateJoiningCode();
            }
        }
        const poll = await prisma.poll.create({
            data: {
                title,
                question: question || '',
                type: type,
                joiningCode,
                isLive,
                showResults,
                isPublic,
                maxVotes,
                timeLimit,
                sessionId: null,
                options: options
                    ? {
                        create: options.map((opt) => ({
                            text: opt.text,
                            imageUrl: opt.imageUrl,
                            order: opt.order,
                        })),
                    }
                    : undefined,
            },
        });
        if (questions && questions.length > 0) {
            for (const q of questions) {
                await prisma.pollQuestion.create({
                    data: {
                        poll: { connect: { id: poll.id } },
                        question: q.question,
                        type: q.type,
                        order: q.order,
                        options: q.options
                            ? {
                                create: q.options.map((opt) => ({
                                    text: opt.text,
                                    imageUrl: opt.imageUrl,
                                    order: opt.order,
                                })),
                            }
                            : undefined,
                    },
                });
            }
        }
        else if (question) {
            await prisma.pollQuestion.create({
                data: {
                    poll: { connect: { id: poll.id } },
                    question: question,
                    type: type,
                    order: 0,
                    options: options
                        ? {
                            create: options.map((opt) => ({
                                text: opt.text,
                                imageUrl: opt.imageUrl,
                                order: opt.order,
                            })),
                        }
                        : undefined,
                },
            });
        }
        const completePoll = await prisma.poll.findUnique({
            where: { id: poll.id },
            include: {
                options: true,
            },
        });
        const pollQuestions = await prisma.pollQuestion.findMany({
            where: { pollId: poll.id },
            include: {
                options: true,
            },
        });
        res.status(201).json({
            ...completePoll,
            questions: pollQuestions,
            previewUrl: `/polls/${poll.id}/preview`,
            joinUrl: `/polls/join/${poll.joiningCode}`,
        });
    }
    catch (error) {
        console.error('Error creating standalone poll:', error);
        res.status(400).json({ message: 'Failed to create standalone poll', error: error.message });
    }
};
exports.createStandalonePoll = createStandalonePoll;
const getStandalonePollResults = async (req, res) => {
    try {
        const { pollId } = req.params;
        const normalizedPollId = Array.isArray(pollId) ? pollId[0] : pollId;
        const poll = await prisma.poll.findUnique({
            where: { id: normalizedPollId },
            include: {
                questions: {
                    include: {
                        options: {
                            include: {
                                responses: {
                                    include: {
                                        user: { select: { id: true, name: true } },
                                    },
                                },
                            },
                        },
                        responses: {
                            include: {
                                user: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
                options: {
                    include: {
                        responses: true,
                    },
                },
                responses: {
                    select: {
                        textResponse: true,
                        ranking: true,
                        scale: true,
                        anonymous: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        if (poll.sessionId) {
            return res
                .status(400)
                .json({ message: 'Only standalone polls are supported by this endpoint.' });
        }
        const isAdmin = req.user.role === 'ADMIN';
        if (!isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this poll results' });
        }
        if (poll.questions && poll.questions.length > 0) {
            const questionsResults = poll.questions.map((question) => {
                let results = {};
                const allResponses = [];
                question.options.forEach((option) => {
                    allResponses.push(...option.responses);
                });
                allResponses.push(...question.responses);
                switch (question.type) {
                    case 'SINGLE_CHOICE':
                    case 'MULTIPLE_CHOICE': {
                        const totalResponses = question.options.reduce((sum, opt) => sum + opt.responses.length, 0);
                        const options = question.options.map((option) => {
                            const count = option.responses.length;
                            return {
                                optionId: option.id,
                                text: option.text,
                                count,
                                percentage: totalResponses ? (count / totalResponses) * 100 : 0,
                            };
                        });
                        results = { totalResponses, options };
                        break;
                    }
                    case 'WORD_CLOUD': {
                        const wordCounts = {};
                        allResponses.forEach((response) => {
                            if (response.textResponse) {
                                wordCounts[response.textResponse] = (wordCounts[response.textResponse] || 0) + 1;
                            }
                        });
                        const words = Object.entries(wordCounts).map(([text, count]) => ({
                            text,
                            count,
                            weight: count,
                        }));
                        results = { totalResponses: allResponses.length, words };
                        break;
                    }
                    case 'OPEN_TEXT': {
                        results = {
                            totalResponses: allResponses.length,
                            responses: allResponses.map((response) => {
                                var _a;
                                return ({
                                    id: response.id,
                                    text: response.textResponse,
                                    userName: response.anonymous ? 'Anonymous' : (_a = response.user) === null || _a === void 0 ? void 0 : _a.name,
                                    timestamp: response.createdAt,
                                });
                            }),
                        };
                        break;
                    }
                    case 'RANKING': {
                        results = {
                            totalResponses: allResponses.length,
                            rankings: allResponses.map((response) => ({
                                ranking: response.ranking,
                                user: response.anonymous ? null : response.user,
                            })),
                        };
                        break;
                    }
                    case 'SCALE': {
                        results = {
                            totalResponses: allResponses.length,
                            scales: allResponses.map((response) => ({
                                scale: response.scale,
                                user: response.anonymous ? null : response.user,
                            })),
                        };
                        break;
                    }
                    default:
                        results = {
                            totalResponses: allResponses.length,
                            message: `Results for ${question.type} not implemented yet`,
                        };
                }
                return {
                    questionId: question.id,
                    question: question.question,
                    type: question.type,
                    results,
                };
            });
            res.json({
                pollId: poll.id,
                title: poll.title,
                type: poll.type,
                questions: questionsResults,
            });
        }
        else {
            let results = [];
            switch (poll.type) {
                case 'SINGLE_CHOICE':
                case 'MULTIPLE_CHOICE':
                    results = poll.options.map((option) => ({
                        text: option.text,
                        count: option.responses.length,
                    }));
                    break;
                case 'WORD_CLOUD':
                    results = poll.responses
                        .map((r) => ({ text: r.textResponse }))
                        .filter((r) => !!r.text);
                    break;
                case 'RANKING':
                    results = poll.responses.map((r) => ({
                        ranking: r.ranking,
                        user: r.anonymous ? null : r.user,
                    }));
                    break;
                case 'SCALE':
                    results = poll.responses.map((r) => ({
                        scale: r.scale,
                        user: r.anonymous ? null : r.user,
                    }));
                    break;
                default:
                    results = [];
            }
            res.json({
                pollId: poll.id,
                title: poll.title,
                type: poll.type,
                results,
            });
        }
    }
    catch (error) {
        console.error('Error getting standalone poll results:', error);
        res
            .status(400)
            .json({ message: 'Failed to get standalone poll results', error: error.message });
    }
};
exports.getStandalonePollResults = getStandalonePollResults;
const getStandalonePollQuestionResults = async (req, res) => {
    try {
        const { pollId, questionId } = req.params;
        const normalizedPollId = Array.isArray(pollId) ? pollId[0] : pollId;
        const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;
        const poll = await prisma.poll.findUnique({
            where: { id: normalizedPollId },
            include: {
                questions: {
                    where: { id: normalizedQuestionId },
                    include: {
                        options: {
                            include: {
                                responses: {
                                    include: {
                                        user: { select: { id: true, name: true } },
                                    },
                                },
                            },
                        },
                        responses: {
                            include: {
                                user: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }
        if (poll.sessionId) {
            return res
                .status(400)
                .json({ message: 'Only standalone polls are supported by this endpoint.' });
        }
        const isAdmin = req.user.role === 'ADMIN';
        if (!isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this poll results' });
        }
        const question = poll.questions[0];
        if (!question) {
            return res.status(404).json({ message: 'Question not found in this poll' });
        }
        const allResponses = [];
        question.options.forEach((option) => {
            allResponses.push(...option.responses);
        });
        allResponses.push(...question.responses);
        let results = {};
        switch (question.type) {
            case 'SINGLE_CHOICE':
            case 'MULTIPLE_CHOICE': {
                const totalResponses = question.options.reduce((sum, opt) => sum + opt.responses.length, 0);
                const options = question.options.map((option) => {
                    const count = option.responses.length;
                    return {
                        optionId: option.id,
                        text: option.text,
                        count,
                        percentage: totalResponses ? (count / totalResponses) * 100 : 0,
                    };
                });
                results = { totalResponses, options };
                break;
            }
            case 'WORD_CLOUD': {
                const wordCounts = {};
                allResponses.forEach((response) => {
                    if (response.textResponse) {
                        wordCounts[response.textResponse] = (wordCounts[response.textResponse] || 0) + 1;
                    }
                });
                const words = Object.entries(wordCounts).map(([text, count]) => ({
                    text,
                    count,
                    weight: count,
                }));
                results = { totalResponses: allResponses.length, words };
                break;
            }
            case 'OPEN_TEXT': {
                results = {
                    totalResponses: allResponses.length,
                    responses: allResponses.map((response) => {
                        var _a;
                        return ({
                            id: response.id,
                            text: response.textResponse,
                            userName: response.anonymous ? 'Anonymous' : (_a = response.user) === null || _a === void 0 ? void 0 : _a.name,
                            timestamp: response.createdAt,
                        });
                    }),
                };
                break;
            }
            case 'RANKING': {
                results = {
                    totalResponses: allResponses.length,
                    rankings: allResponses.map((response) => ({
                        ranking: response.ranking,
                        user: response.anonymous ? null : response.user,
                    })),
                };
                break;
            }
            case 'SCALE': {
                results = {
                    totalResponses: allResponses.length,
                    scales: allResponses.map((response) => ({
                        scale: response.scale,
                        user: response.anonymous ? null : response.user,
                    })),
                };
                break;
            }
            default:
                results = {
                    totalResponses: allResponses.length,
                    message: `Results for ${question.type} not implemented yet`,
                };
        }
        res.json({
            pollId: poll.id,
            questionId: question.id,
            question: question.question,
            type: question.type,
            results,
        });
    }
    catch (error) {
        console.error('Error getting standalone poll question results:', error);
        res
            .status(400)
            .json({ message: 'Failed to get standalone poll question results', error: error.message });
    }
};
exports.getStandalonePollQuestionResults = getStandalonePollQuestionResults;
//# sourceMappingURL=poll.controller.js.map