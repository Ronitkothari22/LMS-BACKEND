"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
class LmsTopicService {
    async ensureTopicExists(topicId) {
        const topic = await prisma_1.default.lmsTopic.findUnique({
            where: { id: topicId },
            select: { id: true, title: true },
        });
        if (!topic) {
            throw new http_exception_1.default(404, 'LMS topic not found');
        }
        return topic;
    }
    async ensureLevelExists(levelId) {
        const level = await prisma_1.default.lmsLevel.findUnique({
            where: { id: levelId },
            select: { id: true, topicId: true, position: true, title: true },
        });
        if (!level) {
            throw new http_exception_1.default(404, 'LMS level not found');
        }
        return level;
    }
    async shiftForCreate(tx, topicId, fromPosition) {
        const toShift = await tx.lmsLevel.findMany({
            where: {
                topicId,
                position: { gte: fromPosition },
            },
            orderBy: { position: 'desc' },
            select: { id: true, position: true },
        });
        for (const row of toShift) {
            await tx.lmsLevel.update({
                where: { id: row.id },
                data: { position: row.position + 1 },
            });
        }
    }
    async shiftForMove(tx, topicId, oldPosition, newPosition) {
        if (newPosition === oldPosition)
            return;
        if (newPosition < oldPosition) {
            const toShiftUp = await tx.lmsLevel.findMany({
                where: {
                    topicId,
                    position: { gte: newPosition, lt: oldPosition },
                },
                orderBy: { position: 'desc' },
                select: { id: true, position: true },
            });
            for (const row of toShiftUp) {
                await tx.lmsLevel.update({
                    where: { id: row.id },
                    data: { position: row.position + 1 },
                });
            }
            return;
        }
        const toShiftDown = await tx.lmsLevel.findMany({
            where: {
                topicId,
                position: { gt: oldPosition, lte: newPosition },
            },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        for (const row of toShiftDown) {
            await tx.lmsLevel.update({
                where: { id: row.id },
                data: { position: row.position - 1 },
            });
        }
    }
    async shiftForDelete(tx, topicId, deletedPosition) {
        const toShift = await tx.lmsLevel.findMany({
            where: {
                topicId,
                position: { gt: deletedPosition },
            },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        for (const row of toShift) {
            await tx.lmsLevel.update({
                where: { id: row.id },
                data: { position: row.position - 1 },
            });
        }
    }
    async notImplemented() {
        throw new http_exception_1.default(501, 'LMS topic service not implemented yet');
    }
    async createTopic(input, createdById) {
        return prisma_1.default.lmsTopic.create({
            data: {
                ...input,
                createdById,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        levels: true,
                    },
                },
            },
        });
    }
    async getTopics(filters) {
        return prisma_1.default.lmsTopic.findMany({
            where: {
                ...(typeof filters.isPublished === 'boolean' ? { isPublished: filters.isPublished } : {}),
                ...(filters.includeInactive ? {} : { isActive: true }),
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        levels: true,
                    },
                },
            },
            orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async getTopicById(topicId) {
        const topic = await prisma_1.default.lmsTopic.findUnique({
            where: { id: topicId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                levels: {
                    orderBy: {
                        position: 'asc',
                    },
                    include: {
                        contents: {
                            orderBy: {
                                position: 'asc',
                            },
                        },
                        questions: {
                            orderBy: {
                                position: 'asc',
                            },
                            include: {
                                options: {
                                    orderBy: {
                                        position: 'asc',
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                contents: true,
                                questions: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        levels: true,
                    },
                },
            },
        });
        if (!topic) {
            throw new http_exception_1.default(404, 'LMS topic not found');
        }
        return topic;
    }
    async updateTopic(topicId, input) {
        await this.getTopicById(topicId);
        return prisma_1.default.lmsTopic.update({
            where: { id: topicId },
            data: input,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        levels: true,
                    },
                },
            },
        });
    }
    async deleteTopic(topicId) {
        await this.getTopicById(topicId);
        await prisma_1.default.lmsTopic.delete({
            where: { id: topicId },
        });
        return { id: topicId };
    }
    async createLevel(topicId, input) {
        await this.ensureTopicExists(topicId);
        try {
            return await prisma_1.default.$transaction(async (tx) => {
                await this.shiftForCreate(tx, topicId, input.position);
                return tx.lmsLevel.create({
                    data: {
                        topicId,
                        ...input,
                    },
                    include: {
                        _count: {
                            select: {
                                contents: true,
                                questions: true,
                            },
                        },
                    },
                });
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new http_exception_1.default(400, 'Level position already exists in this topic');
            }
            throw error;
        }
    }
    async updateLevel(levelId, input) {
        const existing = await this.ensureLevelExists(levelId);
        try {
            return await prisma_1.default.$transaction(async (tx) => {
                if (typeof input.position === 'number' && input.position !== existing.position) {
                    await this.shiftForMove(tx, existing.topicId, existing.position, input.position);
                }
                return tx.lmsLevel.update({
                    where: { id: levelId },
                    data: input,
                    include: {
                        _count: {
                            select: {
                                contents: true,
                                questions: true,
                            },
                        },
                    },
                });
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new http_exception_1.default(400, 'Level position already exists in this topic');
            }
            throw error;
        }
    }
    async deleteLevel(levelId) {
        const existing = await this.ensureLevelExists(levelId);
        await prisma_1.default.$transaction(async (tx) => {
            await tx.lmsLevel.delete({
                where: { id: levelId },
            });
            await this.shiftForDelete(tx, existing.topicId, existing.position);
        });
        return { id: levelId };
    }
    async setTopicPublishState(topicId, isPublished) {
        await this.getTopicById(topicId);
        return prisma_1.default.lmsTopic.update({
            where: { id: topicId },
            data: { isPublished },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        levels: true,
                    },
                },
            },
        });
    }
}
exports.default = new LmsTopicService();
//# sourceMappingURL=lms-topic.service.js.map