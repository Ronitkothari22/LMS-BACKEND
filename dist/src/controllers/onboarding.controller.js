"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserDetails = void 0;
const client_1 = require("@prisma/client");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const prisma = new client_1.PrismaClient();
const updateUserDetails = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { companyPosition, department, phoneNumber } = req.body;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
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
    }
    catch (error) {
        logger_config_1.default.error('Error updating user details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateUserDetails = updateUserDetails;
//# sourceMappingURL=onboarding.controller.js.map