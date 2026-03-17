import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.config';

const prisma = new PrismaClient();

export const updateUserDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id; // Will be set by auth middleware
    const { companyPosition, department, phoneNumber } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Update user details
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        companyPosition,
        department,
        phoneNumber,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        companyPosition: true,
        department: true,
        phoneNumber: true,
        role: true,
        emailVerified: true,
      },
    });

    res.json({
      message: 'User details updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
