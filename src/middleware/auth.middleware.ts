import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.config';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, jwtConfig.accessToken.secret as jwt.Secret) as {
      userId: string;
    };

    // Get user from database with name and email
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({ message: 'Email not verified' });
      return;
    }

    // Set user in request with full info
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    logger.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
