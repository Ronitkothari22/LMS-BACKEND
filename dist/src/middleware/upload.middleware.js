"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizWithImagesUpload = exports.quizImageUpload = exports.largeContentUpload = exports.contentUpload = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const storage = multer_1.default.memoryStorage();
const csvFileFilter = (_req, file, cb) => {
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
    }
    else {
        cb(new http_exception_1.default(400, 'Only CSV and Excel files are allowed'));
    }
};
const contentFileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    }
    else if (file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        file.mimetype === 'application/vnd.ms-powerpoint') {
        cb(null, true);
    }
    else if (file.mimetype === 'text/plain' ||
        file.mimetype === 'text/markdown' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    }
    else if (file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
    }
    else {
        cb(new http_exception_1.default(400, 'Only images, videos, PDFs, PowerPoint presentations, Word documents, Excel files, and CSV files are allowed'));
    }
};
const quizImageFileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new http_exception_1.default(400, 'Only image files are allowed for quiz questions'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter: csvFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
exports.contentUpload = (0, multer_1.default)({
    storage,
    fileFilter: contentFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
        fieldSize: 25 * 1024 * 1024,
    },
});
exports.largeContentUpload = (0, multer_1.default)({
    storage,
    fileFilter: contentFileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024,
        fieldSize: 25 * 1024 * 1024,
    },
});
exports.quizImageUpload = (0, multer_1.default)({
    storage,
    fileFilter: quizImageFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});
exports.quizWithImagesUpload = (0, multer_1.default)({
    storage,
    fileFilter: quizImageFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 20,
    },
});
//# sourceMappingURL=upload.middleware.js.map