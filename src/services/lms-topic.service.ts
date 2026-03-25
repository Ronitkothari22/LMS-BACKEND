import HttpException from '../utils/http-exception';
import prisma from '../lib/prisma';
import type { CreateLmsTopicInput, UpdateLmsTopicInput } from '../types/lms.types';
import type { CreateLmsLevelInput, UpdateLmsLevelInput } from '../types/lms.types';
import { Prisma } from '@prisma/client';

class LmsTopicService {
  private normalizeSessionIds(
    sessionId?: string | null,
    sessionIds?: string[] | null,
  ): string[] {
    const merged = [
      ...(sessionId ? [sessionId] : []),
      ...((sessionIds || []).filter(Boolean) as string[]),
    ];

    return Array.from(new Set(merged));
  }

  private sanitizeLevelRules<T extends CreateLmsLevelInput | UpdateLmsLevelInput>(input: T): T {
    if (input.requireVideoCompletion && (input.minVideoWatchPercent ?? 0) <= 0) {
      return {
        ...input,
        minVideoWatchPercent: 100,
      };
    }

    return input;
  }

  private async resolveVisibilityInput(
    visibility?: 'ALL' | 'SESSION',
    sessionId?: string | null,
    sessionIds?: string[] | null,
    options?: { includeSessionIds?: boolean },
  ): Promise<{ visibility?: 'ALL' | 'SESSION'; sessionId?: string | null; sessionIds?: string[] }> {
    const includeSessionIds = options?.includeSessionIds ?? false;

    if (visibility === 'ALL') {
      return includeSessionIds
        ? { visibility, sessionId: null, sessionIds: [] }
        : { visibility, sessionId: null };
    }

    const targetSessionIds = this.normalizeSessionIds(sessionId, sessionIds);

    if (visibility === 'SESSION' || (typeof visibility === 'undefined' && targetSessionIds.length > 0)) {
      if (targetSessionIds.length === 0) {
        throw new HttpException(400, 'sessionId or sessionIds is required when visibility is SESSION');
      }

      const sessions = await prisma.session.findMany({
        where: { id: { in: targetSessionIds } },
        select: { id: true },
      });

      if (sessions.length !== targetSessionIds.length) {
        throw new HttpException(400, 'One or more assigned sessions were not found');
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

  private async ensureTopicExists(topicId: string) {
    const topic = await prisma.lmsTopic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true },
    });

    if (!topic) {
      throw new HttpException(404, 'LMS topic not found');
    }

    return topic;
  }

  private async ensureLevelExists(levelId: string) {
    const level = await prisma.lmsLevel.findUnique({
      where: { id: levelId },
      select: { id: true, topicId: true, position: true, title: true },
    });

    if (!level) {
      throw new HttpException(404, 'LMS level not found');
    }

    return level;
  }

  private async shiftForCreate(
    tx: Prisma.TransactionClient,
    topicId: string,
    fromPosition: number,
  ): Promise<void> {
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

  private async shiftForMove(
    tx: Prisma.TransactionClient,
    topicId: string,
    oldPosition: number,
    newPosition: number,
  ): Promise<void> {
    if (newPosition === oldPosition) return;

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

  private async shiftForDelete(
    tx: Prisma.TransactionClient,
    topicId: string,
    deletedPosition: number,
  ): Promise<void> {
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

  async notImplemented(): Promise<never> {
    throw new HttpException(501, 'LMS topic service not implemented yet');
  }

  async createTopic(input: CreateLmsTopicInput, createdById: string) {
    const resolvedVisibility = await this.resolveVisibilityInput(
      input.visibility,
      input.sessionId,
      input.sessionIds,
      { includeSessionIds: true },
    );
    const { sessionIds: resolvedSessionIds, ...resolvedTopicVisibility } = resolvedVisibility;

    return prisma.lmsTopic.create({
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

  async getTopics(filters: { isPublished?: boolean; includeInactive?: boolean }) {
    return prisma.lmsTopic.findMany({
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

  async getTopicById(topicId: string) {
    const topic = await prisma.lmsTopic.findUnique({
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
      throw new HttpException(404, 'LMS topic not found');
    }

    return topic;
  }

  async updateTopic(topicId: string, input: UpdateLmsTopicInput) {
    const existingTopic = await prisma.lmsTopic.findUnique({
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
      throw new HttpException(404, 'LMS topic not found');
    }

    const existingSessionIds = this.normalizeSessionIds(
      existingTopic.sessionId,
      existingTopic.sessionAssignments.map(assignment => assignment.sessionId),
    );
    const nextVisibility = input.visibility ?? existingTopic.visibility;
    const nextSessionId =
      typeof input.sessionId !== 'undefined' ? input.sessionId : existingTopic.sessionId;
    const nextSessionIds =
      typeof input.sessionIds !== 'undefined' ? input.sessionIds : existingSessionIds;
    const resolvedVisibility = await this.resolveVisibilityInput(
      nextVisibility,
      nextSessionId,
      nextSessionIds,
      { includeSessionIds: true },
    );
    const { sessionIds: resolvedSessionIds, ...resolvedTopicVisibility } = resolvedVisibility;

    return prisma.lmsTopic.update({
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

  async deleteTopic(topicId: string) {
    await this.getTopicById(topicId);

    await prisma.lmsTopic.delete({
      where: { id: topicId },
    });

    return { id: topicId };
  }

  async createLevel(topicId: string, input: CreateLmsLevelInput) {
    await this.ensureTopicExists(topicId);
    const sanitizedInput = this.sanitizeLevelRules(input);
    const resolvedLevelVisibility = await this.resolveVisibilityInput(
      sanitizedInput.visibility,
      sanitizedInput.sessionId,
    );

    try {
      return await prisma.$transaction(async tx => {
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpException(400, 'Level position already exists in this topic');
      }
      throw error;
    }
  }

  async updateLevel(levelId: string, input: UpdateLmsLevelInput) {
    const existing = await this.ensureLevelExists(levelId);
    const sanitizedInput = this.sanitizeLevelRules(input);
    const existingLevel = await prisma.lmsLevel.findUnique({
      where: { id: levelId },
      select: { visibility: true, sessionId: true },
    });
    const nextVisibility = sanitizedInput.visibility ?? existingLevel?.visibility;
    const nextSessionId =
      typeof sanitizedInput.sessionId !== 'undefined'
        ? sanitizedInput.sessionId
        : existingLevel?.sessionId;
    const resolvedLevelVisibility = await this.resolveVisibilityInput(nextVisibility, nextSessionId);

    try {
      return await prisma.$transaction(async tx => {
        if (typeof sanitizedInput.position === 'number' && sanitizedInput.position !== existing.position) {
          await this.shiftForMove(
            tx,
            existing.topicId,
            existing.position,
            sanitizedInput.position,
          );
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpException(400, 'Level position already exists in this topic');
      }
      throw error;
    }
  }

  async deleteLevel(levelId: string) {
    const existing = await this.ensureLevelExists(levelId);

    await prisma.$transaction(async tx => {
      await tx.lmsLevel.delete({
        where: { id: levelId },
      });

      await this.shiftForDelete(tx, existing.topicId, existing.position);
    });

    return { id: levelId };
  }

  async setTopicPublishState(topicId: string, isPublished: boolean) {
    await this.getTopicById(topicId);

    return prisma.lmsTopic.update({
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

export default new LmsTopicService();
