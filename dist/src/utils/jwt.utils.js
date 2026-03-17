"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const verifyToken = async (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_config_1.env.JWT_ACCESS_SECRET);
        if (!(decoded === null || decoded === void 0 ? void 0 : decoded.userId))
            return null;
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
        return user;
    }
    catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=jwt.utils.js.map