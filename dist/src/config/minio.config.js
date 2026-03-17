"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINIO_BUCKET = exports.minioClient = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
exports.minioClient = new client_s3_1.S3Client({
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'admin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'YourStrongPass123',
    },
    forcePathStyle: true,
});
exports.MINIO_BUCKET = process.env.MINIO_BUCKET || 'joining-dots-content';
//# sourceMappingURL=minio.config.js.map