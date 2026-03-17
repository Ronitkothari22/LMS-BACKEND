import { Request, Response } from 'express';
import { PrismaClient, PollType, User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  createPollSchema,
  joinPollSchema,
  submitPollResponseSchema,
  updatePollSchema,
  quickCreatePollSchema,
  validatePollResponse,
  addPollQuestionSchema,
  createStandalonePollSchema,
} from '../validations/poll.validation';
import { getParamString } from '../utils/param-parser';

// Extend Request type to include user
interface AuthRequest extends Request {
  user: User;
}

const prisma = new PrismaClient();

export const getPolls = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, isLive } = req.query;

    // Query session-based polls
    const sessionBasedPolls: any[] = await prisma.poll.findMany({
      where: {
        ...(sessionId && { sessionId: sessionId as string }),
        ...(isLive !== undefined && { isLive: isLive === 'true' }),
        sessionId: { not: null }, // Only session-based polls
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

    // For admins, also include standalone polls
    if (req.user.role === 'ADMIN') {
      const standalonePolls: any[] = await prisma.poll.findMany({
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
  } catch (error) {
    console.error('Error getting polls:', error);
    res.status(400).json({ message: 'Failed to get polls', error: error.message });
  }
};

export const getPollById = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { pollId } = req.params;
    const normalizedPollId = Array.isArray(pollId) ? pollId[0] : (pollId as string);

    const poll: any = await prisma.poll.findUnique({
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

    // Check if user has access to this poll
    if (!poll.isPublic) {
      // For standalone polls (sessionId is null), only admins can access
      if (!poll.sessionId) {
        if (req.user.role !== 'ADMIN') {
          return res.status(403).json({ message: 'Not authorized to view this poll' });
        }
      } else {
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

    // Return the poll details without emitting any events
    res.json(poll);
  } catch (error) {
    console.error('Error getting poll:', error);
    res.status(400).json({ message: 'Failed to get poll', error: error.message });
  }
};

// Function to generate a random 6-character alphanumeric code
const generateJoiningCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Quick create a poll
export const quickCreatePoll = async (
  req: AuthRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    const validatedData = quickCreatePollSchema.parse(req.body);
    const { title, sessionId, isPublic } = validatedData;

    // Check if session exists and is active (if sessionId provided)
    let session: any = null;
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

      // Check user permissions - must be session creator, admin, or participant
      const hasPermission =
        session.createdById === req.user.id ||
        req.user.role === 'ADMIN' ||
        session.participants.length > 0;

      if (!hasPermission) {
        return res.status(403).json({ message: 'Not authorized to create polls in this session' });
      }
    } else {
      // For standalone polls, only admins can create
      if (req.user.role !== 'ADMIN') {
        return res
          .status(403)
          .json({ message: 'Admin privileges required to create standalone polls' });
      }
    }

    // Generate unique joining code
    let joiningCode = generateJoiningCode();
    let isCodeUnique = false;

    while (!isCodeUnique) {
      const existingPoll = await prisma.poll.findUnique({
        where: { joiningCode },
      });
      if (!existingPoll) {
        isCodeUnique = true;
      } else {
        joiningCode = generateJoiningCode();
      }
    }

    // Create initial poll with default settings
    const poll: any = await prisma.poll.create({
      data: {
        title,
        question: '', // Empty initially
        type: 'SINGLE_CHOICE', // Default type
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
  } catch (error) {
    console.error('Error creating quick poll:', error);
    return res.status(400).json({
      message: 'Failed to create quick poll',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const previewPoll = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { pollId } = req.params;
    const normalizedPollId = Array.isArray(pollId) ? pollId[0] : (pollId as string);

    const poll: any = await prisma.poll.findUnique({
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

    // For preview, we only send necessary information
    res.json({
      id: poll.id,
      title: poll.title,
      question: poll.question,
      type: poll.type,
      options: poll.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl,
      })),
      isLive: poll.isLive,
      showResults: poll.showResults,
      responseCount: poll._count.responses,
    });
  } catch (error) {
    console.error('Error previewing poll:', error);
    res.status(400).json({ message: 'Failed to preview poll', error: error.message });
  }
};

export const createPoll = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const validatedData = createPollSchema.parse(req.body);
    const {
      title,
      sessionId,
      type,
      isLive,
      showResults,
      isPublic,
      maxVotes,
      timeLimit,
      question, // For backward compatibility
      questions, // New field for multiple questions
      options, // For backward compatibility
    } = validatedData;

    // Check if session exists and user has permission (if sessionId provided)
    let session: any = null;
    if (sessionId) {
      session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { createdBy: true },
      });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Only session creator or admin can create polls
      if (session.createdById !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized to create polls in this session' });
      }
    } else {
      // For standalone polls (no sessionId), only admins can create
      if (req.user.role !== 'ADMIN') {
        return res
          .status(403)
          .json({ message: 'Admin privileges required to create standalone polls' });
      }
    }

    // Check if this is updating an existing poll
    let existingPoll: any = null;
    if (req.query.pollId) {
      existingPoll = await prisma.poll.findUnique({
        where: { id: req.query.pollId as string },
      });
    }

    // Generate unique joining code if not updating
    const joiningCode = existingPoll
      ? existingPoll.joiningCode
      : uuidv4().slice(0, 8).toUpperCase();

    // Create or update poll
    const poll: any = existingPoll
      ? await prisma.poll.update({
          where: { id: existingPoll.id },
          data: {
            type: type as PollType,
            isLive,
            showResults,
            isPublic,
            maxVotes,
            timeLimit,
            // For backward compatibility
            options: options
              ? {
                  deleteMany: {},
                  create: options.map((opt: any) => ({
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
            question: question || '', // Set default empty string for backward compatibility
            type: type as PollType,
            joiningCode,
            isLive,
            showResults,
            isPublic,
            maxVotes,
            timeLimit,
            sessionId: sessionId || null, // Explicitly set to null if not provided
            // For backward compatibility
            options: options
              ? {
                  create: options.map((opt: any) => ({
                    text: opt.text,
                    imageUrl: opt.imageUrl,
                    order: opt.order,
                  })),
                }
              : undefined,
          },
        });

    // Handle questions if provided
    if (questions && questions.length > 0) {
      // Add multiple questions
      for (const q of questions) {
        await (prisma as any).pollQuestion.create({
          data: {
            poll: { connect: { id: poll.id } },
            question: q.question,
            type: q.type as PollType,
            order: q.order,
            options: q.options
              ? {
                  create: q.options.map((opt: any) => ({
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
    // For backward compatibility - if a single question is provided
    else if (question) {
      await (prisma as any).pollQuestion.create({
        data: {
          poll: { connect: { id: poll.id } },
          question: question,
          type: type as PollType,
          order: 0,
          options: options
            ? {
                create: options.map((opt: any) => ({
                  text: opt.text,
                  imageUrl: opt.imageUrl,
                  order: opt.order,
                })),
              }
            : undefined,
        },
      });
    }

    // Get the complete updated poll with all questions and options
    const completePoll: any = await prisma.poll.findUnique({
      where: { id: poll.id },
      include: {
        options: true,
      },
    });

    // Fetch questions separately
    const pollQuestions = await (prisma as any).pollQuestion.findMany({
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
  } catch (error) {
    console.error('Error creating/updating poll:', error);
    res.status(400).json({ message: 'Failed to create/update poll', error: error.message });
  }
};

export const updatePoll = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { pollId } = req.params;
    const normalizedPollId = Array.isArray(pollId) ? pollId[0] : (pollId as string);
    const validatedData = updatePollSchema.parse(req.body);

    // Check if poll exists and user has permission
    const poll: any = await prisma.poll.findUnique({
      where: { id: normalizedPollId },
      include: {
        session: true,
      },
    });

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Only session creator or admin can update polls
    if (poll.session && poll.session.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this poll' });
    } else if (!poll.session && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this poll' });
    }

    const updatedPoll: any = await prisma.poll.update({
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
  } catch (error) {
    console.error('Error updating poll:', error);
    res.status(400).json({ message: 'Failed to update poll', error: error.message });
  }
};

export const deletePoll = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { pollId } = req.params;
    const normalizedPollId = Array.isArray(pollId) ? pollId[0] : (pollId as string);

    // Check if poll exists and user has permission
    const poll: any = await prisma.poll.findUnique({
      where: { id: normalizedPollId },
      include: {
        session: true,
      },
    });

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Only session creator or admin can delete polls
    if (poll.session && poll.session.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this poll' });
    } else if (!poll.session && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this poll' });
    }

    // Delete the poll and all related data
    await prisma.poll.delete({
      where: { id: normalizedPollId },
    });

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(400).json({ message: 'Failed to delete poll', error: error.message });
  }
};

// Join a poll with code
export const joinPoll = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    console.log('🔍 DEBUG - joinPoll called');
    console.log('🔍 DEBUG - User ID:', req.user.id);
    console.log('🔍 DEBUG - User Name:', req.user.name);
    console.log('🔍 DEBUG - Request body:', req.body);

    const { joiningCode } = joinPollSchema.parse(req.body);
    console.log('🔍 DEBUG - Joining code:', joiningCode);

    // Use req.user.id directly instead of userId from the request body
    const poll: any = await prisma.poll.findUnique({
      where: { joiningCode },
      include: {
        session: true,
        participants: true, // Get ALL participants, not filtered
      },
    });

    console.log('🔍 DEBUG - Poll found:', poll ? 'Yes' : 'No');
    if (poll) {
      console.log('🔍 DEBUG - Poll ID:', poll.id);
      console.log(
        '🔍 DEBUG - Current participants:',
        poll.participants.map((p: any) => ({ id: p.id, name: p.name })),
      );
    }

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if user is already a participant
    const isAlreadyParticipant = poll.participants.some(
      (participant: any) => participant.id === req.user.id,
    );
    console.log('🔍 DEBUG - Is already participant:', isAlreadyParticipant);

    if (isAlreadyParticipant) {
      console.log('🔍 DEBUG - User already joined, returning error');
      return res.status(400).json({ message: 'User has already joined this poll' });
    }

    // Check if poll is within session and public access
    if (!poll.isPublic && poll.session) {
      console.log('🔍 DEBUG - Poll is not public, checking session participation');
      const isSessionParticipant: any = await prisma.session.findFirst({
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
    // Add user to poll participants only if they are not already a participant
    const updatedPoll: any = await prisma.poll.update({
      where: { id: poll.id },
      data: {
        participants: {
          connect: { id: req.user.id }, // Only add if not already a participant
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

    // Get socket service instance
    const socketService = req.app.get('socketService');
    if (socketService) {
      console.log('🔍 DEBUG - Broadcasting poll update via socket');
      // Broadcast the updated poll data to all connected clients in the poll room
      socketService.broadcastPollUpdate(poll.id, {
        id: updatedPoll.id,
        title: updatedPoll.title,
        participantCount: updatedPoll._count.participants,
        participants: updatedPoll.participants,
      });
    } else {
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
  } catch (error) {
    console.error('🔍 DEBUG - Error in joinPoll:', error);
    return res.status(400).json({
      message: 'Failed to join poll',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const submitResponse = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    console.log('🔍 DEBUG - Submitting poll response');
    const validatedData = submitPollResponseSchema.parse(req.body);
    validatePollResponse(validatedData);
    const { pollId, questionOptionId, textResponse, ranking, scale, anonymous } = validatedData;

    // Get the socketService to check active question data
    const socketService = req.app.get('socketService');
    const activeQuestion = socketService?.getActiveQuestion(pollId);

    // Check if poll exists and is accessible
    const poll: any = await prisma.poll.findUnique({
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

    // Check if poll is live
    if (!poll.isLive) {
      return res.status(400).json({ message: 'This poll is not currently active' });
    }

    // Check if there is an active question for this poll
    if (!activeQuestion) {
      return res.status(400).json({ message: 'No active question found for this poll' });
    }

    // Check if the question's time limit has expired
    if (activeQuestion && activeQuestion.startedAt && poll.timeLimit) {
      const startTime = new Date(activeQuestion.startedAt);
      const currentTime = new Date();
      const elapsedSeconds = (currentTime.getTime() - startTime.getTime()) / 1000;

      if (elapsedSeconds > poll.timeLimit) {
        return res.status(400).json({ message: 'The time limit for this question has expired' });
      }
    }

    // Check access based on isPublic flag
    if (!poll.isPublic) {
      // For standalone polls without session, only allow if user is admin
      if (!poll.session) {
        if (req.user.role !== 'ADMIN') {
          return res
            .status(403)
            .json({ message: 'You must be an admin to submit a response to this poll' });
        }
      } else {
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

    // Check if user has already responded (if maxVotes is 1)
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

    // Create poll response with questionOptionId and questionId
    console.log('🔍 DEBUG - Creating poll response with data:', {
      pollId,
      userId: req.user.id,
      questionOptionId,
      questionId: activeQuestion?.data?.question?.id,
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
        ...(activeQuestion?.data?.question?.id && {
          question: { connect: { id: activeQuestion.data.question.id } },
        }),
        textResponse,
        ranking,
        scale,
        anonymous,
      },
    });

    console.log('🔍 DEBUG - Created response:', response);

    // Get the active question type from socket service
    const questionType = activeQuestion?.data?.question?.type || poll.type;
    console.log('🔍 DEBUG - Question type:', questionType);

    // Determine response type based on the question type and provided data
    let responseType = questionType; // Use the question type as the default response type
    let answer = questionOptionId || textResponse || ranking?.toString() || scale?.toString();

    console.log(`🔍 DEBUG - Response type: ${responseType}, Answer: ${answer}`);

    // Use Socket.IO to broadcast the response to all connected clients
    if (socketService) {
      console.log('🔍 DEBUG - Broadcasting response via WebSocket');

      // Create a WebSocket compatible response format
      const responseData = {
        action: 'new-response',
        data: {
          pollId,
          questionId: activeQuestion?.data?.question?.id,
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

      // Broadcast the response to all clients in the poll room
      socketService.broadcastPollUpdate(pollId, responseData);

      console.log('🔍 DEBUG - Response broadcast completed');
    } else {
      console.log('❌ ERROR - Socket service not available for response broadcast');
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(400).json({ message: 'Failed to submit response', error: error.message });
  }
};

export const getPollResults = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { pollId } = req.params;
    const normalizedPollId = Array.isArray(pollId) ? pollId[0] : (pollId as string);

    const poll: any = await prisma.poll.findUnique({
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

    // Check if this is a session-based poll or standalone poll
    if (poll.sessionId && poll.session) {
      // Session-based poll - use session poll logic
      // Access control: must be session participant, session creator, or admin
      const isAdmin = req.user.role === 'ADMIN';
      const isSessionCreator = poll.session.createdById === req.user.id;
      const isParticipant = poll.session.participants.some((p: any) => p.id === req.user.id);
      if (!isAdmin && !isSessionCreator && !isParticipant) {
        return res.status(403).json({ message: 'Not authorized to view this poll results' });
      }

      // Check if this is a multi-question poll or single-question poll
      if (poll.questions && poll.questions.length > 0) {
        // Multi-question poll - use the same logic as session polls
        const questionsResults = poll.questions.map((question: any) => {
          let results: any = {};

          // Collect all responses for this question from all options
          const allResponses: any[] = [];
          question.options.forEach((option: any) => {
            allResponses.push(...option.responses);
          });

          // Also collect responses that are directly linked to the question (for WORD_CLOUD, OPEN_TEXT, etc.)
          allResponses.push(...question.responses);

          switch (question.type) {
            case 'SINGLE_CHOICE':
            case 'MULTIPLE_CHOICE': {
              // For SINGLE_CHOICE and MULTIPLE_CHOICE, only count responses linked to options
              const totalResponses = question.options.reduce(
                (sum: number, opt: any) => sum + opt.responses.length,
                0,
              );
              const options = question.options.map((option: any) => {
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
              const wordCounts: Record<string, number> = {};
              allResponses.forEach((response: any) => {
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
                responses: allResponses.map((response: any) => ({
                  id: response.id,
                  text: response.textResponse,
                  userName: response.anonymous ? 'Anonymous' : response.user?.name,
                  timestamp: response.createdAt,
                })),
              };
              break;
            }
            case 'RANKING': {
              results = {
                totalResponses: allResponses.length,
                rankings: allResponses.map((response: any) => ({
                  ranking: response.ranking,
                  user: response.anonymous ? null : response.user,
                })),
              };
              break;
            }
            case 'SCALE': {
              results = {
                totalResponses: allResponses.length,
                scales: allResponses.map((response: any) => ({
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
      } else {
        // Single-question poll (backward compatibility) - use the old format
        let results: any[] = [];
        switch (poll.type) {
          case 'SINGLE_CHOICE':
          case 'MULTIPLE_CHOICE':
            results = poll.options.map((option: any) => ({
              text: option.text,
              count: option.responses.length,
            }));
            break;
          case 'WORD_CLOUD':
            results = poll.responses
              .map((r: any) => ({ text: r.textResponse }))
              .filter((r: any): r is { text: string } => !!r.text);
            break;
          case 'RANKING':
            results = poll.responses.map((r: any) => ({
              ranking: r.ranking,
              user: r.anonymous ? null : r.user,
            }));
            break;
          case 'SCALE':
            results = poll.responses.map((r: any) => ({
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
    } else {
      // Standalone poll - use standalone poll logic
      // Access control: must be admin (for standalone polls)
      const isAdmin = req.user.role === 'ADMIN';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this poll results' });
      }

      // Check if this is a multi-question poll or single-question poll
      if (poll.questions && poll.questions.length > 0) {
        // Multi-question poll - use the same logic as session polls
        const questionsResults = poll.questions.map((question: any) => {
          let results: any = {};

          // Collect all responses for this question from all options
          const allResponses: any[] = [];
          question.options.forEach((option: any) => {
            allResponses.push(...option.responses);
          });

          // Also collect responses that are directly linked to the question (for WORD_CLOUD, OPEN_TEXT, etc.)
          allResponses.push(...question.responses);

          switch (question.type) {
            case 'SINGLE_CHOICE':
            case 'MULTIPLE_CHOICE': {
              // For SINGLE_CHOICE and MULTIPLE_CHOICE, only count responses linked to options
              const totalResponses = question.options.reduce(
                (sum: number, opt: any) => sum + opt.responses.length,
                0,
              );
              const options = question.options.map((option: any) => {
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
              const wordCounts: Record<string, number> = {};
              allResponses.forEach((response: any) => {
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
                responses: allResponses.map((response: any) => ({
                  id: response.id,
                  text: response.textResponse,
                  userName: response.anonymous ? 'Anonymous' : response.user?.name,
                  timestamp: response.createdAt,
                })),
              };
              break;
            }
            case 'RANKING': {
              results = {
                totalResponses: allResponses.length,
                rankings: allResponses.map((response: any) => ({
                  ranking: response.ranking,
                  user: response.anonymous ? null : response.user,
                })),
              };
              break;
            }
            case 'SCALE': {
              results = {
                totalResponses: allResponses.length,
                scales: allResponses.map((response: any) => ({
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
      } else {
        // Single-question poll (backward compatibility) - use the old format
        let results: any[] = [];
        switch (poll.type) {
          case 'SINGLE_CHOICE':
          case 'MULTIPLE_CHOICE':
            results = poll.options.map((option: any) => ({
              text: option.text,
              count: option.responses.length,
            }));
            break;
          case 'WORD_CLOUD':
            results = poll.responses
              .map((r: any) => ({ text: r.textResponse }))
              .filter((r: any): r is { text: string } => !!r.text);
            break;
          case 'RANKING':
            results = poll.responses.map((r: any) => ({
              ranking: r.ranking,
              user: r.anonymous ? null : r.user,
            }));
            break;
          case 'SCALE':
            results = poll.responses.map((r: any) => ({
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
  } catch (error) {
    console.error('Error getting poll results:', error);
    res.status(400).json({ message: 'Failed to get poll results', error: error.message });
  }
};

export const getSessionPollResults = async (
  req: AuthRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    const { pollId } = req.params;
    const normalizedPollId = Array.isArray(pollId) ? pollId[0] : (pollId as string);

    // Fetch poll with questions, options, and responses
    const poll: any = await prisma.poll.findUnique({
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

    // Only support session-based polls
    if (!poll.sessionId || !poll.session) {
      return res
        .status(400)
        .json({ message: 'Only session-based polls are supported by this endpoint.' });
    }

    // Access control: must be session participant, session creator, or admin
    const isAdmin = req.user.role === 'ADMIN';
    const isSessionCreator = poll.session.createdById === req.user.id;
    const isParticipant = poll.session.participants.some((p: any) => p.id === req.user.id);
    if (!isAdmin && !isSessionCreator && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this poll results' });
    }

    // Aggregate results for each question
    const questionsResults = poll.questions.map((question: any) => {
      let results: any = {};

      // Collect all responses for this question from all options
      const allResponses: any[] = [];
      question.options.forEach((option: any) => {
        allResponses.push(...option.responses);
      });

      // Also collect responses that are directly linked to the question (for WORD_CLOUD, OPEN_TEXT, etc.)
      allResponses.push(...question.responses);

      // Debug logging
      console.log(`🔍 DEBUG - Question ${question.id} (${question.type}):`);
      console.log(
        `  - Options responses: ${question.options.reduce((sum: number, opt: any) => sum + opt.responses.length, 0)}`,
      );
      console.log(`  - Direct question responses: ${question.responses.length}`);
      console.log(`  - Total responses: ${allResponses.length}`);
      console.log(
        `  - Response details:`,
        allResponses.map((r: any) => ({
          id: r.id,
          textResponse: r.textResponse,
          questionOptionId: r.questionOptionId,
          questionId: r.questionId,
        })),
      );

      switch (question.type) {
        case 'SINGLE_CHOICE':
        case 'MULTIPLE_CHOICE': {
          // For SINGLE_CHOICE and MULTIPLE_CHOICE, only count responses linked to options
          const totalResponses = question.options.reduce(
            (sum: number, opt: any) => sum + opt.responses.length,
            0,
          );
          const options = question.options.map((option: any) => {
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
          const wordCounts: Record<string, number> = {};
          allResponses.forEach((response: any) => {
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
            responses: allResponses.map((response: any) => ({
              id: response.id,
              text: response.textResponse,
              userName: response.anonymous ? 'Anonymous' : response.user?.name,
              timestamp: response.createdAt,
            })),
          };
          break;
        }
        case 'RANKING': {
          results = {
            totalResponses: allResponses.length,
            rankings: allResponses.map((response: any) => ({
              ranking: response.ranking,
              user: response.anonymous ? null : response.user,
            })),
          };
          break;
        }
        case 'SCALE': {
          results = {
            totalResponses: allResponses.length,
            scales: allResponses.map((response: any) => ({
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
  } catch (error) {
    console.error('Error getting session poll results:', error);
    res.status(400).json({ message: 'Failed to get session poll results', error: error.message });
  }
};

export const getSessionPollQuestionResults = async (
  req: AuthRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    const { pollId, questionId } = req.params;
    const normalizedPollId = Array.isArray(pollId) ? pollId[0] : (pollId as string);
    const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;

    // Fetch poll with session and the specific question
    const poll: any = await prisma.poll.findUnique({
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

    // Only support session-based polls
    if (!poll.sessionId || !poll.session) {
      return res
        .status(400)
        .json({ message: 'Only session-based polls are supported by this endpoint.' });
    }

    // Access control: must be session participant, session creator, or admin
    const isAdmin = req.user.role === 'ADMIN';
    const isSessionCreator = poll.session.createdById === req.user.id;
    const isParticipant = poll.session.participants.some((p: any) => p.id === req.user.id);
    if (!isAdmin && !isSessionCreator && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this poll results' });
    }

    const question = poll.questions[0];
    if (!question) {
      return res.status(404).json({ message: 'Question not found in this poll' });
    }

    // Collect all responses for this question from all options
    const allResponses: any[] = [];
    question.options.forEach((option: any) => {
      allResponses.push(...option.responses);
    });

    // Also collect responses that are directly linked to the question (for WORD_CLOUD, OPEN_TEXT, etc.)
    allResponses.push(...question.responses);

    let results: any = {};
    switch (question.type) {
      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE': {
        // For SINGLE_CHOICE and MULTIPLE_CHOICE, only count responses linked to options
        const totalResponses = question.options.reduce(
          (sum: number, opt: any) => sum + opt.responses.length,
          0,
        );
        const options = question.options.map((option: any) => {
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
        const wordCounts: Record<string, number> = {};
        allResponses.forEach((response: any) => {
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
          responses: allResponses.map((response: any) => ({
            id: response.id,
            text: response.textResponse,
            userName: response.anonymous ? 'Anonymous' : response.user?.name,
            timestamp: response.createdAt,
          })),
        };
        break;
      }
      case 'RANKING': {
        results = {
          totalResponses: allResponses.length,
          rankings: allResponses.map((response: any) => ({
            ranking: response.ranking,
            user: response.anonymous ? null : response.user,
          })),
        };
        break;
      }
      case 'SCALE': {
        results = {
          totalResponses: allResponses.length,
          scales: allResponses.map((response: any) => ({
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
  } catch (error) {
    console.error('Error getting session poll question results:', error);
    res
      .status(400)
      .json({ message: 'Failed to get session poll question results', error: error.message });
  }
};

// Add a question to an existing poll
export const addPollQuestion = async (
  req: AuthRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    const validatedData = addPollQuestionSchema.parse(req.body);
    const { pollId, question, type, order, timeLimit, options } = validatedData;

    // Find the poll
    const poll: any = await prisma.poll.findUnique({
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

    // Check user permissions - must be session creator, admin, or standalone poll creator
    const hasPermission =
      req.user.role === 'ADMIN' ||
      (poll.session && poll.session.createdById === req.user.id) ||
      !poll.session; // For standalone polls, allow any admin

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to add questions to this poll' });
    }

    // Update the poll status
    const questionStartTime = new Date();
    await prisma.poll.update({
      where: { id: pollId },
      data: {
        isLive: true,
        ...(timeLimit && { timeLimit }),
      },
    });

    // Create a new poll question
    const newQuestion = await (prisma as any).pollQuestion.create({
      data: {
        poll: { connect: { id: pollId } },
        question: question,
        type: type as PollType,
        order: order || 0,
        isActive: true, // Set as active question
      },
    });

    // If this is a poll type that requires options (like multiple choice), add them
    if (options && ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RANKING'].includes(type)) {
      // Create question options
      await Promise.all(
        options.map(async option => {
          return (prisma as any).pollQuestionOption.create({
            data: {
              text: option.text,
              imageUrl: option.imageUrl,
              order: option.order,
              question: { connect: { id: newQuestion.id } },
            },
          });
        }),
      );
    }

    // Get the updated question with options
    const completeQuestion = await (prisma as any).pollQuestion.findUnique({
      where: { id: newQuestion.id },
      include: {
        options: true,
      },
    });

    if (!completeQuestion) {
      return res.status(500).json({ message: 'Failed to retrieve created question' });
    }

    // Use Socket.IO to broadcast the new question to all connected clients
    const socketService = req.app.get('socketService');
    console.log('🔍 DEBUG - Adding poll question - Socket service exists:', !!socketService);

    if (socketService) {
      console.log('🔍 DEBUG - Broadcasting new question for poll:', pollId);
      console.log('🔍 DEBUG - Poll room size:', socketService.getPollParticipantCount(pollId));

      // Track the question start time
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
            options: completeQuestion.options.map((opt: any) => ({
              id: opt.id,
              text: opt.text,
              imageUrl: opt.imageUrl,
              order: opt.order,
            })),
          },
          startedAt: questionStartTime.toISOString(), // Include the start time
        },
      };

      console.log('🔍 DEBUG - Event data being sent:', JSON.stringify(eventData));

      // Broadcast to all sockets in the poll room
      socketService.broadcastPollUpdate(pollId, eventData);

      // Set a timer to automatically end the question after timeLimit (if specified)
      if (timeLimit && timeLimit > 0) {
        console.log(`🔍 DEBUG - Setting timer to end question after ${timeLimit} seconds`);

        // Set timer to end the question automatically when time is up
        setTimeout(async () => {
          try {
            console.log(
              `🔍 DEBUG - Timer expired for poll ${pollId}. Ending question automatically.`,
            );

            // Check if the poll still exists and is live
            const currentPoll: any = await prisma.poll.findUnique({
              where: { id: pollId },
              include: {
                _count: {
                  select: {
                    questions: true,
                  },
                },
              },
            });

            // Get the active question to check if it's still this one
            const activeQuestion = socketService.getActiveQuestion(pollId);

            // Log for debugging
            console.log('🔍 DEBUG - Current poll:', currentPoll);
            console.log('🔍 DEBUG - Active question:', activeQuestion);

            if (currentPoll?.isLive) {
              console.log('🔍 DEBUG - Poll is still live, proceeding with auto-end');

              // Process responses directly without using endPollQuestion
              try {
                // Get question start time
                let questionStartTime: Date | null = null;
                if (activeQuestion && activeQuestion.startedAt) {
                  questionStartTime = new Date(activeQuestion.startedAt);
                }

                // Find the poll with responses
                const pollWithResponses: any = await prisma.poll.findUnique({
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
                      // Filter responses to only include those from the current question session
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
                console.log(
                  '🔍 DEBUG - Filtered responses found:',
                  pollWithResponses?.responses.length || 0,
                );

                if (!pollWithResponses) {
                  console.log(`🔍 DEBUG - Poll ${pollId} not found`);
                  return;
                }

                // Process the responses based on the poll type
                let resultsData;

                // Get the actual question type from the active question
                const questionType = activeQuestion?.data?.question?.type || pollWithResponses.type;
                console.log('🔍 DEBUG - About to process poll type:', pollWithResponses.type);
                console.log('🔍 DEBUG - About to process question type:', questionType);

                switch (questionType) {
                  case 'SINGLE_CHOICE':
                  case 'MULTIPLE_CHOICE':
                    // Get the question options from active question
                    const questionOptions = activeQuestion?.data?.question?.options || [];

                    // Count responses for each option
                    const optionCounts = questionOptions.map(
                      (option: { id: string; text: string }) => {
                        const responses = pollWithResponses.responses.filter(
                          (r: any) => r.questionOptionId === option.id,
                        );
                        return {
                          optionId: option.id,
                          text: option.text,
                          count: responses.length,
                          percentage: pollWithResponses.responses.length
                            ? (responses.length / pollWithResponses.responses.length) * 100
                            : 0,
                        };
                      },
                    );

                    resultsData = {
                      totalResponses: pollWithResponses.responses.length,
                      options: optionCounts,
                    };
                    break;

                  case 'WORD_CLOUD':
                    // Aggregate text responses for word cloud
                    console.log(
                      '🔍 DEBUG - Processing WORD_CLOUD responses:',
                      pollWithResponses.responses.length,
                    );
                    console.log(
                      '🔍 DEBUG - Responses data:',
                      pollWithResponses.responses.map((r: any) => ({
                        id: r.id,
                        textResponse: r.textResponse,
                        userId: r.userId,
                        createdAt: r.createdAt,
                      })),
                    );

                    const wordCounts: Record<string, number> = {};
                    pollWithResponses.responses.forEach((response: any) => {
                      console.log('🔍 DEBUG - Processing response:', {
                        id: response.id,
                        textResponse: response.textResponse,
                      });
                      if (response.textResponse) {
                        if (wordCounts[response.textResponse]) {
                          wordCounts[response.textResponse]++;
                        } else {
                          wordCounts[response.textResponse] = 1;
                        }
                      }
                    });

                    console.log('🔍 DEBUG - Word counts:', wordCounts);

                    // Convert to array
                    const words = Object.entries(wordCounts).map(([text, count]) => ({
                      text,
                      count,
                      weight: count, // Weight for visualization
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
                      responses: pollWithResponses.responses.map((response: any) => ({
                        id: response.id,
                        text: response.textResponse,
                        userName: response.anonymous ? 'Anonymous' : response.user?.name,
                        timestamp: response.createdAt,
                      })),
                    };
                    break;

                  default:
                    resultsData = {
                      totalResponses: pollWithResponses.responses.length,
                      message: `Results for ${pollWithResponses.type} not implemented yet`,
                    };
                }

                // Check if this is a single-question poll
                const isSingleQuestion = currentPoll._count.questions === 1;

                // Update the poll to show results and set live status
                await prisma.poll.update({
                  where: { id: pollId },
                  data: {
                    showResults: true,
                    isLive: !isSingleQuestion,
                    updatedAt: new Date(),
                  },
                });

                // End the active question
                socketService.endPollQuestion(pollId);

                // Broadcast results
                socketService.broadcastPollUpdate(pollId, {
                  action: 'question-results',
                  data: {
                    pollId,
                    questionId: activeQuestion?.data?.question?.id,
                    question: activeQuestion?.data?.question?.question,
                    type: questionType,
                    results: resultsData,
                    endedAt: new Date().toISOString(),
                    questionStartedAt: questionStartTime?.toISOString(),
                    isFinalQuestion: isSingleQuestion,
                  },
                });

                // If this is the final question, send a poll-ended event
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
              } catch (error) {
                console.error('Error processing auto-end question:', error);
              }
            } else {
              console.log('🔍 DEBUG - Poll is no longer live. Skipping auto-end.');
            }
          } catch (error) {
            console.error('Error in auto-ending poll question:', error);
          }
        }, timeLimit * 1000); // Convert seconds to milliseconds
      }
    } else {
      console.log('❌ ERROR - Socket service not available in req.app!');
    }

    // Return the new question details
    res.status(201).json({
      questionId: completeQuestion.id,
      question: completeQuestion.question,
      type: completeQuestion.type,
      options: completeQuestion.options,
      startedAt: questionStartTime.toISOString(),
      timeLimit: timeLimit || poll.timeLimit,
    });
  } catch (error) {
    console.error('Error adding poll question:', error);
    res.status(400).json({ message: 'Failed to add poll question', error: error.message });
  }
};

// End an active poll question
export const endPollQuestion = async (
  req: AuthRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    console.log('🔍 DEBUG - endPollQuestion called for poll:', req.params.pollId);
    const pollId = getParamString(req.params.pollId);

    // Get the socketService to check for active question data
    const socketService = req.app.get('socketService');

    // Get the question start time from the active questions map if available
    let questionStartTime: Date | null = null;
    if (socketService) {
      const activeQuestion = socketService.getActiveQuestion(pollId);
      if (activeQuestion && activeQuestion.startedAt) {
        questionStartTime = new Date(activeQuestion.startedAt);
        console.log(`🔍 DEBUG - Found question start time: ${questionStartTime.toISOString()}`);
      } else {
        console.log('🔍 DEBUG - No start time found for question, will count all responses');
      }
    }

    // Find the poll with questions count
    const poll: any = await prisma.poll.findUnique({
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
          // Filter responses to only include those from the current question session
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
    console.log('🔍 DEBUG - Filtered responses found:', poll?.responses.length || 0);

    if (!poll) {
      console.log(`🔍 DEBUG - Poll ${pollId} not found`);
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check user permissions - must be session creator, admin, or standalone poll creator
    const hasPermission =
      req.user.role === 'ADMIN' ||
      (poll.session && poll.session.createdById === req.user.id) ||
      !poll.session; // For standalone polls, allow any admin

    if (!hasPermission) {
      console.log(`🔍 DEBUG - User ${req.user.id} not authorized to end poll ${pollId}`);
      return res.status(403).json({ message: 'Not authorized to end this poll question' });
    }

    console.log(`🔍 DEBUG - Processing responses for poll ${pollId}, type: ${poll.type}`);
    console.log(`🔍 DEBUG - Number of responses: ${poll.responses.length}`);

    if (questionStartTime) {
      console.log(
        `🔍 DEBUG - Filtering responses created after: ${questionStartTime.toISOString()}`,
      );
    } else {
      console.log('🔍 DEBUG - Using all responses (no start time filter)');
    }

    // Process the responses based on the poll type
    let resultsData;

    switch (poll.type) {
      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE':
        // Get the active question to get its options
        const activeQuestion = socketService?.getActiveQuestion(pollId);
        const questionOptions = activeQuestion?.data?.question?.options || [];

        // Count responses for each option
        const optionCounts = questionOptions.map((option: { id: string; text: string }) => {
          const responses = poll.responses.filter(
            (response: any) => response.questionOptionId === option.id,
          );
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
        // Aggregate text responses for word cloud
        console.log('🔍 DEBUG - Processing WORD_CLOUD responses:', poll.responses.length);
        console.log(
          '🔍 DEBUG - Responses data:',
          poll.responses.map((r: any) => ({
            id: r.id,
            textResponse: r.textResponse,
            userId: r.userId,
            createdAt: r.createdAt,
          })),
        );

        const wordCounts: Record<string, number> = {};
        poll.responses.forEach((response: any) => {
          console.log('🔍 DEBUG - Processing response:', {
            id: response.id,
            textResponse: response.textResponse,
          });
          if (response.textResponse) {
            if (wordCounts[response.textResponse]) {
              wordCounts[response.textResponse]++;
            } else {
              wordCounts[response.textResponse] = 1;
            }
          }
        });

        console.log('🔍 DEBUG - Word counts:', wordCounts);

        // Convert to array
        const words = Object.entries(wordCounts).map(([text, count]) => ({
          text,
          count,
          weight: count, // Weight for visualization
        }));

        console.log('🔍 DEBUG - Final words array:', words);

        resultsData = {
          totalResponses: poll.responses.length,
          words,
        };
        break;

      case 'OPEN_TEXT':
        // Just return all text responses
        resultsData = {
          totalResponses: poll.responses.length,
          responses: poll.responses.map((response: any) => ({
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

    // Check if this is a single-question poll
    const isSingleQuestion = poll._count.questions === 1;
    console.log(`🔍 DEBUG - Is single question poll: ${isSingleQuestion}`);

    // Update the poll to show results and set live status based on question count
    await prisma.poll.update({
      where: { id: pollId },
      data: {
        showResults: true,
        isLive: !isSingleQuestion, // Only set to false if it's a single-question poll
        updatedAt: new Date(), // Update the timestamp
      },
    });

    if (socketService) {
      console.log(`🔍 DEBUG - Broadcasting end of question for poll ${pollId}`);

      // First, send the question-ended event
      socketService.endPollQuestion(pollId);

      // Then broadcast the results
      const eventData = {
        action: 'question-results',
        data: {
          pollId,
          question: poll.question,
          type: poll.type,
          results: resultsData,
          endedAt: new Date().toISOString(),
          questionStartedAt: questionStartTime?.toISOString(),
          isFinalQuestion: isSingleQuestion,
        },
      };

      // Broadcast both events
      socketService.broadcastPollUpdate(pollId, eventData);

      // If this is the final question, send a poll-ended event
      if (isSingleQuestion) {
        socketService.broadcastPollUpdate(pollId, {
          action: 'poll-ended',
          data: {
            pollId,
            endedAt: new Date().toISOString(),
          },
        });
      }
    } else {
      console.log('❌ ERROR - Socket service not available in req.app!');
    }

    return res.status(200).json({
      message: 'Poll question ended successfully',
      results: resultsData,
      endedAt: new Date().toISOString(),
      isFinalQuestion: isSingleQuestion,
    });
  } catch (error) {
    console.error('Error ending poll question:', error);
    return res.status(400).json({
      message: 'Failed to end poll question',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create a standalone poll without requiring a session
export const createStandalonePoll = async (
  req: AuthRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    const validatedData = createStandalonePollSchema.parse(req.body);
    const {
      title,
      type,
      isLive,
      showResults,
      isPublic,
      maxVotes,
      timeLimit,
      question, // For backward compatibility
      questions, // New field for multiple questions
      options, // For backward compatibility
    } = validatedData;

    // Generate unique joining code
    let joiningCode = generateJoiningCode();
    let isCodeUnique = false;

    while (!isCodeUnique) {
      const existingPoll = await prisma.poll.findUnique({
        where: { joiningCode },
      });
      if (!existingPoll) {
        isCodeUnique = true;
      } else {
        joiningCode = generateJoiningCode();
      }
    }

    // Create poll without session
    const poll: any = await prisma.poll.create({
      data: {
        title,
        question: question || '', // Set default empty string for backward compatibility
        type: type as PollType,
        joiningCode,
        isLive,
        showResults,
        isPublic,
        maxVotes,
        timeLimit,
        // No session connection for standalone polls
        sessionId: null,
        // For backward compatibility
        options: options
          ? {
              create: options.map((opt: any) => ({
                text: opt.text,
                imageUrl: opt.imageUrl,
                order: opt.order,
              })),
            }
          : undefined,
      },
    });

    // Handle questions if provided
    if (questions && questions.length > 0) {
      // Add multiple questions
      for (const q of questions) {
        await (prisma as any).pollQuestion.create({
          data: {
            poll: { connect: { id: poll.id } },
            question: q.question,
            type: q.type as PollType,
            order: q.order,
            options: q.options
              ? {
                  create: q.options.map((opt: any) => ({
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
    // For backward compatibility - if a single question is provided
    else if (question) {
      await (prisma as any).pollQuestion.create({
        data: {
          poll: { connect: { id: poll.id } },
          question: question,
          type: type as PollType,
          order: 0,
          options: options
            ? {
                create: options.map((opt: any) => ({
                  text: opt.text,
                  imageUrl: opt.imageUrl,
                  order: opt.order,
                })),
              }
            : undefined,
        },
      });
    }

    // Get the complete created poll with all questions and options
    const completePoll: any = await prisma.poll.findUnique({
      where: { id: poll.id },
      include: {
        options: true,
      },
    });

    // Fetch questions separately
    const pollQuestions = await (prisma as any).pollQuestion.findMany({
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
  } catch (error) {
    console.error('Error creating standalone poll:', error);
    res.status(400).json({ message: 'Failed to create standalone poll', error: error.message });
  }
};

export const getStandalonePollResults = async (
  req: AuthRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    const { pollId } = req.params;
    const normalizedPollId = Array.isArray(pollId) ? pollId[0] : (pollId as string);

    // Fetch poll with questions, options, and responses
    const poll: any = await prisma.poll.findUnique({
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
        // For backward compatibility with old polls that don't have questions
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

    // Only support standalone polls (no session)
    if (poll.sessionId) {
      return res
        .status(400)
        .json({ message: 'Only standalone polls are supported by this endpoint.' });
    }

    // Access control: must be admin (for standalone polls)
    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this poll results' });
    }

    // Check if this is a multi-question poll or single-question poll
    if (poll.questions && poll.questions.length > 0) {
      // Multi-question poll - use the same logic as session polls
      const questionsResults = poll.questions.map((question: any) => {
        let results: any = {};

        // Collect all responses for this question from all options
        const allResponses: any[] = [];
        question.options.forEach((option: any) => {
          allResponses.push(...option.responses);
        });

        // Also collect responses that are directly linked to the question (for WORD_CLOUD, OPEN_TEXT, etc.)
        allResponses.push(...question.responses);

        switch (question.type) {
          case 'SINGLE_CHOICE':
          case 'MULTIPLE_CHOICE': {
            // For SINGLE_CHOICE and MULTIPLE_CHOICE, only count responses linked to options
            const totalResponses = question.options.reduce(
              (sum: number, opt: any) => sum + opt.responses.length,
              0,
            );
            const options = question.options.map((option: any) => {
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
            const wordCounts: Record<string, number> = {};
            allResponses.forEach((response: any) => {
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
              responses: allResponses.map((response: any) => ({
                id: response.id,
                text: response.textResponse,
                userName: response.anonymous ? 'Anonymous' : response.user?.name,
                timestamp: response.createdAt,
              })),
            };
            break;
          }
          case 'RANKING': {
            results = {
              totalResponses: allResponses.length,
              rankings: allResponses.map((response: any) => ({
                ranking: response.ranking,
                user: response.anonymous ? null : response.user,
              })),
            };
            break;
          }
          case 'SCALE': {
            results = {
              totalResponses: allResponses.length,
              scales: allResponses.map((response: any) => ({
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
    } else {
      // Single-question poll (backward compatibility) - use the old format
      let results: any[] = [];
      switch (poll.type) {
        case 'SINGLE_CHOICE':
        case 'MULTIPLE_CHOICE':
          results = poll.options.map((option: any) => ({
            text: option.text,
            count: option.responses.length,
          }));
          break;
        case 'WORD_CLOUD':
          results = poll.responses
            .map((r: any) => ({ text: r.textResponse }))
            .filter((r: any) => !!r.text);
          break;
        case 'RANKING':
          results = poll.responses.map((r: any) => ({
            ranking: r.ranking,
            user: r.anonymous ? null : r.user,
          }));
          break;
        case 'SCALE':
          results = poll.responses.map((r: any) => ({
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
  } catch (error) {
    console.error('Error getting standalone poll results:', error);
    res
      .status(400)
      .json({ message: 'Failed to get standalone poll results', error: error.message });
  }
};

export const getStandalonePollQuestionResults = async (
  req: AuthRequest,
  res: Response,
): Promise<Response | void> => {
  try {
    const { pollId, questionId } = req.params;
    const normalizedPollId = Array.isArray(pollId) ? pollId[0] : (pollId as string);
    const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;

    // Fetch poll with the specific question
    const poll: any = await prisma.poll.findUnique({
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

    // Only support standalone polls (no session)
    if (poll.sessionId) {
      return res
        .status(400)
        .json({ message: 'Only standalone polls are supported by this endpoint.' });
    }

    // Access control: must be admin (for standalone polls)
    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this poll results' });
    }

    const question = poll.questions[0];
    if (!question) {
      return res.status(404).json({ message: 'Question not found in this poll' });
    }

    // Collect all responses for this question from all options
    const allResponses: any[] = [];
    question.options.forEach((option: any) => {
      allResponses.push(...option.responses);
    });

    // Also collect responses that are directly linked to the question (for WORD_CLOUD, OPEN_TEXT, etc.)
    allResponses.push(...question.responses);

    let results: any = {};
    switch (question.type) {
      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE': {
        // For SINGLE_CHOICE and MULTIPLE_CHOICE, only count responses linked to options
        const totalResponses = question.options.reduce(
          (sum: number, opt: any) => sum + opt.responses.length,
          0,
        );
        const options = question.options.map((option: any) => {
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
        const wordCounts: Record<string, number> = {};
        allResponses.forEach((response: any) => {
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
          responses: allResponses.map((response: any) => ({
            id: response.id,
            text: response.textResponse,
            userName: response.anonymous ? 'Anonymous' : response.user?.name,
            timestamp: response.createdAt,
          })),
        };
        break;
      }
      case 'RANKING': {
        results = {
          totalResponses: allResponses.length,
          rankings: allResponses.map((response: any) => ({
            ranking: response.ranking,
            user: response.anonymous ? null : response.user,
          })),
        };
        break;
      }
      case 'SCALE': {
        results = {
          totalResponses: allResponses.length,
          scales: allResponses.map((response: any) => ({
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
  } catch (error) {
    console.error('Error getting standalone poll question results:', error);
    res
      .status(400)
      .json({ message: 'Failed to get standalone poll question results', error: error.message });
  }
};
