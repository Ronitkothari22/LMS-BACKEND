import { Request, Response, NextFunction, RequestHandler } from 'express';
import HttpException from '../utils/http-exception';
import logger from '../config/logger.config';
import prisma from '../lib/prisma';
import { sendSessionInvitation } from '../utils/email.util';
import { SessionState } from '@prisma/client';
import xlsx from 'xlsx';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { getParamString } from '../utils/param-parser';

function generateJoiningCode(): string {
  // Generate a 6-character alphanumeric code
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const createSession: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, allowGuests, participants, startTime, endTime } = req.body;
    const adminId = req.user!.id;

    let registeredUsers: { id: string; email: string }[] = [];
    // If participants are provided, validate them
    if (participants && participants.length > 0) {
      registeredUsers = await prisma.user.findMany({
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

      // Only validate if guests are not allowed
      if (!allowGuests) {
        const registeredEmails = new Set(registeredUsers.map(user => user.email));
        const unregisteredEmails = participants.filter(
          (email: string) => !registeredEmails.has(email),
        );

        if (unregisteredEmails.length > 0) {
          throw new HttpException(
            400,
            `The following participants are not registered users: ${unregisteredEmails.join(', ')}. Please register them first or enable guest access.`,
          );
        }
      }
    }

    // Generate joining code
    const joiningCode = generateJoiningCode();

    // Calculate expiry date (1 day from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);

    // Create session with invited users
    const session = await prisma.session.create({
      data: {
        title,
        joiningCode,
        allowGuests,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        state: 'UPCOMING' as SessionState,
        isActive: true,
        invitedEmails: participants || [], // Store all invited emails
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

    // Send invitations to all participants asynchronously
    if (participants && participants.length > 0) {
      try {
        await Promise.all(
          participants.map(async (email: string) => {
            try {
              await sendSessionInvitation(
                email,
                title,
                joiningCode,
                session.createdBy.name,
                expiryDate,
              );
              logger.info(`Session invitation sent to ${email}`);
            } catch (error) {
              logger.error(`Failed to send session invitation to ${email}:`, error);
              // Don't throw here to allow other invitations to proceed
            }
          }),
        );
      } catch (error) {
        logger.error('Error in sending session invitations:', error);
        // Don't throw here as the session is already created
      }
    }

    logger.info(`New session created: ${title} with code ${joiningCode}`);

    // Separate registered and unregistered participants for clarity
    const registeredEmails = new Set(session.invited.map(user => user.email));
    const unregisteredEmails =
      participants?.filter((email: string) => !registeredEmails.has(email)) || [];

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
        invitationsSent: participants?.length || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const normalizedSessionId = getParamString(req.params.sessionId);
    const updateData = req.body;

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: normalizedSessionId },
    });

    if (!existingSession) {
      throw new HttpException(404, 'Session not found');
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: normalizedSessionId },
      data: {
        ...(updateData.startTime && { startTime: new Date(updateData.startTime) }),
        ...(updateData.endTime && { endTime: new Date(updateData.endTime) }),
        ...(updateData.maxParticipants && { maxParticipants: updateData.maxParticipants }),
        ...(typeof updateData.allowGuests !== 'undefined' && {
          allowGuests: updateData.allowGuests,
        }),
        ...(updateData.state && { state: updateData.state as SessionState }),
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

    logger.info(`Session ${normalizedSessionId} updated successfully`);

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
  } catch (error) {
    next(error);
  }
};

export const joinSession: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { joiningCode } = req.body;
    const userId = req.user!.id;

    // Find session by joining code
    const session = await prisma.session.findUnique({
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
      throw new HttpException(404, 'Session not found');
    }

    // Check if session is active
    if (!session.isActive) {
      throw new HttpException(400, 'This session is no longer active');
    }

    // Check if session has started
    if (session.state !== 'UPCOMING' && session.state !== 'IN_PROGRESS') {
      throw new HttpException(400, 'This session is not available for joining');
    }

    // Check if joining code has expired
    if (session.expiryDate && new Date() > session.expiryDate) {
      throw new HttpException(400, 'Joining code has expired');
    }

    // Check if user is already a participant
    const isParticipant = session.participants.some(p => p.id === userId);

    let updatedSession = session;

    // Only add user if they're not already a participant
    if (!isParticipant) {
      // Check max participants limit
      if (session.maxParticipants && session.participants.length >= session.maxParticipants) {
        throw new HttpException(400, 'Session has reached maximum participants limit');
      }

      // Add user to participants
      updatedSession = await prisma.session.update({
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

      // Log activity
      await prisma.activityLog.create({
        data: {
          user: { connect: { id: userId } },
          action: 'session_joined',
          details: `Joined session: ${session.title}`,
        },
      });

      logger.info(`User ${userId} joined session ${session.id}`);
    } else {
      logger.info(`User ${userId} already a participant in session ${session.id}`);
    }

    res.status(200).json({
      success: true,
      message: isParticipant
        ? 'Already a participant in this session'
        : 'Successfully joined the session',
      data: {
        sessionId: updatedSession.id, // Explicit session ID at the top level
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
  } catch (error) {
    next(error);
  }
};

export const toggleSessionStatus: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const normalizedSessionId = getParamString(req.params.sessionId);

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: normalizedSessionId },
    });

    if (!existingSession) {
      throw new HttpException(404, 'Session not found');
    }

    // Toggle the isActive status
    const updatedSession = await prisma.session.update({
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

    logger.info(`Session ${normalizedSessionId} status toggled to ${updatedSession.isActive}`);

    res.status(200).json({
      success: true,
      message: `Session ${updatedSession.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        session: updatedSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSessions: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page = 1, limit = 10, state, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    // Build where clause based on filters and user role
    let where: any = {
      ...(state && { state: state as SessionState }),
      ...(typeof isActive !== 'undefined' && { isActive: isActive === 'true' }),
    };

    // If not admin, only show sessions where user is a participant
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

    // Get total count for pagination
    const totalCount = await prisma.session.count({ where });

    // Get sessions with relationships
    const sessions = await prisma.session.findMany({
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    logger.info(`Retrieved ${sessions.length} sessions for page ${page}`);

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
  } catch (error) {
    next(error);
  }
};

export const getSessionById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const normalizedSessionId = getParamString(req.params.sessionId);

    const session = await prisma.session.findUnique({
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
      throw new HttpException(404, 'Session not found');
    }

    logger.info(`Retrieved details for session ${normalizedSessionId}`);

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
  } catch (error) {
    next(error);
  }
};

export const getUserSessions: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get sessions where user is a participant (both active and inactive)
    const sessions = await prisma.session.findMany({
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

    logger.info(`Retrieved ${sessions.length} sessions for user ${userId}`);

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
  } catch (error) {
    next(error);
  }
};

export const bulkSessionInvite: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      throw new HttpException(400, 'Please upload a file');
    }

    const normalizedSessionId = getParamString(req.body.sessionId);

    // Check if session exists
    const session = await prisma.session.findUnique({
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
      throw new HttpException(404, 'Session not found');
    }

    // Calculate expiry date (1 day from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);

    // Parse the uploaded file
    const emails: string[] = [];
    const fileBuffer = req.file.buffer;
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Handle Excel files
      const workbook = xlsx.read(fileBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      // Extract emails from the data
      data.forEach((row: any) => {
        if (row.email) {
          emails.push(row.email);
        }
      });
    } else if (fileExtension === 'csv') {
      // Handle CSV files
      const csvData: any[] = [];
      await new Promise((resolve, reject) => {
        Readable.from(fileBuffer)
          .pipe(csv())
          .on('data', row => csvData.push(row))
          .on('end', () => resolve(csvData))
          .on('error', error => reject(error));
      });

      // Extract emails from the data
      csvData.forEach(row => {
        if (row.email) {
          emails.push(row.email);
        }
      });
    } else {
      throw new HttpException(400, 'Unsupported file format. Please upload CSV or Excel file.');
    }

    if (emails.length === 0) {
      throw new HttpException(400, 'No valid emails found in the uploaded file');
    }

    // Filter out invalid emails
    const validEmails = emails.filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    });

    if (validEmails.length === 0) {
      throw new HttpException(400, 'No valid emails found in the uploaded file');
    }

    // Find existing users with these emails
    const existingUsers = await prisma.user.findMany({
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

    // Get existing invited users' emails
    const existingInvitedEmails = new Set(session.invited.map(user => user.email));

    // Get emails that are already in the invitedEmails array
    const existingSessionEmails = new Set(session.invitedEmails);

    // Filter out emails that are already invited
    const newUserEmails = validEmails.filter(
      email => !existingInvitedEmails.has(email) && !existingSessionEmails.has(email),
    );

    if (newUserEmails.length === 0) {
      throw new HttpException(400, 'All emails in the file are already invited to this session');
    }

    // Get registered users that need to be connected
    const newRegisteredUsers = existingUsers.filter(
      user => newUserEmails.includes(user.email) && !existingInvitedEmails.has(user.email),
    );

    // Update session with new invited users
    await prisma.session.update({
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

    // Send invitations to all new participants asynchronously
    const invitationResults = await Promise.all(
      newUserEmails.map(async (email: string) => {
        try {
          await sendSessionInvitation(
            email,
            session.title,
            session.joiningCode!,
            session.createdBy.name,
            expiryDate,
          );
          logger.info(`Session invitation sent to ${email}`);
          return {
            email,
            status: 'success',
          };
        } catch (error) {
          logger.error(`Failed to send session invitation to ${email}:`, error);
          return {
            email,
            status: 'failed',
            error: error.message,
          };
        }
      }),
    );

    const summary = {
      total: invitationResults.length,
      successful: invitationResults.filter(r => r.status === 'success').length,
      failed: invitationResults.filter(r => r.status === 'failed').length,
    };

    logger.info(`Bulk session invitations processed: ${JSON.stringify(summary)}`);

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
  } catch (error) {
    next(error);
  }
};

// Add single email or multiple emails to session invite list
export const addEmailToSession: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const normalizedSessionId = getParamString(req.params.sessionId);
    const { email, emails } = req.body;
    const userId = req.user?.id;

    // Normalize to array of emails
    const emailsToAdd: string[] = [];
    if (email) {
      emailsToAdd.push(email);
    }
    if (emails && Array.isArray(emails)) {
      emailsToAdd.push(...emails);
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(emailsToAdd)];

    if (uniqueEmails.length === 0) {
      throw new HttpException(400, 'At least one email must be provided');
    }

    // Check if session exists and user has permission to invite
    const session = await prisma.session.findUnique({
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
      throw new HttpException(404, 'Session not found');
    }

    // Check if user is admin or session creator
    const isAdmin = req.user?.role === 'ADMIN';
    const isCreator = session.createdById === userId;

    if (!isAdmin && !isCreator) {
      throw new HttpException(403, 'You do not have permission to invite users to this session');
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = uniqueEmails.filter(emailAddr => !emailRegex.test(emailAddr));

    if (invalidEmails.length > 0) {
      throw new HttpException(400, `Invalid email format(s): ${invalidEmails.join(', ')}`);
    }

    // Check for already invited emails
    const existingInvitedEmails = new Set(session.invited.map(user => user.email));
    const existingSessionEmails = new Set(session.invitedEmails);

    const alreadyInvitedEmails = uniqueEmails.filter(
      emailAddr => existingInvitedEmails.has(emailAddr) || existingSessionEmails.has(emailAddr),
    );

    const newEmails = uniqueEmails.filter(
      emailAddr => !existingInvitedEmails.has(emailAddr) && !existingSessionEmails.has(emailAddr),
    );

    if (newEmails.length === 0) {
      throw new HttpException(
        400,
        `All provided emails are already invited to this session: ${alreadyInvitedEmails.join(', ')}`,
      );
    }

    // Check which emails belong to registered users
    const existingUsers = await prisma.user.findMany({
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

    // Calculate expiry date (1 day from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);

    // Update session with new emails
    const updatedSession = await prisma.session.update({
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

    // Send invitation emails to all new emails
    const emailResults = await Promise.all(
      newEmails.map(async (emailAddr: string) => {
        try {
          await sendSessionInvitation(
            emailAddr,
            session.title,
            session.joiningCode!,
            session.createdBy.name,
            expiryDate,
          );
          logger.info(`Session invitation sent to ${emailAddr} for session: ${session.title}`);
          return {
            email: emailAddr,
            status: 'success',
            isRegisteredUser: registeredUserEmails.has(emailAddr),
          };
        } catch (emailError) {
          logger.error(`Failed to send session invitation to ${emailAddr}:`, emailError);
          return {
            email: emailAddr,
            status: 'email_failed',
            isRegisteredUser: registeredUserEmails.has(emailAddr),
            error: emailError.message,
          };
        }
      }),
    );

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
  } catch (error) {
    next(error);
  }
};

// Get overall quiz scoring details for a session
export const getSessionQuizScoring: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const normalizedSessionId = getParamString(req.params.sessionId);
    const userId = req.user?.id;

    // Check if session exists
    const session = await prisma.session.findUnique({
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
      throw new HttpException(404, 'Session not found');
    }

    // Check if user has permission to view session quiz scoring
    const isAdmin = req.user?.role === 'ADMIN';
    const isCreator = session.createdById === userId;
    const isParticipant = session.participants.some(p => p.id === userId);
    const isInvited = session.invited.some(i => i.id === userId);

    if (!isAdmin && !isCreator && !isParticipant && !isInvited) {
      throw new HttpException(403, "You do not have permission to view this session's quiz scores");
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

    // Get all quiz responses for quizzes in this session
    const quizResponses = await prisma.quizResponse.findMany({
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

    // Group responses by user
    const userScoresMap = new Map();

    // Define types for better TypeScript support
    interface QuizResult {
      quizId: string;
      quizTitle: string;
      attempts: number;
      bestScore: number;
      latestScore: number;
      totalMarks: number | null;
      passingScore: number | null;
      passed: boolean;
    }

    interface UserData {
      userId: string;
      userName: string;
      userEmail: string;
      quizResults: QuizResult[];
      totalAttempts: number;
      totalScore: number;
      averageScore: number;
      quizzesCompleted: number;
      quizzesPassed: number;
      participationRate: number;
    }

    // Initialize with all participants and invited users
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
        } as UserData);
      }
    });

    // Process quiz responses
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
        } as UserData);
      }

      const userData = userScoresMap.get(userId);
      userData.totalAttempts += 1;

      // Find or create quiz result entry
      let quizResult = userData.quizResults.find((q: QuizResult) => q.quizId === response.quiz.id);
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

    // Calculate final statistics for each user
    const participants = Array.from(userScoresMap.values()).map((userData: UserData) => {
      const completedQuizzes = userData.quizResults.filter((q: QuizResult) => q.attempts > 0);
      const passedQuizzes = userData.quizResults.filter((q: QuizResult) => q.passed);
      const totalScore = userData.quizResults.reduce(
        (sum: number, q: QuizResult) => sum + q.bestScore,
        0,
      );

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

    // Sort participants by total score (highest first)
    participants.sort((a, b) => b.totalScore - a.totalScore);

    // Add rank to each participant
    const rankedParticipants = participants.map((participant, index) => ({
      ...participant,
      rank: index + 1,
    }));

    // Calculate session summary
    const sessionSummary = {
      totalQuizzes: session.quizzes.length,
      totalParticipants: participants.length,
      participantsWithAttempts: participants.filter(p => p.totalAttempts > 0).length,
      averageParticipationRate:
        participants.length > 0
          ? Math.round(
              (participants.reduce((sum, p) => sum + p.participationRate, 0) /
                participants.length) *
                100,
            ) / 100
          : 0,
      highestScore: participants.length > 0 ? participants[0].totalScore : 0,
      averageScore:
        participants.length > 0
          ? Math.round(
              (participants.reduce((sum, p) => sum + p.totalScore, 0) / participants.length) * 100,
            ) / 100
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
  } catch (error) {
    next(error);
  }
};

export const assignUsersToSession: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const normalizedSessionId = getParamString(req.params.sessionId);
    const { userIds } = req.body as { userIds: string[] };
    const requesterId = req.user?.id;

    // Ensure userIds array is unique
    const uniqueUserIds = [...new Set(userIds)];

    // Fetch session with current participants and creator
    const session = await prisma.session.findUnique({
      where: { id: normalizedSessionId },
      include: {
        participants: { select: { id: true } },
        createdBy: { select: { id: true } },
      },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Authorization: requester must be ADMIN or the session creator
    const isAdmin = req.user?.role === 'ADMIN';
    const isCreator = session.createdBy.id === requesterId;

    if (!isAdmin && !isCreator) {
      throw new HttpException(403, 'You do not have permission to assign users to this session');
    }

    // Determine which userIds are already participants
    const existingParticipantIds = new Set(session.participants.map(p => p.id));
    const newParticipantIds = uniqueUserIds.filter(id => !existingParticipantIds.has(id));

    if (newParticipantIds.length === 0) {
      throw new HttpException(400, 'All provided users are already participants of this session');
    }

    // Check if users exist and are active
    const users = await prisma.user.findMany({
      where: {
        id: { in: newParticipantIds },
        isActive: true,
      },
      select: { id: true, name: true, email: true },
    });

    if (users.length !== newParticipantIds.length) {
      const foundIds = new Set(users.map(u => u.id));
      const missingIds = newParticipantIds.filter(id => !foundIds.has(id));
      throw new HttpException(
        400,
        `Some user IDs are invalid or inactive: ${missingIds.join(', ')}`,
      );
    }

    // Max participants check
    if (
      session.maxParticipants &&
      session.participants.length + newParticipantIds.length > session.maxParticipants
    ) {
      throw new HttpException(
        400,
        'Session would exceed maximum participants limit with these users',
      );
    }

    // Update session participants
    const updatedSession = await prisma.session.update({
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

    // Optionally, create activity logs for each user added
    await prisma.activityLog.createMany({
      data: newParticipantIds.map(uid => ({
        userId: uid,
        action: 'assigned_to_session',
        details: `Assigned to session: ${session.title}`,
      })),
    });

    logger.info(
      `Users [${newParticipantIds.join(', ')}] assigned to session ${normalizedSessionId} by ${requesterId}`,
    );

    res.status(200).json({
      success: true,
      message: 'Users successfully assigned to the session',
      data: {
        sessionId: updatedSession.id,
        participantsCount: updatedSession.participants.length,
        participants: updatedSession.participants,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSession: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const normalizedSessionId = getParamString(req.params.sessionId);
    const requesterId = req.user?.id;

    // Fetch session to verify existence and ownership
    const session = await prisma.session.findUnique({
      where: { id: normalizedSessionId },
      select: { id: true, createdById: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    const isAdmin = req.user?.role === 'ADMIN';
    const isCreator = session.createdById === requesterId;

    if (!isAdmin && !isCreator) {
      throw new HttpException(403, 'You do not have permission to delete this session');
    }

    // Delete the session (assumes cascading deletes are configured in Prisma schema)
    await prisma.session.delete({ where: { id: normalizedSessionId } });

    logger.info(`Session ${normalizedSessionId} deleted by user ${requesterId}`);

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
