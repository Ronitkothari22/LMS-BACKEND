import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.util';
import logger from '../config/logger.config';

const prisma = new PrismaClient();

// In-memory OTP store (replace with Redis in production)
const otpStore = new Map<string, { otp: string; expires: Date }>();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    jwtConfig.accessToken.secret as jwt.Secret,
    {
      expiresIn: jwtConfig.accessToken.expiresIn,
    } as SignOptions,
  );
  const refreshToken = jwt.sign(
    { userId },
    jwtConfig.refreshToken.secret as jwt.Secret,
    {
      expiresIn: jwtConfig.refreshToken.expiresIn,
    } as SignOptions,
  );
  return { accessToken, refreshToken };
};

// Send OTP and store it
const sendAndStoreOTP = async (email: string, name: string, skipEmail: boolean = false) => {
  const otp = generateOTP();

  // Store new OTP (this will overwrite any existing OTP)
  otpStore.set(email, {
    otp,
    expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  });

  // Send verification email (fire and forget) only if skipEmail is false
  if (!skipEmail) {
    await sendVerificationEmail(email, otp, name);
  }
  return otp;
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, profilePhoto } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        profilePhoto,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
      },
    });

    // Generate and send OTP
    await sendAndStoreOTP(email, name);

    // Generate tokens
    const tokens = generateTokens(user.id);

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      user,
      ...tokens,
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, profilePhoto } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        profilePhoto,
        role: 'ADMIN', // Automatically assign ADMIN role
        emailVerified: true, // Admin accounts are pre-verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens(user.id);

    res.status(201).json({
      message: 'Admin registered successfully.',
      user,
      ...tokens,
    });
  } catch (error) {
    logger.error('Admin signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Verify OTP
    const storedOTP = otpStore.get(email);
    if (!storedOTP || storedOTP.otp !== otp || storedOTP.expires < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    // Update user
    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
      },
    });

    // Clear OTP after successful verification
    otpStore.delete(email);

    res.json({
      message: 'Email verified successfully',
      user,
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        profilePhoto: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Generate and send new OTP
      await sendAndStoreOTP(email, user.name);

      res.status(403).json({
        message: 'Email not verified. A new verification code has been sent.',
        requiresVerification: true,
      });
      return;
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      ...tokens,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Generate and store OTP without sending verification email
    const otp = await sendAndStoreOTP(email, user.name, true);

    // Send password reset OTP
    try {
      await sendPasswordResetEmail(email, otp, user.name);
      logger.info(`Password reset OTP sent to ${email}`);

      res.json({
        success: true,
        message: 'Password reset OTP sent successfully',
      });
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send password reset email',
      });
    }
  } catch (error) {
    logger.error('Error in requestPasswordReset:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    // Verify OTP
    const storedOTP = otpStore.get(email);
    if (!storedOTP || storedOTP.otp !== otp || storedOTP.expires < new Date()) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP',
      });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Clear OTP after successful password reset
    otpStore.delete(email);

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    logger.error('Error in resetPassword:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshToken.secret as jwt.Secret) as {
      userId: string;
    };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
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

    // Generate new tokens
    const tokens = generateTokens(user.id);

    res.json({
      message: 'Token refreshed successfully',
      user,
      ...tokens,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Refresh token expired' });
      return;
    }
    logger.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};
