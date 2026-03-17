import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import HttpException from '../utils/http-exception';
import logger from '../config/logger.config';
import { getParamString } from '../utils/param-parser';

const prisma = new PrismaClient();

/**
 * Middleware to validate content access
 * Checks if the user has permission to view or edit the content
 */
export const validateContentAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contentId = getParamString(req.params.contentId);
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpException(401, 'Unauthorized');
    }

    // Get content with access permissions
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
      throw new HttpException(404, 'Content not found');
    }

    // Check if user has admin privileges
    const isSuperAdmin = req.user?.role === Role.ADMIN;
    const isSessionCreator = (content as any).session?.createdById === userId;
    const isAdmin = isSuperAdmin || isSessionCreator;

    // Check if user can view the content
    const canView =
      isAdmin ||
      (content as any).canView?.some((user: any) => user.id === userId) ||
      (content as any).session?.participants.some((participant: any) => participant.id === userId);

    if (!canView) {
      throw new HttpException(403, 'You do not have permission to access this content');
    }

    // Check if user can edit the content (for PUT/DELETE requests)
    if (
      (req.method === 'PUT' || req.method === 'DELETE') &&
      !isAdmin &&
      !(content as any).canEdit?.some((user: any) => user.id === userId)
    ) {
      throw new HttpException(403, 'You do not have permission to modify this content');
    }

    // Add content to request for later use
    req.content = (content as any).session
      ? {
          ...content,
          session: (content as any).session
            ? {
                createdById: (content as any).session.createdById,
                participants: (content as any).session.participants,
              }
            : undefined,
          canView: (content as any).canView,
          canEdit: (content as any).canEdit,
        }
      : undefined;
    next();
  } catch (error) {
    logger.error('Error validating content access:', error);
    next(error);
  }
};

/**
 * Middleware to validate session access for content upload
 * Checks if the user has permission to upload content to the session
 */
export const validateSessionForContent = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const isAdmin = userRole === Role.ADMIN;

    if (!userId) {
      throw new HttpException(401, 'Unauthorized');
    }

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        createdById: true,
      },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Allow upload if the requester is the session creator OR has admin privileges
    if (!isAdmin && session.createdById !== userId) {
      throw new HttpException(
        403,
        'Only the session creator or an admin can upload content to this session',
      );
    }

    next();
  } catch (error) {
    logger.error('Error validating session for content:', error);
    next(error);
  }
};
