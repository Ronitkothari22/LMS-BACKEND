"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const env_config_1 = require("./env.config");
const logger_config_1 = __importDefault(require("./logger.config"));
cloudinary_1.v2.config({
    cloud_name: env_config_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_config_1.env.CLOUDINARY_API_KEY,
    api_secret: env_config_1.env.CLOUDINARY_API_SECRET,
    secure: true,
    chunk_size: 6000000,
    timeout: 120000,
});
const initCloudinary = () => {
    try {
        logger_config_1.default.info('Cloudinary initialized successfully with optimized settings');
    }
    catch (error) {
        logger_config_1.default.error('Error initializing Cloudinary:', error);
    }
};
exports.initCloudinary = initCloudinary;
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.config.js.map