import { Request, Response, NextFunction, RequestHandler } from 'express';
import HttpException from '../utils/http-exception';
import logger from '../config/logger.config';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/email.util';
import xlsx from 'xlsx';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { getParamString } from '../utils/param-parser';

export const createUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, password, phoneNumber, companyPosition, department, profilePhoto } =
      req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new HttpException(409, 'Email already registered');
    }

    // Check if phone number is unique if provided
    if (phoneNumber) {
      const existingPhoneUser = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (existingPhoneUser) {
        throw new HttpException(409, 'Phone number already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber,
        companyPosition,
        department,
        profilePhoto,
        emailVerified: true, // Since admin is creating, we can mark as verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        companyPosition: true,
        department: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Send welcome email with credentials
    try {
      await sendWelcomeEmail(email, name, password);
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
      // We don't throw here as the user is already created
    }

    logger.info(`New user created by admin: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully and welcome email sent',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get total count of users
    const totalUsers = await prisma.user.count();

    // Get paginated users
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        companyPosition: true,
        department: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalUsers,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getParamString(req.params.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        companyPosition: true,
        department: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new HttpException(404, 'User not found');
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  // Ensure one of each required character type
  const password = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  // Fill the rest with random characters from all types
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < 8; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle the password array
  return password.sort(() => Math.random() - 0.5).join('');
}

export const sendBulkInvitations: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      throw new HttpException(400, 'Please upload a file');
    }

    const results: { name: string; email: string }[] = [];
    const fileBuffer = req.file.buffer;
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Handle Excel files
      const workbook = xlsx.read(fileBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      results.push(...(data as { name: string; email: string }[]));
    } else if (fileExtension === 'csv') {
      // Handle CSV files
      const csvData: { name: string; email: string }[] = [];
      await new Promise((resolve, reject) => {
        Readable.from(fileBuffer)
          .pipe(csv())
          .on('data', row => csvData.push(row))
          .on('end', () => resolve(csvData))
          .on('error', error => reject(error));
      });
      results.push(...csvData);
    } else {
      throw new HttpException(400, 'Unsupported file format. Please upload CSV or Excel file.');
    }

    // Validate and send invitations
    const invitationResults = await Promise.all(
      results.map(async user => {
        try {
          if (!user.email || !user.name) {
            return {
              email: user.email || 'Missing email',
              name: user.name || 'Missing name',
              status: 'failed',
              error: 'Missing required fields',
            };
          }

          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            return {
              email: user.email,
              name: user.name,
              status: 'skipped',
              error: 'User already exists',
            };
          }

          // Generate a secure password
          const password = generateSecurePassword();
          const hashedPassword = await bcrypt.hash(password, 10);

          // Create user
          await prisma.user.create({
            data: {
              name: user.name,
              email: user.email,
              password: hashedPassword,
              emailVerified: true, // Changed to true to match admin-created users
            },
          });

          // Send invitation email
          await sendWelcomeEmail(user.email, user.name, password);

          return {
            email: user.email,
            name: user.name,
            status: 'success',
          };
        } catch (error) {
          return {
            email: user.email,
            name: user.name,
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
      skipped: invitationResults.filter(r => r.status === 'skipped').length,
    };

    logger.info(`Bulk invitations processed: ${JSON.stringify(summary)}`);

    res.json({
      success: true,
      data: {
        summary,
        results: invitationResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getParamString(req.params.userId);
    const { name, email, phoneNumber, companyPosition, department, profilePhoto } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new HttpException(404, 'User not found');
    }

    // Build update data with only provided fields
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (companyPosition !== undefined) updateData.companyPosition = companyPosition;
    if (department !== undefined) updateData.department = department;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    // Handle email update separately to check for uniqueness
    if (email !== undefined && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new HttpException(409, 'Email already in use');
      }
      updateData.email = email;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        companyPosition: true,
        department: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    logger.info(`User updated: ${updatedUser.email}`);

    res.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserActiveStatus: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getParamString(req.params.userId);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        email: true,
      },
    });

    if (!existingUser) {
      throw new HttpException(404, 'User not found');
    }

    // Toggle isActive status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !existingUser.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        companyPosition: true,
        department: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.info(`User ${updatedUser.email} active status toggled to: ${updatedUser.isActive}`);

    res.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};
