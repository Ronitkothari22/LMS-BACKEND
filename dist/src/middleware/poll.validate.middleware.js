"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePollRequest = void 0;
const zod_1 = require("zod");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const validatePollRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                logger_config_1.default.warn('Poll validation error:', error.errors);
                res.status(400).json({
                    message: 'Validation failed',
                    errors: error.errors.map(e => ({
                        field: e.path[0],
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
};
exports.validatePollRequest = validatePollRequest;
//# sourceMappingURL=poll.validate.middleware.js.map