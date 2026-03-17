import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { User, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyToken = async (token: string): Promise<User | null> => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
    if (!decoded?.userId) return null;

    // Fetch the complete user from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
        phoneNumber: true,
        companyPosition: true,
        department: true,
        isActive: true,
        belt: true,
        xpPoints: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.emailVerified || !user.isActive) {
      return null;
    }

    return user as User;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};
