"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.resetPassword = exports.requestPasswordReset = exports.login = exports.verifyEmail = exports.adminSignup = exports.signup = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
const email_util_1 = require("../utils/email.util");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const prisma = new client_1.PrismaClient();
const otpStore = new Map();
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
const generateTokens = (userId) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId }, jwt_config_1.jwtConfig.accessToken.secret, {
        expiresIn: jwt_config_1.jwtConfig.accessToken.expiresIn,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, jwt_config_1.jwtConfig.refreshToken.secret, {
        expiresIn: jwt_config_1.jwtConfig.refreshToken.expiresIn,
    });
    return { accessToken, refreshToken };
};
const sendAndStoreOTP = async (email, name, skipEmail = false) => {
    const otp = generateOTP();
    otpStore.set(email, {
        otp,
        expires: new Date(Date.now() + 5 * 60 * 1000),
    });
    if (!skipEmail) {
        await (0, email_util_1.sendVerificationEmail)(email, otp, name);
    }
    return otp;
};
const signup = async (req, res) => {
    try {
        const { name, email, password, profilePhoto } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
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
        await sendAndStoreOTP(email, name);
        const tokens = generateTokens(user.id);
        res.status(201).json({
            message: 'User registered successfully. Please verify your email.',
            user,
            ...tokens,
        });
    }
    catch (error) {
        logger_config_1.default.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.signup = signup;
const adminSignup = async (req, res) => {
    try {
        const { name, email, password, profilePhoto } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                profilePhoto,
                role: 'ADMIN',
                emailVerified: true,
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
        const tokens = generateTokens(user.id);
        res.status(201).json({
            message: 'Admin registered successfully.',
            user,
            ...tokens,
        });
    }
    catch (error) {
        logger_config_1.default.error('Admin signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminSignup = adminSignup;
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const storedOTP = otpStore.get(email);
        if (!storedOTP || storedOTP.otp !== otp || storedOTP.expires < new Date()) {
            res.status(400).json({ message: 'Invalid or expired OTP' });
            return;
        }
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
        otpStore.delete(email);
        res.json({
            message: 'Email verified successfully',
            user,
        });
    }
    catch (error) {
        logger_config_1.default.error('Email verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.verifyEmail = verifyEmail;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        if (!user.emailVerified) {
            await sendAndStoreOTP(email, user.name);
            res.status(403).json({
                message: 'Email not verified. A new verification code has been sent.',
                requiresVerification: true,
            });
            return;
        }
        const tokens = generateTokens(user.id);
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            ...tokens,
        });
    }
    catch (error) {
        logger_config_1.default.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.login = login;
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
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
        const otp = await sendAndStoreOTP(email, user.name, true);
        try {
            await (0, email_util_1.sendPasswordResetEmail)(email, otp, user.name);
            logger_config_1.default.info(`Password reset OTP sent to ${email}`);
            res.json({
                success: true,
                message: 'Password reset OTP sent successfully',
            });
        }
        catch (error) {
            logger_config_1.default.error('Error sending password reset email:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to send password reset email',
            });
        }
    }
    catch (error) {
        logger_config_1.default.error('Error in requestPasswordReset:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const storedOTP = otpStore.get(email);
        if (!storedOTP || storedOTP.otp !== otp || storedOTP.expires < new Date()) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid or expired OTP',
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });
        otpStore.delete(email);
        res.status(200).json({
            status: 'success',
            message: 'Password has been reset successfully',
        });
    }
    catch (error) {
        logger_config_1.default.error('Error in resetPassword:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};
exports.resetPassword = resetPassword;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ message: 'Refresh token is required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, jwt_config_1.jwtConfig.refreshToken.secret);
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
        const tokens = generateTokens(user.id);
        res.json({
            message: 'Token refreshed successfully',
            user,
            ...tokens,
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: 'Refresh token expired' });
            return;
        }
        logger_config_1.default.error('Token refresh error:', error);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};
exports.refreshToken = refreshToken;
//# sourceMappingURL=auth.controller.js.map