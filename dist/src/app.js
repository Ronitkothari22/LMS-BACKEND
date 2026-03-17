"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_config_1 = require("./config/env.config");
const logger_config_1 = __importDefault(require("./config/logger.config"));
const error_middleware_1 = require("./middleware/error.middleware");
const routes_1 = __importDefault(require("./routes"));
const cloudinary_config_1 = require("./config/cloudinary.config");
const app = (0, express_1.default)();
(0, cloudinary_config_1.initCloudinary)();
app.set('views', path_1.default.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080',
        'https://data.joinindots.co.in',
        'https://joining-dots-backend-2910abhishek-2910abhisheks-projects.vercel.app/',
        'https://joining-dots-frontend.vercel.app',
        'https://joining-dots-admin-2910abhishek-2910abhisheks-projects.vercel.app',
        'https://joining-dots-backend-beta.vercel.app',
        'http://admin.joiningdots.co.in',
        'https://admin.joiningdots.co.in',
        'http://session.joiningdots.co.in',
        'https://session.joiningdots.co.in',
        'http://api.joiningdots.co.in',
        'https://api.joiningdots.co.in',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_config_1.default.info(message.trim()),
    },
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_config_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_config_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
app.use((req, res, next) => {
    if (req.path.includes('/content') && req.method === 'POST') {
        req.setTimeout(5 * 60 * 1000);
        res.setTimeout(5 * 60 * 1000);
    }
    else {
        req.setTimeout(30 * 1000);
        res.setTimeout(30 * 1000);
    }
    next();
});
app.use('/api', routes_1.default);
app.use((_req, _res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
//# sourceMappingURL=app.js.map