import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.config';

const prisma = new PrismaClient();

/**
 * Middleware to validate if a user has access to a session
 * Allows access if:
 * 1. User is an admin
 * 2. User is a participant in the session
 * 3. User is invited to the session
 */
export const validateSessionAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const isAdmin = userRole === 'ADMIN';

    // Log debugging information
    logger.debug(
      `Session access check - SessionID: ${sessionId}, UserID: ${userId}, UserRole: ${userRole}`,
    );

    // If user is admin, bypass all validation
    if (isAdmin) {
      logger.debug('User is admin, bypassing validation');
      return next();
    }

    // For non-admin users, check if they are a participant or invited to the session
    // Use a proper string type to satisfy Prisma's type requirements
    const sessionIdStr: string = Array.isArray(sessionId) ? sessionId[0] : sessionId || '';
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

    // Log session access details
    logger.debug(`Session found: ${!!session}`);
    if (session) {
      const participants = (session as any).participants || [];
      const invited = (session as any).invited || [];
      const isParticipant = participants.some((p: any) => p.id === userId);
      const isInvited = invited.some((i: any) => i.id === userId);
      logger.debug(`User is participant: ${isParticipant}, User is invited: ${isInvited}`);
    }

    if (!session) {
      logger.debug('Access denied: User is neither a participant nor invited to this session');
      res.status(403).json({
        success: false,
        message: 'You must be a participant or invited to this session to access its details.',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Session access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
