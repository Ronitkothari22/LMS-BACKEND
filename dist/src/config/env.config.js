"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const envalid_1 = require("envalid");
exports.env = (0, envalid_1.cleanEnv)(process.env, {
    NODE_ENV: (0, envalid_1.str)({ choices: ['development', 'test', 'production'], default: 'development' }),
    PORT: (0, envalid_1.port)({ default: 3000 }),
    DATABASE_URL: (0, envalid_1.str)(),
    JWT_ACCESS_SECRET: (0, envalid_1.str)(),
    JWT_REFRESH_SECRET: (0, envalid_1.str)(),
    JWT_ACCESS_EXPIRES_IN: (0, envalid_1.str)({ default: '15m' }),
    JWT_REFRESH_EXPIRES_IN: (0, envalid_1.str)({ default: '7d' }),
    RATE_LIMIT_MAX: (0, envalid_1.num)({ default: 100 }),
    RATE_LIMIT_WINDOW_MS: (0, envalid_1.num)({ default: 15 * 60 * 1000 }),
    isProduction: (0, envalid_1.bool)({ default: process.env.NODE_ENV === 'production' }),
    CLOUDINARY_CLOUD_NAME: (0, envalid_1.str)({ default: '' }),
    CLOUDINARY_API_KEY: (0, envalid_1.str)({ default: '' }),
    CLOUDINARY_API_SECRET: (0, envalid_1.str)({ default: '' }),
});
//# sourceMappingURL=env.config.js.map