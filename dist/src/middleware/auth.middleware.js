"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
const client_1 = require("@prisma/client");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const prisma = new client_1.PrismaClient();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.accessToken.secret);
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
        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: 'Token expired' });
            return;
        }
        logger_config_1.default.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.middleware.js.map