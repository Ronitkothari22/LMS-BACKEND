"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
const logger_config_1 = __importDefault(require("../config/logger.config"));
const stream_1 = require("stream");
const uploadToCloudinary = async (file, folder, contentType, originalName, onProgress) => {
    var _a;
    try {
        let resourceType = 'auto';
        if (contentType === 'VIDEO') {
            resourceType = 'video';
        }
        else if (contentType === 'IMAGE') {
            resourceType = 'image';
        }
        else if (contentType === 'PDF') {
            resourceType = 'raw';
        }
        else if (contentType === 'TEXT') {
            resourceType = 'raw';
        }
        else if (contentType === 'DOCUMENT') {
            resourceType = 'raw';
        }
        const uploadOptions = {
            folder,
            resource_type: resourceType,
            chunk_size: 6000000,
            timeout: 120000,
            eager_async: true,
            ...(onProgress && {
                progress: (bytesUploaded, totalBytes) => {
                    onProgress({
                        loaded: bytesUploaded,
                        total: totalBytes,
                        percentage: Math.round((bytesUploaded / totalBytes) * 100),
                    });
                },
            }),
        };
        if (contentType === 'DOCUMENT' && originalName) {
            const extension = (_a = originalName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            if (extension) {
                uploadOptions.use_filename = true;
                uploadOptions.unique_filename = true;
                uploadOptions.format = extension;
                if (['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(extension)) {
                    uploadOptions.flags = 'attachment';
                }
            }
        }
        if (contentType === 'PDF' && originalName) {
            uploadOptions.use_filename = true;
            uploadOptions.unique_filename = true;
            uploadOptions.flags = 'attachment';
        }
        if (originalName && !uploadOptions.use_filename) {
            uploadOptions.use_filename = true;
            uploadOptions.unique_filename = true;
        }
        logger_config_1.default.info(`Starting upload to Cloudinary - Size: ${(file.length / 1024 / 1024).toFixed(2)}MB, Type: ${contentType}`);
        const result = await uploadWithRetry(file, uploadOptions, 3);
        logger_config_1.default.info(`Upload completed successfully - Public ID: ${result.public_id}, Size: ${(result.bytes / 1024 / 1024).toFixed(2)}MB`);
        return result;
    }
    catch (error) {
        logger_config_1.default.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
async function uploadWithRetry(file, uploadOptions, maxRetries) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logger_config_1.default.info(`Upload attempt ${attempt}/${maxRetries}`);
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_config_1.default.uploader.upload_stream(uploadOptions, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                });
                const bufferStream = stream_1.Readable.from(file);
                bufferStream.pipe(uploadStream);
            });
            return result;
        }
        catch (error) {
            lastError = error;
            logger_config_1.default.warn(`Upload attempt ${attempt} failed:`, error);
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                logger_config_1.default.info(`Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}
const deleteFromCloudinary = async (publicId, contentType) => {
    try {
        let resourceType = 'raw';
        if (contentType === 'VIDEO') {
            resourceType = 'video';
        }
        else if (contentType === 'IMAGE') {
            resourceType = 'image';
        }
        const result = await cloudinary_config_1.default.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result;
    }
    catch (error) {
        logger_config_1.default.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
//# sourceMappingURL=cloudinary.service.js.map