"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromMinIO = exports.uploadToMinIO = void 0;
const minio_config_1 = require("../config/minio.config");
const client_s3_1 = require("@aws-sdk/client-s3");
const uploadToMinIO = async (file, key, contentType) => {
    await minio_config_1.minioClient.send(new client_s3_1.PutObjectCommand({
        Bucket: minio_config_1.MINIO_BUCKET,
        Key: key,
        Body: file,
        ContentType: contentType,
    }));
    return {
        url: `${process.env.MINIO_ENDPOINT}/${minio_config_1.MINIO_BUCKET}/${key}`,
        key,
    };
};
exports.uploadToMinIO = uploadToMinIO;
const deleteFromMinIO = async (key) => {
    await minio_config_1.minioClient.send(new client_s3_1.DeleteObjectCommand({
        Bucket: minio_config_1.MINIO_BUCKET,
        Key: key,
    }));
};
exports.deleteFromMinIO = deleteFromMinIO;
//# sourceMappingURL=minio.service.js.map