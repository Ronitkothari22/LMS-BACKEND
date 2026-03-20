"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lmsLogError = exports.lmsLogInfo = void 0;
const logger_config_1 = __importDefault(require("../config/logger.config"));
const lmsLogInfo = (event, message, context = {}) => {
    logger_config_1.default.info(`[${event}] ${message}`, context);
};
exports.lmsLogInfo = lmsLogInfo;
const lmsLogError = (event, message, context = {}) => {
    logger_config_1.default.error(`[${event}] ${message}`, context);
};
exports.lmsLogError = lmsLogError;
//# sourceMappingURL=lms-logger.js.map