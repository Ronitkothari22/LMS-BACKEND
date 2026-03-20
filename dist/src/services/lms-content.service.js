"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const prisma_1 = __importDefault(require("../lib/prisma"));
class LmsContentService {
    async notImplemented() {
        throw new http_exception_1.default(501, 'LMS content service not implemented yet');
    }
    async ensureLevelExists(levelId) {
        const level = await prisma_1.default.lmsLevel.findUnique({
            where: { id: levelId },
            select: { id: true },
        });
        if (!level) {
            throw new http_exception_1.default(404, 'LMS level not found');
        }
        return level;
    }
    async ensureQuestionExists(questionId) {
        const question = await prisma_1.default.lmsQuestion.findUnique({
            where: { id: questionId },
            select: { id: true, levelId: true, position: true },
        });
        if (!question) {
            throw new http_exception_1.default(404, 'LMS question not found');
        }
        return question;
    }
    async ensureContentExists(contentId) {
        const content = await prisma_1.default.lmsLevelContent.findUnique({
            where: { id: contentId },
            select: {
                id: true,
                levelId: true,
                position: true,
                type: true,
                videoSourceType: true,
                videoUrl: true,
                externalUrl: true,
            },
        });
        if (!content) {
            throw new http_exception_1.default(404, 'LMS content not found');
        }
        return content;
    }
    async shiftContentPositionsForCreate(tx, levelId, fromPosition) {
        const rows = await tx.lmsLevelContent.findMany({
            where: { levelId, position: { gte: fromPosition } },
            orderBy: { position: 'desc' },
            select: { id: true, position: true },
        });
        for (const row of rows) {
            await tx.lmsLevelContent.update({
                where: { id: row.id },
                data: { position: row.position + 1 },
            });
        }
    }
    async shiftQuestionPositionsForCreate(tx, levelId, fromPosition) {
        const rows = await tx.lmsQuestion.findMany({
            where: { levelId, position: { gte: fromPosition } },
            orderBy: { position: 'desc' },
            select: { id: true, position: true },
        });
        for (const row of rows) {
            await tx.lmsQuestion.update({
                where: { id: row.id },
                data: { position: row.position + 1 },
            });
        }
    }
    async shiftContentPositionsForMove(tx, levelId, oldPosition, newPosition) {
        if (newPosition === oldPosition)
            return;
        if (newPosition < oldPosition) {
            const rows = await tx.lmsLevelContent.findMany({
                where: { levelId, position: { gte: newPosition, lt: oldPosition } },
                orderBy: { position: 'desc' },
                select: { id: true, position: true },
            });
            for (const row of rows) {
                await tx.lmsLevelContent.update({
                    where: { id: row.id },
                    data: { position: row.position + 1 },
                });
            }
            return;
        }
        const rows = await tx.lmsLevelContent.findMany({
            where: { levelId, position: { gt: oldPosition, lte: newPosition } },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        for (const row of rows) {
            await tx.lmsLevelContent.update({
                where: { id: row.id },
                data: { position: row.position - 1 },
            });
        }
    }
    async shiftContentPositionsForDelete(tx, levelId, deletedPosition) {
        const rows = await tx.lmsLevelContent.findMany({
            where: { levelId, position: { gt: deletedPosition } },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        for (const row of rows) {
            await tx.lmsLevelContent.update({
                where: { id: row.id },
                data: { position: row.position - 1 },
            });
        }
    }
    async shiftQuestionPositionsForMove(tx, levelId, oldPosition, newPosition) {
        if (newPosition === oldPosition)
            return;
        if (newPosition < oldPosition) {
            const rows = await tx.lmsQuestion.findMany({
                where: { levelId, position: { gte: newPosition, lt: oldPosition } },
                orderBy: { position: 'desc' },
                select: { id: true, position: true },
            });
            for (const row of rows) {
                await tx.lmsQuestion.update({
                    where: { id: row.id },
                    data: { position: row.position + 1 },
                });
            }
            return;
        }
        const rows = await tx.lmsQuestion.findMany({
            where: { levelId, position: { gt: oldPosition, lte: newPosition } },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        for (const row of rows) {
            await tx.lmsQuestion.update({
                where: { id: row.id },
                data: { position: row.position - 1 },
            });
        }
    }
    async shiftQuestionPositionsForDelete(tx, levelId, deletedPosition) {
        const rows = await tx.lmsQuestion.findMany({
            where: { levelId, position: { gt: deletedPosition } },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        for (const row of rows) {
            await tx.lmsQuestion.update({
                where: { id: row.id },
                data: { position: row.position - 1 },
            });
        }
    }
    async addVideoContent(levelId, input) {
        await this.ensureLevelExists(levelId);
        if (input.videoSourceType === 'UPLOAD' && !input.videoUrl) {
            throw new http_exception_1.default(400, 'videoUrl is required when videoSourceType is UPLOAD');
        }
        if (input.videoSourceType === 'EXTERNAL_LINK' && !input.externalUrl) {
            throw new http_exception_1.default(400, 'externalUrl is required when videoSourceType is EXTERNAL_LINK');
        }
        return prisma_1.default.$transaction(async (tx) => {
            var _a;
            await this.shiftContentPositionsForCreate(tx, levelId, input.position);
            return tx.lmsLevelContent.create({
                data: {
                    levelId,
                    type: 'VIDEO',
                    title: input.title,
                    description: input.description,
                    position: input.position,
                    isRequired: (_a = input.isRequired) !== null && _a !== void 0 ? _a : true,
                    videoSourceType: input.videoSourceType,
                    videoUrl: input.videoUrl,
                    externalUrl: input.externalUrl,
                    videoDurationSeconds: input.videoDurationSeconds,
                },
            });
        });
    }
    async addReadingContent(levelId, input) {
        await this.ensureLevelExists(levelId);
        return prisma_1.default.$transaction(async (tx) => {
            var _a;
            await this.shiftContentPositionsForCreate(tx, levelId, input.position);
            return tx.lmsLevelContent.create({
                data: {
                    levelId,
                    type: 'READING',
                    title: input.title,
                    description: input.description,
                    position: input.position,
                    isRequired: (_a = input.isRequired) !== null && _a !== void 0 ? _a : false,
                    attachmentUrl: input.attachmentUrl,
                    externalUrl: input.externalUrl,
                },
            });
        });
    }
    async addQuestions(levelId, questions) {
        await this.ensureLevelExists(levelId);
        return prisma_1.default.$transaction(async (tx) => {
            var _a, _b, _c;
            const created = [];
            const sorted = [...questions].sort((a, b) => a.position - b.position);
            for (const q of sorted) {
                await this.shiftQuestionPositionsForCreate(tx, levelId, q.position);
                const createdQuestion = await tx.lmsQuestion.create({
                    data: {
                        levelId,
                        questionText: q.questionText,
                        type: q.type,
                        position: q.position,
                        isRequired: (_a = q.isRequired) !== null && _a !== void 0 ? _a : true,
                        points: (_b = q.points) !== null && _b !== void 0 ? _b : 1,
                        explanation: q.explanation,
                        options: ((_c = q.options) === null || _c === void 0 ? void 0 : _c.length)
                            ? {
                                create: q.options.map(option => {
                                    var _a;
                                    return ({
                                        optionText: option.optionText,
                                        position: option.position,
                                        isCorrect: (_a = option.isCorrect) !== null && _a !== void 0 ? _a : false,
                                    });
                                }),
                            }
                            : undefined,
                    },
                    include: {
                        options: {
                            orderBy: { position: 'asc' },
                        },
                    },
                });
                created.push(createdQuestion);
            }
            return created;
        });
    }
    async updateContent(contentId, input) {
        const existing = await this.ensureContentExists(contentId);
        return prisma_1.default.$transaction(async (tx) => {
            var _a, _b, _c;
            if (typeof input.position === 'number' && input.position !== existing.position) {
                await this.shiftContentPositionsForMove(tx, existing.levelId, existing.position, input.position);
            }
            const isVideo = existing.type === 'VIDEO';
            const finalVideoSourceType = (_a = input.videoSourceType) !== null && _a !== void 0 ? _a : existing.videoSourceType;
            const finalVideoUrl = (_b = input.videoUrl) !== null && _b !== void 0 ? _b : existing.videoUrl;
            const finalExternalUrl = (_c = input.externalUrl) !== null && _c !== void 0 ? _c : existing.externalUrl;
            if (isVideo && finalVideoSourceType === 'UPLOAD' && !finalVideoUrl) {
                throw new http_exception_1.default(400, 'videoUrl is required when videoSourceType is UPLOAD');
            }
            if (isVideo && finalVideoSourceType === 'EXTERNAL_LINK' && !finalExternalUrl) {
                throw new http_exception_1.default(400, 'externalUrl is required when videoSourceType is EXTERNAL_LINK');
            }
            return tx.lmsLevelContent.update({
                where: { id: contentId },
                data: {
                    title: input.title,
                    description: input.description,
                    position: input.position,
                    isRequired: input.isRequired,
                    videoSourceType: isVideo ? finalVideoSourceType : undefined,
                    videoUrl: isVideo
                        ? finalVideoSourceType === 'UPLOAD'
                            ? finalVideoUrl
                            : null
                        : undefined,
                    externalUrl: isVideo
                        ? finalVideoSourceType === 'EXTERNAL_LINK'
                            ? finalExternalUrl
                            : null
                        : input.externalUrl,
                    attachmentUrl: existing.type === 'READING' ? input.attachmentUrl : undefined,
                    videoDurationSeconds: isVideo ? input.videoDurationSeconds : undefined,
                },
            });
        });
    }
    async deleteContent(contentId) {
        const existing = await this.ensureContentExists(contentId);
        await prisma_1.default.$transaction(async (tx) => {
            await tx.lmsLevelContent.delete({
                where: { id: contentId },
            });
            await this.shiftContentPositionsForDelete(tx, existing.levelId, existing.position);
        });
        return { id: contentId };
    }
    async updateQuestion(questionId, input) {
        const existing = await this.ensureQuestionExists(questionId);
        return prisma_1.default.$transaction(async (tx) => {
            if (typeof input.position === 'number' && input.position !== existing.position) {
                await this.shiftQuestionPositionsForMove(tx, existing.levelId, existing.position, input.position);
            }
            const updatedQuestion = await tx.lmsQuestion.update({
                where: { id: questionId },
                data: {
                    questionText: input.questionText,
                    type: input.type,
                    position: input.position,
                    isRequired: input.isRequired,
                    points: input.points,
                    explanation: input.explanation,
                },
            });
            if (input.options) {
                await tx.lmsQuestionOption.deleteMany({
                    where: { questionId },
                });
                if (input.options.length > 0) {
                    await tx.lmsQuestionOption.createMany({
                        data: input.options.map(option => {
                            var _a;
                            return ({
                                questionId,
                                optionText: option.optionText,
                                position: option.position,
                                isCorrect: (_a = option.isCorrect) !== null && _a !== void 0 ? _a : false,
                            });
                        }),
                    });
                }
            }
            return tx.lmsQuestion.findUnique({
                where: { id: updatedQuestion.id },
                include: {
                    options: { orderBy: { position: 'asc' } },
                },
            });
        });
    }
    async deleteQuestion(questionId) {
        const existing = await this.ensureQuestionExists(questionId);
        await prisma_1.default.$transaction(async (tx) => {
            await tx.lmsQuestion.delete({
                where: { id: questionId },
            });
            await this.shiftQuestionPositionsForDelete(tx, existing.levelId, existing.position);
        });
        return { id: questionId };
    }
}
exports.default = new LmsContentService();
//# sourceMappingURL=lms-content.service.js.map