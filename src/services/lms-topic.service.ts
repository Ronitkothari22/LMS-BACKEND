import HttpException from '../utils/http-exception';
import prisma from '../lib/prisma';
import type { CreateLmsTopicInput, UpdateLmsTopicInput } from '../types/lms.types';
import type { CreateLmsLevelInput, UpdateLmsLevelInput } from '../types/lms.types';
import { Prisma } from '@prisma/client';

class LmsTopicService {
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
    return prisma.lmsTopic.create({
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
      },
    });

    if (!topic) {
      throw new HttpException(404, 'LMS topic not found');
    }

    return topic;
  }

  async updateTopic(topicId: string, input: UpdateLmsTopicInput) {
    await this.getTopicById(topicId);

    return prisma.lmsTopic.update({
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

  async deleteTopic(topicId: string) {
    await this.getTopicById(topicId);

    await prisma.lmsTopic.delete({
      where: { id: topicId },
    });

    return { id: topicId };
  }

  async createLevel(topicId: string, input: CreateLmsLevelInput) {
    await this.ensureTopicExists(topicId);

    try {
      return await prisma.$transaction(async tx => {
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpException(400, 'Level position already exists in this topic');
      }
      throw error;
    }
  }

  async updateLevel(levelId: string, input: UpdateLmsLevelInput) {
    const existing = await this.ensureLevelExists(levelId);

    try {
      return await prisma.$transaction(async tx => {
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
      },
    });
  }
}

export default new LmsTopicService();
