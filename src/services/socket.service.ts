import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { User } from '@prisma/client';
import { verifyToken } from '../utils/jwt.utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  user?: User;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string | null;
}

export class SocketService {
  private io: SocketServer;
  private pollRooms: Map<string, Set<string>> = new Map(); // pollId -> Set of socketIds
  private activeQuestions: Map<string, any> = new Map(); // pollId -> active question data
  private pollParticipants: Map<string, Map<string, Participant>> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      allowEIO3: true,
      maxHttpBufferSize: 1e8, // 100 MB
      pingTimeout: 60000,
      transports: ['websocket', 'polling'],
      allowUpgrades: true,
      // Enable parsing of query parameters
      connectTimeout: 45000, // increased timeout for slow connections
    });

    console.log('Socket.IO server initialized');
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: Socket, next) => {
      try {
        let token = null;

        console.log('Socket handshake query:', socket.handshake.query);

        // Format 1: Check for token in URL query parameters as 'token'
        if (socket.handshake.query && socket.handshake.query.token) {
          token = socket.handshake.query.token as string;
          console.log('Found token in query.token');
        }

        // Format 2: Check for token in URL query parameters as 'authorization'
        if (!token && socket.handshake.query && socket.handshake.query.authorization) {
          const authParam = socket.handshake.query.authorization as string;
          token = authParam.startsWith('Bearer ') ? authParam.substring(7) : authParam;
          console.log('Found token in query.authorization');
        }

        // Fallback to authorization header
        if (!token && socket.handshake.headers.authorization) {
          const authHeader = socket.handshake.headers.authorization;
          token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
          console.log('Found token in headers.authorization');
        }

        // Last fallback to auth object
        if (!token && socket.handshake.auth && socket.handshake.auth.token) {
          token = socket.handshake.auth.token;
          console.log('Found token in auth.token');
        }

        if (!token) {
          console.log('No token found in connection attempt');
          return next(new Error('Authentication token required'));
        }

        console.log('Verifying token');
        const user = await verifyToken(token);
        if (!user) {
          console.log('Invalid token');
          return next(new Error('Invalid token'));
        }

        console.log('User authenticated:', user.name || user.email);
        (socket as AuthenticatedSocket).user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle direct events
      socket.on('join-poll', (pollId: string) => {
        console.log('🔸 DEBUG - Received join-poll event:', pollId);
        console.log('🔸 DEBUG - From socket:', socket.id);
        console.log('🔸 DEBUG - User:', (socket as AuthenticatedSocket).user?.name || 'Unknown');

        this.handleJoinPoll(socket, pollId);

        // If there's an active question for this poll, send it to the newly joined user
        const activeQuestion = this.activeQuestions.get(pollId);
        if (activeQuestion) {
          console.log('🔸 DEBUG - Sending active question to new participant:', socket.id);
          socket.emit('active-question', activeQuestion);
        } else {
          console.log('🔸 DEBUG - No active question found for poll:', pollId);
        }
      });

      socket.on('leave-poll', (pollId: string) => {
        console.log('Received leave-poll event:', pollId);
        this.handleLeavePoll(socket, pollId);
      });

      // Handle poll responses
      socket.on('poll-response', (response: any) => {
        console.log('Received poll response:', response);
        this.handlePollResponse(socket, response);
      });

      // Handle message event for JSON format
      socket.on('message', (message: any) => {
        console.log('Received message:', message);
        try {
          const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;

          if (parsedMessage.event === 'join-poll' && parsedMessage.data) {
            this.handleJoinPoll(socket, parsedMessage.data);
          } else if (parsedMessage.event === 'leave-poll' && parsedMessage.data) {
            this.handleLeavePoll(socket, parsedMessage.data);
          } else if (parsedMessage.event === 'poll-response' && parsedMessage.data) {
            this.handlePollResponse(socket, parsedMessage.data);
          } else {
            console.log('Unknown event or invalid format:', parsedMessage);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      // Debug: Log all events
      socket.onAny((event, ...args) => {
        console.log('Debug - Received event:', event, 'with args:', args);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });
  }

  private async getPollParticipants(pollId: string): Promise<Participant[]> {
    try {
      // Fetch actual participants from database who joined via REST API
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

      const participants: Participant[] = [];

      // Add database participants (users who joined via REST API)
      if (dbParticipants?.participants) {
        for (const dbParticipant of dbParticipants.participants) {
          participants.push({
            id: dbParticipant.id,
            name: dbParticipant.name,
            email: dbParticipant.email,
            profilePhoto: dbParticipant.profilePhoto,
          });
        }
      }

      // Add socket participants who might not be in database yet
      const socketParticipants = this.pollParticipants.get(pollId);
      if (socketParticipants) {
        for (const socketParticipant of socketParticipants.values()) {
          // Only add if not already in database participants
          const alreadyExists = participants.some(p => p.id === socketParticipant.id);
          if (!alreadyExists) {
            participants.push(socketParticipant);
          }
        }
      }

      return participants;
    } catch (error) {
      console.error('Error fetching poll participants:', error);
      // Fallback to socket participants only
      const socketParticipants = this.pollParticipants.get(pollId);
      if (!socketParticipants) return [];
      return Array.from(socketParticipants.values());
    }
  }

  private async emitParticipantUpdates(socket: Socket, pollId: string) {
    const participantCount = this.pollRooms.get(pollId)?.size || 0;
    const participants = await this.getPollParticipants(pollId);

    // Emit to the specific socket
    socket.emit('participant-count-updated', {
      pollId,
      count: participantCount,
    });

    socket.emit('participant-list-updated', {
      pollId,
      participants,
    });

    // Broadcast to all other participants in the room
    socket.broadcast.to(`poll:${pollId}`).emit('participant-count-updated', {
      pollId,
      count: participantCount,
    });

    socket.broadcast.to(`poll:${pollId}`).emit('participant-list-updated', {
      pollId,
      participants,
    });
  }

  private handleJoinPoll(socket: Socket, pollId: string) {
    console.log(`Socket ${socket.id} joining poll ${pollId}`);
    const roomName = `poll:${pollId}`;

    // Join the socket to the room
    socket.join(roomName);

    // Track socket in poll room
    if (!this.pollRooms.has(pollId)) {
      this.pollRooms.set(pollId, new Set());
    }
    this.pollRooms.get(pollId)?.add(socket.id);

    // Track participant information
    const user = (socket as AuthenticatedSocket).user;
    if (user) {
      if (!this.pollParticipants.has(pollId)) {
        this.pollParticipants.set(pollId, new Map());
      }
      this.pollParticipants.get(pollId)?.set(socket.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
      });
    }

    // Emit participant updates
    this.emitParticipantUpdates(socket, pollId);

    // Get current participants count
    const participantCount = this.pollRooms.get(pollId)?.size || 0;

    // Create update message with user info
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

    // Send message in multiple ways to ensure delivery
    socket.emit('message', updateMessage);
    socket.broadcast.to(roomName).emit('message', updateMessage);
    this.io.to(roomName).emit('poll-update', updateMessage);

    // Confirm join to the sender with user info
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

    // If there's an active question, send it to the new participant
    const activeQuestion = this.activeQuestions.get(pollId);
    if (activeQuestion) {
      console.log('🔸 DEBUG - Sending active question to new participant:', socket.id);
      socket.emit('active-question', activeQuestion);
    }

    console.log(`Poll ${pollId} now has ${participantCount} participants`);
  }

  private handleLeavePoll(socket: Socket, pollId: string) {
    console.log(`Socket ${socket.id} leaving poll ${pollId}`);
    const roomName = `poll:${pollId}`;

    socket.leave(roomName);

    // Remove socket from poll room
    this.pollRooms.get(pollId)?.delete(socket.id);
    if (this.pollRooms.get(pollId)?.size === 0) {
      this.pollRooms.delete(pollId);
    }

    // Remove participant information
    this.pollParticipants.get(pollId)?.delete(socket.id);
    if (this.pollParticipants.get(pollId)?.size === 0) {
      this.pollParticipants.delete(pollId);
    }

    // Emit participant updates
    this.emitParticipantUpdates(socket, pollId);

    // Get updated count
    const participantCount = this.pollRooms.get(pollId)?.size || 0;

    // Create update message
    const updateMessage = {
      type: 'participant-count-updated',
      data: {
        pollId,
        count: participantCount,
        leftSocketId: socket.id,
      },
    };

    // Send message in multiple ways to ensure delivery
    socket.emit('message', {
      type: 'left-poll',
      data: {
        pollId,
        count: participantCount,
      },
    });

    // Notify remaining participants
    socket.broadcast.to(roomName).emit('message', updateMessage);

    console.log(`Poll ${pollId} now has ${participantCount} participants`);
  }

  public handlePollResponse(socket: AuthenticatedSocket, response: any) {
    const { pollId, answer, type } = response;
    if (!pollId || !answer) {
      return;
    }

    const roomName = `poll:${pollId}`;

    // Prepare response data based on poll type
    let responseData = {
      type: 'new-response',
      data: {
        pollId,
        userId: socket.user?.id,
        userName: socket.user?.name,
        answer,
        responseType: type,
        timestamp: new Date().toISOString(),
      },
    };

    // Broadcast the response to all participants in the poll
    this.io.to(roomName).emit('poll-update', responseData);

    // Special handling for word cloud responses
    if (type === 'WORD_CLOUD') {
      // Send individual words to all participants
      this.io.to(roomName).emit('word-cloud-update', {
        type: 'word-cloud-update',
        data: {
          pollId,
          word: answer,
          userId: socket.user?.id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  private handleDisconnect(socket: Socket) {
    // Find and remove socket from all poll rooms
    this.pollRooms.forEach((sockets, pollId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.pollRooms.delete(pollId);
        }

        // Remove participant information
        this.pollParticipants.get(pollId)?.delete(socket.id);
        if (this.pollParticipants.get(pollId)?.size === 0) {
          this.pollParticipants.delete(pollId);
        }

        // Emit participant updates
        this.emitParticipantUpdates(socket, pollId);

        // Notify remaining participants
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

  // Method to get participant count for a poll
  public getPollParticipantCount(pollId: string): number {
    return this.pollRooms.get(pollId)?.size || 0;
  }

  // Method to broadcast poll updates
  public broadcastPollUpdate(pollId: string, data: any) {
    console.log(`🔹 DEBUG - Socket: Broadcasting update for poll ${pollId}`);
    console.log(
      `🔹 DEBUG - Socket: Room exists: ${this.io.sockets.adapter.rooms.has(`poll:${pollId}`)}`,
    );
    console.log(`🔹 DEBUG - Socket: Room size: ${this.pollRooms.get(pollId)?.size || 0}`);
    console.log(`🔹 DEBUG - Socket: Update action: ${data.action}`);

    // If this is a new question, store it as the active question for this poll
    if (data.action === 'new-question') {
      console.log(`🔹 DEBUG - Socket: Setting active question for poll ${pollId}`);
      console.log(
        `🔹 DEBUG - Socket: Question started at: ${data.data?.startedAt || new Date().toISOString()}`,
      );

      // Store the question data and the start time
      this.activeQuestions.set(pollId, {
        ...data,
        startedAt: data.data?.startedAt || new Date().toISOString(),
      });
    }

    // Special handling for question results
    if (data.action === 'question-results') {
      console.log(`🔹 DEBUG - Socket: Broadcasting question results for poll ${pollId}`);
      console.log(`🔹 DEBUG - Socket: Question type: ${data.data?.type}`);
      console.log(`🔹 DEBUG - Socket: Total responses: ${data.data?.results?.totalResponses || 0}`);
    }

    console.log(`🔹 DEBUG - Socket: Emitting poll-updated to room poll:${pollId}`);
    this.io.to(`poll:${pollId}`).emit('poll-updated', data);

    // Special event for new questions
    if (data.action === 'new-question') {
      console.log(`🔹 DEBUG - Socket: Emitting active-question to room poll:${pollId}`);
      this.io.to(`poll:${pollId}`).emit('active-question', data);
    }

    console.log(`🔹 DEBUG - Socket: Broadcast complete`);
  }

  // Method to end an active question for a poll
  public endPollQuestion(pollId: string) {
    console.log(`🔹 DEBUG - Socket: Ending active question for poll ${pollId}`);
    console.log(`🔹 DEBUG - Socket: Active question exists: ${this.activeQuestions.has(pollId)}`);

    // Get the active question before deleting it
    const activeQuestion = this.activeQuestions.get(pollId);
    console.log(`🔹 DEBUG - Socket: Active question data:`, activeQuestion);

    // Now remove it from active questions
    this.activeQuestions.delete(pollId);

    console.log(`🔹 DEBUG - Socket: Emitting question-ended event to room poll:${pollId}`);
    console.log(
      `🔹 DEBUG - Socket: Room exists: ${this.io.sockets.adapter.rooms.has(`poll:${pollId}`)}`,
    );
    console.log(`🔹 DEBUG - Socket: Room size: ${this.pollRooms.get(pollId)?.size || 0}`);

    // Emit both a dedicated question-ended event and a generic poll-updated event
    this.io.to(`poll:${pollId}`).emit('question-ended', {
      pollId,
      timestamp: new Date().toISOString(),
      questionId: activeQuestion?.data?.question?.id || activeQuestion?.id,
    });

    // Also emit as a generic poll-updated event for clients that listen to that
    this.io.to(`poll:${pollId}`).emit('poll-updated', {
      action: 'question-ended',
      data: {
        pollId,
        timestamp: new Date().toISOString(),
        questionId: activeQuestion?.data?.question?.id || activeQuestion?.id,
      },
    });

    console.log(`🔹 DEBUG - Socket: Question ended event emitted`);
  }

  // Method to get the active question for a poll
  public getActiveQuestion(pollId: string): any {
    return this.activeQuestions.get(pollId);
  }

  // Method to set the active question for a poll
  public setActiveQuestion(pollId: string, questionData: any): void {
    this.activeQuestions.set(pollId, questionData);
  }
}

export default SocketService;
