"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const logger_config_1 = __importDefault(require("../config/logger.config"));
function errorMiddleware(error, req, res, _next) {
    const status = error.status || 500;
    const message = error.message || 'Something went wrong';
    logger_config_1.default.error(`${status} - ${message} - ${req.path} - ${req.method} - ${req.ip}`, {
        error: error.toString(),
    });
    res.status(status).json({
        success: false,
        message,
    });
}
//# sourceMappingURL=error.middleware.js.map