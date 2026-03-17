"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContentForm = void 0;
const client_1 = require("@prisma/client");
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const logger_config_1 = __importDefault(require("../config/logger.config"));
const validateContentForm = (req, _res, next) => {
    try {
        const { title, sessionId, type } = req.body;
        const file = req.file;
        logger_config_1.default.info('Validating content form data');
        logger_config_1.default.info('Body:', req.body);
        logger_config_1.default.info('File:', req.file ? 'File present' : 'No file');
        if (!title) {
            throw new http_exception_1.default(400, 'Title is required');
        }
        if (!sessionId) {
            throw new http_exception_1.default(400, 'Session ID is required');
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(sessionId)) {
            throw new http_exception_1.default(400, 'Invalid session ID format');
        }
        if (type && !Object.values(client_1.ContentType).includes(type)) {
            throw new http_exception_1.default(400, 'Invalid content type');
        }
        if (!file) {
            throw new http_exception_1.default(400, 'No file uploaded');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateContentForm = validateContentForm;
//# sourceMappingURL=content-form.middleware.js.map