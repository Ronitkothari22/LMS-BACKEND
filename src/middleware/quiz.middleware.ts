import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getParamString } from '../utils/param-parser';

const prisma = new PrismaClient();

export const validateQuizAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const quizId = getParamString(req.params.quizId);
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';

    // If user is admin, bypass all validation
    if (isAdmin) {
      return next();
    }

    // First, check if the user has already submitted a response to this quiz
    const existingParticipation = await prisma.quizResponse.findFirst({
      where: {
        quizId,
        userId,
      },
    });

    if (existingParticipation) {
      return next();
    }

    // If not, check if the user is a participant in the session that contains this quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { sessionId: true },
    });

    if (!quiz) {
      res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
      return;
    }

    const sessionParticipation = await prisma.session.findFirst({
      where: {
        id: quiz.sessionId,
        participants: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!sessionParticipation) {
      res.status(403).json({
        success: false,
        message: 'You must be a participant in the session to access quiz details.',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
