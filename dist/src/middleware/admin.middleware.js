"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const client_1 = require("@prisma/client");
const isAdmin = (req, _res, next) => {
    try {
        if (!req.user) {
            throw new http_exception_1.default(401, 'Authentication required');
        }
        if (req.user.role !== client_1.Role.ADMIN) {
            throw new http_exception_1.default(403, 'Access denied. Admin privileges required');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=admin.middleware.js.map