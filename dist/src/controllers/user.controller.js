"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserActiveStatus = exports.updateUser = exports.sendBulkInvitations = exports.getUserById = exports.getAllUsers = exports.createUser = void 0;
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const logger_config_1 = __importDefault(require("../config/logger.config"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const email_util_1 = require("../utils/email.util");
const xlsx_1 = __importDefault(require("xlsx"));
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
const param_parser_1 = require("../utils/param-parser");
const createUser = async (req, res, next) => {
    try {
        const { name, email, password, phoneNumber, companyPosition, department, profilePhoto } = req.body;
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new http_exception_1.default(409, 'Email already registered');
        }
        if (phoneNumber) {
            const existingPhoneUser = await prisma_1.default.user.findUnique({
                where: { phoneNumber },
            });
            if (existingPhoneUser) {
                throw new http_exception_1.default(409, 'Phone number already registered');
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phoneNumber,
                companyPosition,
                department,
                profilePhoto,
                emailVerified: true,
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
        try {
            await (0, email_util_1.sendWelcomeEmail)(email, name, password);
        }
        catch (emailError) {
            logger_config_1.default.error('Failed to send welcome email:', emailError);
        }
        logger_config_1.default.info(`New user created by admin: ${user.email}`);
        res.status(201).json({
            success: true,
            message: 'User created successfully and welcome email sent',
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const totalUsers = await prisma_1.default.user.count();
        const users = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res, next) => {
    try {
        const userId = (0, param_parser_1.getParamString)(req.params.userId);
        const user = await prisma_1.default.user.findUnique({
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
            throw new http_exception_1.default(404, 'User not found');
        }
        res.json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserById = getUserById;
function generateSecurePassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const password = [
        uppercase[Math.floor(Math.random() * uppercase.length)],
        lowercase[Math.floor(Math.random() * lowercase.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        special[Math.floor(Math.random() * special.length)],
    ];
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 8; i++) {
        password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }
    return password.sort(() => Math.random() - 0.5).join('');
}
const sendBulkInvitations = async (req, res, next) => {
    var _a;
    try {
        if (!req.file) {
            throw new http_exception_1.default(400, 'Please upload a file');
        }
        const results = [];
        const fileBuffer = req.file.buffer;
        const fileExtension = (_a = req.file.originalname.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const workbook = xlsx_1.default.read(fileBuffer);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx_1.default.utils.sheet_to_json(worksheet);
            results.push(...data);
        }
        else if (fileExtension === 'csv') {
            const csvData = [];
            await new Promise((resolve, reject) => {
                stream_1.Readable.from(fileBuffer)
                    .pipe((0, csv_parser_1.default)())
                    .on('data', row => csvData.push(row))
                    .on('end', () => resolve(csvData))
                    .on('error', error => reject(error));
            });
            results.push(...csvData);
        }
        else {
            throw new http_exception_1.default(400, 'Unsupported file format. Please upload CSV or Excel file.');
        }
        const invitationResults = await Promise.all(results.map(async (user) => {
            try {
                if (!user.email || !user.name) {
                    return {
                        email: user.email || 'Missing email',
                        name: user.name || 'Missing name',
                        status: 'failed',
                        error: 'Missing required fields',
                    };
                }
                const existingUser = await prisma_1.default.user.findUnique({
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
                const password = generateSecurePassword();
                const hashedPassword = await bcryptjs_1.default.hash(password, 10);
                await prisma_1.default.user.create({
                    data: {
                        name: user.name,
                        email: user.email,
                        password: hashedPassword,
                        emailVerified: true,
                    },
                });
                await (0, email_util_1.sendWelcomeEmail)(user.email, user.name, password);
                return {
                    email: user.email,
                    name: user.name,
                    status: 'success',
                };
            }
            catch (error) {
                return {
                    email: user.email,
                    name: user.name,
                    status: 'failed',
                    error: error.message,
                };
            }
        }));
        const summary = {
            total: invitationResults.length,
            successful: invitationResults.filter(r => r.status === 'success').length,
            failed: invitationResults.filter(r => r.status === 'failed').length,
            skipped: invitationResults.filter(r => r.status === 'skipped').length,
        };
        logger_config_1.default.info(`Bulk invitations processed: ${JSON.stringify(summary)}`);
        res.json({
            success: true,
            data: {
                summary,
                results: invitationResults,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendBulkInvitations = sendBulkInvitations;
const updateUser = async (req, res, next) => {
    try {
        const userId = (0, param_parser_1.getParamString)(req.params.userId);
        const { name, email, phoneNumber, companyPosition, department, profilePhoto } = req.body;
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new http_exception_1.default(404, 'User not found');
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (phoneNumber !== undefined)
            updateData.phoneNumber = phoneNumber;
        if (companyPosition !== undefined)
            updateData.companyPosition = companyPosition;
        if (department !== undefined)
            updateData.department = department;
        if (profilePhoto !== undefined)
            updateData.profilePhoto = profilePhoto;
        if (email !== undefined && email !== existingUser.email) {
            const emailExists = await prisma_1.default.user.findUnique({
                where: { email },
            });
            if (emailExists) {
                throw new http_exception_1.default(409, 'Email already in use');
            }
            updateData.email = email;
        }
        const updatedUser = await prisma_1.default.user.update({
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
        logger_config_1.default.info(`User updated: ${updatedUser.email}`);
        res.json({
            success: true,
            data: { user: updatedUser },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
const toggleUserActiveStatus = async (req, res, next) => {
    try {
        const userId = (0, param_parser_1.getParamString)(req.params.userId);
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                isActive: true,
                email: true,
            },
        });
        if (!existingUser) {
            throw new http_exception_1.default(404, 'User not found');
        }
        const updatedUser = await prisma_1.default.user.update({
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
        logger_config_1.default.info(`User ${updatedUser.email} active status toggled to: ${updatedUser.isActive}`);
        res.json({
            success: true,
            data: { user: updatedUser },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleUserActiveStatus = toggleUserActiveStatus;
//# sourceMappingURL=user.controller.js.map