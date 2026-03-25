"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
class LmsTopicService {
    normalizeSessionIds(sessionId, sessionIds) {
        const merged = [
            ...(sessionId ? [sessionId] : []),
            ...(sessionIds || []).filter(Boolean),
        ];
        return Array.from(new Set(merged));
    }
    sanitizeLevelRules(input) {
        var _a;
        if (input.requireVideoCompletion && ((_a = input.minVideoWatchPercent) !== null && _a !== void 0 ? _a : 0) <= 0) {
            return {
                ...input,
                minVideoWatchPercent: 100,
            };
        }
        return input;
    }
    async resolveVisibilityInput(visibility, sessionId, sessionIds, options) {
        var _a;
        const includeSessionIds = (_a = options === null || options === void 0 ? void 0 : options.includeSessionIds) !== null && _a !== void 0 ? _a : false;
        if (visibility === 'ALL') {
            return includeSessionIds
                ? { visibility, sessionId: null, sessionIds: [] }
                : { visibility, sessionId: null };
        }
        const targetSessionIds = this.normalizeSessionIds(sessionId, sessionIds);
        if (visibility === 'SESSION' || (typeof visibility === 'undefined' && targetSessionIds.length > 0)) {
            if (targetSessionIds.length === 0) {
                throw new http_exception_1.default(400, 'sessionId or sessionIds is required when visibility is SESSION');
            }
            const sessions = await prisma_1.default.session.findMany({
                where: { id: { in: targetSessionIds } },
                select: { id: true },
            });
            if (sessions.length !== targetSessionIds.length) {
                throw new http_exception_1.default(400, 'One or more assigned sessions were not found');
            }
            return {
                visibility: visibility || 'SESSION',
                sessionId: targetSessionIds[0] || null,
                ...(includeSessionIds ? { sessionIds: targetSessionIds } : {}),
            };
        }
        if (sessionId === null) {
            return includeSessionIds ? { sessionId: null, sessionIds: [] } : { sessionId: null };
        }
        if (includeSessionIds && sessionIds === null) {
            return { sessionIds: [] };
        }
        return {};
    }
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
        const resolvedVisibility = await this.resolveVisibilityInput(input.visibility, input.sessionId, input.sessionIds, { includeSessionIds: true });
        const { sessionIds: resolvedSessionIds, ...resolvedTopicVisibility } = resolvedVisibility;
        return prisma_1.default.lmsTopic.create({
            data: {
                title: input.title,
                description: input.description,
                slug: input.slug,
                visibility: input.visibility,
                isPublished: input.isPublished,
                position: input.position,
                estimatedDurationMinutes: input.estimatedDurationMinutes,
                ...resolvedTopicVisibility,
                createdById,
                ...(typeof resolvedSessionIds !== 'undefined'
                    ? {
                        sessionAssignments: {
                            createMany: {
                                data: resolvedSessionIds.map(sessionId => ({ sessionId })),
                                skipDuplicates: true,
                            },
                        },
                    }
                    : {}),
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
                sessionAssignments: {
                    include: {
                        session: {
                            select: {
                                id: true,
                                title: true,
                                isActive: true,
                            },
                        },
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
                sessionAssignments: {
                    include: {
                        session: {
                            select: {
                                id: true,
                                title: true,
                                isActive: true,
                            },
                        },
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
                sessionAssignments: {
                    include: {
                        session: {
                            select: {
                                id: true,
                                title: true,
                                isActive: true,
                            },
                        },
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
        var _a;
        const existingTopic = await prisma_1.default.lmsTopic.findUnique({
            where: { id: topicId },
            select: {
                id: true,
                visibility: true,
                sessionId: true,
                sessionAssignments: {
                    select: { sessionId: true },
                },
            },
        });
        if (!existingTopic) {
            throw new http_exception_1.default(404, 'LMS topic not found');
        }
        const existingSessionIds = this.normalizeSessionIds(existingTopic.sessionId, existingTopic.sessionAssignments.map(assignment => assignment.sessionId));
        const nextVisibility = (_a = input.visibility) !== null && _a !== void 0 ? _a : existingTopic.visibility;
        const nextSessionId = typeof input.sessionId !== 'undefined' ? input.sessionId : existingTopic.sessionId;
        const nextSessionIds = typeof input.sessionIds !== 'undefined' ? input.sessionIds : existingSessionIds;
        const resolvedVisibility = await this.resolveVisibilityInput(nextVisibility, nextSessionId, nextSessionIds, { includeSessionIds: true });
        const { sessionIds: resolvedSessionIds, ...resolvedTopicVisibility } = resolvedVisibility;
        return prisma_1.default.lmsTopic.update({
            where: { id: topicId },
            data: {
                title: input.title,
                description: input.description,
                slug: input.slug,
                visibility: input.visibility,
                isPublished: input.isPublished,
                isActive: input.isActive,
                position: input.position,
                estimatedDurationMinutes: input.estimatedDurationMinutes,
                ...resolvedTopicVisibility,
                ...(typeof resolvedSessionIds !== 'undefined'
                    ? {
                        sessionAssignments: {
                            deleteMany: {},
                            ...(resolvedSessionIds.length
                                ? {
                                    createMany: {
                                        data: resolvedSessionIds.map(sessionId => ({ sessionId })),
                                        skipDuplicates: true,
                                    },
                                }
                                : {}),
                        },
                    }
                    : {}),
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
                sessionAssignments: {
                    include: {
                        session: {
                            select: {
                                id: true,
                                title: true,
                                isActive: true,
                            },
                        },
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
        const sanitizedInput = this.sanitizeLevelRules(input);
        const resolvedLevelVisibility = await this.resolveVisibilityInput(sanitizedInput.visibility, sanitizedInput.sessionId);
        try {
            return await prisma_1.default.$transaction(async (tx) => {
                await this.shiftForCreate(tx, topicId, sanitizedInput.position);
                return tx.lmsLevel.create({
                    data: {
                        topicId,
                        ...sanitizedInput,
                        ...resolvedLevelVisibility,
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
        var _a;
        const existing = await this.ensureLevelExists(levelId);
        const sanitizedInput = this.sanitizeLevelRules(input);
        const existingLevel = await prisma_1.default.lmsLevel.findUnique({
            where: { id: levelId },
            select: { visibility: true, sessionId: true },
        });
        const nextVisibility = (_a = sanitizedInput.visibility) !== null && _a !== void 0 ? _a : existingLevel === null || existingLevel === void 0 ? void 0 : existingLevel.visibility;
        const nextSessionId = typeof sanitizedInput.sessionId !== 'undefined'
            ? sanitizedInput.sessionId
            : existingLevel === null || existingLevel === void 0 ? void 0 : existingLevel.sessionId;
        const resolvedLevelVisibility = await this.resolveVisibilityInput(nextVisibility, nextSessionId);
        try {
            return await prisma_1.default.$transaction(async (tx) => {
                if (typeof sanitizedInput.position === 'number' && sanitizedInput.position !== existing.position) {
                    await this.shiftForMove(tx, existing.topicId, existing.position, sanitizedInput.position);
                }
                return tx.lmsLevel.update({
                    where: { id: levelId },
                    data: {
                        ...sanitizedInput,
                        ...resolvedLevelVisibility,
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
                sessionAssignments: {
                    include: {
                        session: {
                            select: {
                                id: true,
                                title: true,
                                isActive: true,
                            },
                        },
                    },
                },
            },
        });
    }
}
exports.default = new LmsTopicService();
//# sourceMappingURL=lms-topic.service.js.map