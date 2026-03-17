"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadContent = exports.deleteContent = exports.updateContent = exports.getSessionContent = exports.getContentById = exports.uploadContent = void 0;
const client_1 = require("@prisma/client");
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const logger_config_1 = __importDefault(require("../config/logger.config"));
const cloudinary_service_1 = require("../services/cloudinary.service");
const minio_service_1 = require("../services/minio.service");
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const client_s3_1 = require("@aws-sdk/client-s3");
const minio_config_1 = require("../config/minio.config");
const prisma = new client_1.PrismaClient();
const uploadContent = async (req, res, next) => {
    var _a, _b;
    try {
        logger_config_1.default.info('Request body:', req.body);
        logger_config_1.default.info('Request file:', req.file);
        const { title, sessionId, type } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const file = req.file;
        if (!file) {
            throw new http_exception_1.default(400, 'No file uploaded');
        }
        if (!title || !sessionId) {
            throw new http_exception_1.default(400, 'Title and sessionId are required');
        }
        const fileSizeInMB = file.size / (1024 * 1024);
        const isLargeFile = fileSizeInMB > 10;
        logger_config_1.default.info(`Processing file upload - Size: ${fileSizeInMB.toFixed(2)}MB, Large file: ${isLargeFile}`);
        let contentType;
        if (type && Object.values(client_1.ContentType).includes(type)) {
            contentType = type;
        }
        else {
            if (file.mimetype.startsWith('image/')) {
                contentType = 'IMAGE';
            }
            else if (file.mimetype.startsWith('video/')) {
                contentType = 'VIDEO';
            }
            else if (file.mimetype === 'application/pdf') {
                contentType = 'PDF';
            }
            else if (file.mimetype ===
                'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                file.mimetype === 'application/vnd.ms-powerpoint') {
                contentType = 'DOCUMENT';
            }
            else if (file.mimetype ===
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.mimetype === 'application/msword') {
                contentType = 'DOCUMENT';
            }
            else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.mimetype === 'application/vnd.ms-excel' ||
                file.mimetype === 'text/csv') {
                contentType = 'DOCUMENT';
            }
            else {
                contentType = 'TEXT';
            }
        }
        const folder = `sessions/${sessionId}/content`;
        const useMinio = process.env.STORAGE_PROVIDER === 'minio';
        if (isLargeFile) {
            processLargeFileUpload(file, folder, contentType, title, sessionId, userId, useMinio);
            res.status(202).json({
                message: 'Large file upload initiated. Processing in background...',
                status: 'processing',
                fileSize: `${fileSizeInMB.toFixed(2)}MB`,
                estimatedTime: `${Math.ceil(fileSizeInMB / 5)} minutes`,
            });
        }
        else {
            let uploadResult;
            if (useMinio) {
                const key = `${folder}/${file.originalname}`;
                uploadResult = await (0, minio_service_1.uploadToMinIO)(file.buffer, key, file.mimetype);
            }
            else {
                uploadResult = await (0, cloudinary_service_1.uploadToCloudinary)(file.buffer, folder, contentType, file.originalname);
            }
            const content = await prisma.content.create({
                data: {
                    title,
                    url: uploadResult.url,
                    type: contentType,
                    session: {
                        connect: {
                            id: sessionId,
                        },
                    },
                    canEdit: {
                        connect: {
                            id: userId,
                        },
                    },
                },
                include: {
                    session: {
                        select: {
                            title: true,
                        },
                    },
                },
            });
            res.status(201).json({
                message: 'Content uploaded successfully',
                content: {
                    id: content.id,
                    title: content.title,
                    url: content.url,
                    type: content.type,
                    sessionId: content.sessionId,
                    sessionTitle: (_b = content.session) === null || _b === void 0 ? void 0 : _b.title,
                    createdAt: content.createdAt,
                },
            });
        }
    }
    catch (error) {
        logger_config_1.default.error('Error uploading content:', error);
        next(error);
    }
};
exports.uploadContent = uploadContent;
async function processLargeFileUpload(file, folder, contentType, title, sessionId, userId, useMinio = false) {
    try {
        logger_config_1.default.info(`Starting background processing for large file: ${title}`);
        let uploadResult;
        if (useMinio) {
            const key = `${folder}/${file.originalname}`;
            uploadResult = await (0, minio_service_1.uploadToMinIO)(file.buffer, key, file.mimetype);
        }
        else {
            uploadResult = await (0, cloudinary_service_1.uploadToCloudinary)(file.buffer, folder, contentType, file.originalname, progress => {
                logger_config_1.default.info(`Upload progress for ${title}: ${progress.percentage}%`);
            });
        }
        const content = await prisma.content.create({
            data: {
                title,
                url: uploadResult.url,
                type: contentType,
                session: {
                    connect: {
                        id: sessionId,
                    },
                },
                canEdit: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        logger_config_1.default.info(`Large file upload completed successfully: ${title} (ID: ${content.id})`);
    }
    catch (error) {
        logger_config_1.default.error(`Error processing large file upload for ${title}:`, error);
    }
}
const getContentById = async (req, res, next) => {
    try {
        const { contentId } = req.params;
        const id = Array.isArray(contentId) ? contentId[0] : contentId;
        const content = await prisma.content.findUnique({
            where: { id },
            include: {
                session: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                canView: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                canEdit: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!content) {
            throw new http_exception_1.default(404, 'Content not found');
        }
        res.status(200).json({
            content,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error getting content:', error);
        next(error);
    }
};
exports.getContentById = getContentById;
const getSessionContent = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { page = 1, limit = 10, type } = req.query;
        const where = {
            sessionId: Array.isArray(sessionId) ? sessionId[0] : sessionId,
        };
        if (type &&
            typeof type === 'string' &&
            Object.values(client_1.ContentType).includes(type)) {
            where.type = type;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const totalCount = await prisma.content.count({ where });
        const content = await prisma.content.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                canView: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                canEdit: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        res.status(200).json({
            content,
            pagination: {
                total: totalCount,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(totalCount / Number(limit)),
            },
        });
    }
    catch (error) {
        logger_config_1.default.error('Error getting session content:', error);
        next(error);
    }
};
exports.getSessionContent = getSessionContent;
const updateContent = async (req, res, next) => {
    try {
        const { contentId } = req.params;
        const id = Array.isArray(contentId) ? contentId[0] : contentId;
        const { title, canView, canEdit } = req.body;
        const updateData = {};
        if (title)
            updateData.title = title;
        const content = await prisma.content.update({
            where: { id },
            data: {
                ...updateData,
                ...(canView && {
                    canView: {
                        set: [],
                        connect: canView.map((id) => ({ id })),
                    },
                }),
                ...(canEdit && {
                    canEdit: {
                        set: [],
                        connect: canEdit.map((id) => ({ id })),
                    },
                }),
            },
            include: {
                session: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                canView: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                canEdit: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        res.status(200).json({
            message: 'Content updated successfully',
            content,
        });
    }
    catch (error) {
        logger_config_1.default.error('Error updating content:', error);
        next(error);
    }
};
exports.updateContent = updateContent;
const deleteContent = async (req, res, next) => {
    try {
        const { contentId } = req.params;
        const id = Array.isArray(contentId) ? contentId[0] : contentId;
        const content = await prisma.content.findUnique({
            where: { id },
        });
        if (!content) {
            throw new http_exception_1.default(404, 'Content not found');
        }
        const useMinio = process.env.STORAGE_PROVIDER === 'minio';
        if (useMinio) {
            const url = content.url;
            const bucketUrl = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET || 'joining-dots-content'}/`;
            const key = url.startsWith(bucketUrl) ? url.substring(bucketUrl.length) : url;
            await (0, minio_service_1.deleteFromMinIO)(key);
        }
        else {
            const urlParts = content.url.split('/');
            const publicIdWithExtension = urlParts[urlParts.length - 1];
            const publicId = publicIdWithExtension.split('.')[0];
            const folderPath = urlParts[urlParts.length - 2];
            const fullPublicId = `${folderPath}/${publicId}`;
            await (0, cloudinary_service_1.deleteFromCloudinary)(fullPublicId, content.type);
        }
        await prisma.content.delete({
            where: { id },
        });
        res.status(200).json({
            message: 'Content deleted successfully',
        });
    }
    catch (error) {
        logger_config_1.default.error('Error deleting content:', error);
        next(error);
    }
};
exports.deleteContent = deleteContent;
const downloadContent = async (req, res, next) => {
    try {
        const { contentId } = req.params;
        const id = Array.isArray(contentId) ? contentId[0] : contentId;
        const content = await prisma.content.findUnique({
            where: { id },
            include: {
                session: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        if (!content) {
            throw new http_exception_1.default(404, 'Content not found');
        }
        const originalFilename = content.title;
        let fileExtension = '';
        if (content.type === 'PDF') {
            fileExtension = '.pdf';
        }
        else if (content.type === 'IMAGE') {
            const urlParts = content.url.split('.');
            const lastPart = urlParts[urlParts.length - 1];
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(lastPart.toLowerCase())) {
                fileExtension = `.${lastPart.toLowerCase()}`;
            }
            else {
                fileExtension = '.jpg';
            }
        }
        else if (content.type === 'VIDEO') {
            const urlParts = content.url.split('.');
            const lastPart = urlParts[urlParts.length - 1];
            if (['mp4', 'avi', 'mov', 'webm'].includes(lastPart.toLowerCase())) {
                fileExtension = `.${lastPart.toLowerCase()}`;
            }
            else {
                fileExtension = '.mp4';
            }
        }
        else if (content.type === 'DOCUMENT') {
            const urlParts = content.url.split('.');
            const lastPart = urlParts[urlParts.length - 1];
            if (['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(lastPart.toLowerCase())) {
                fileExtension = `.${lastPart.toLowerCase()}`;
            }
            else {
                fileExtension = '.docx';
            }
        }
        else if (content.type === 'TEXT') {
            fileExtension = '.txt';
        }
        const filename = originalFilename.includes('.')
            ? originalFilename
            : `${originalFilename}${fileExtension}`;
        let mimeType = 'application/octet-stream';
        if (content.type === 'PDF') {
            mimeType = 'application/pdf';
        }
        else if (content.type === 'IMAGE') {
            if (fileExtension.includes('png'))
                mimeType = 'image/png';
            else if (fileExtension.includes('gif'))
                mimeType = 'image/gif';
            else
                mimeType = 'image/jpeg';
        }
        else if (content.type === 'VIDEO') {
            if (fileExtension.includes('mp4'))
                mimeType = 'video/mp4';
            else if (fileExtension.includes('webm'))
                mimeType = 'video/webm';
            else
                mimeType = 'video/mp4';
        }
        else if (content.type === 'DOCUMENT') {
            if (fileExtension.includes('docx'))
                mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (fileExtension.includes('doc'))
                mimeType = 'application/msword';
            else if (fileExtension.includes('pptx'))
                mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            else if (fileExtension.includes('ppt'))
                mimeType = 'application/vnd.ms-powerpoint';
            else if (fileExtension.includes('xlsx'))
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            else if (fileExtension.includes('xls'))
                mimeType = 'application/vnd.ms-excel';
            else if (fileExtension.includes('csv'))
                mimeType = 'text/csv';
        }
        else if (content.type === 'TEXT') {
            mimeType = 'text/plain';
        }
        logger_config_1.default.info(`Downloading content: ${content.title} (${content.type}) - ${filename}`);
        const useMinio = process.env.STORAGE_PROVIDER === 'minio';
        if (useMinio) {
            const url = content.url;
            const bucketUrl = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET || 'joining-dots-content'}/`;
            const key = url.startsWith(bucketUrl) ? url.substring(bucketUrl.length) : url;
            const command = new client_s3_1.GetObjectCommand({
                Bucket: minio_config_1.MINIO_BUCKET,
                Key: key,
            });
            const data = await minio_config_1.minioClient.send(command);
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Cache-Control', 'no-cache');
            const stream = data.Body;
            if (stream && typeof stream.pipe === 'function') {
                stream.pipe(res);
            }
            else {
                let chunks = [];
                for await (const chunk of data.Body) {
                    chunks.push(chunk);
                }
                res.end(Buffer.concat(chunks));
            }
            return;
        }
        const protocol = content.url.startsWith('https:') ? https_1.default : http_1.default;
        protocol
            .get(content.url, (fileStream) => {
            if (fileStream.statusCode !== 200) {
                throw new http_exception_1.default(404, 'File not found on server');
            }
            fileStream.pipe(res);
            fileStream.on('error', (error) => {
                logger_config_1.default.error('Error streaming file:', error);
                if (!res.headersSent) {
                    next(new http_exception_1.default(500, 'Error downloading file'));
                }
            });
            res.on('error', (error) => {
                logger_config_1.default.error('Error in response stream:', error);
                fileStream.destroy();
            });
        })
            .on('error', (error) => {
            logger_config_1.default.error('Error fetching file from Cloudinary:', error);
            next(new http_exception_1.default(500, 'Error fetching file'));
        });
    }
    catch (error) {
        logger_config_1.default.error('Error in download endpoint:', error);
        next(error);
    }
};
exports.downloadContent = downloadContent;
//# sourceMappingURL=content.controller.js.map