import HttpException from '../utils/http-exception';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import type {
  CreateLmsVideoContentInput,
  CreateLmsReadingContentInput,
  CreateLmsQuestionInput,
  UpdateLmsQuestionInput,
} from '../types/lms.types';

class LmsContentService {
  async notImplemented(): Promise<never> {
    throw new HttpException(501, 'LMS content service not implemented yet');
  }

  private async ensureLevelExists(levelId: string) {
    const level = await prisma.lmsLevel.findUnique({
      where: { id: levelId },
      select: { id: true },
    });

    if (!level) {
      throw new HttpException(404, 'LMS level not found');
    }

    return level;
  }

  private async ensureQuestionExists(questionId: string) {
    const question = await prisma.lmsQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, levelId: true, position: true },
    });

    if (!question) {
      throw new HttpException(404, 'LMS question not found');
    }

    return question;
  }

  private async shiftContentPositionsForCreate(
    tx: Prisma.TransactionClient,
    levelId: string,
    fromPosition: number,
  ) {
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

  private async shiftQuestionPositionsForCreate(
    tx: Prisma.TransactionClient,
    levelId: string,
    fromPosition: number,
  ) {
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

  private async shiftQuestionPositionsForMove(
    tx: Prisma.TransactionClient,
    levelId: string,
    oldPosition: number,
    newPosition: number,
  ) {
    if (newPosition === oldPosition) return;

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

  private async shiftQuestionPositionsForDelete(
    tx: Prisma.TransactionClient,
    levelId: string,
    deletedPosition: number,
  ) {
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

  async addVideoContent(levelId: string, input: CreateLmsVideoContentInput) {
    await this.ensureLevelExists(levelId);

    if (input.videoSourceType === 'UPLOAD' && !input.videoUrl) {
      throw new HttpException(400, 'videoUrl is required when videoSourceType is UPLOAD');
    }
    if (input.videoSourceType === 'EXTERNAL_LINK' && !input.externalUrl) {
      throw new HttpException(400, 'externalUrl is required when videoSourceType is EXTERNAL_LINK');
    }

    return prisma.$transaction(async tx => {
      await this.shiftContentPositionsForCreate(tx, levelId, input.position);

      return tx.lmsLevelContent.create({
        data: {
          levelId,
          type: 'VIDEO',
          title: input.title,
          description: input.description,
          position: input.position,
          isRequired: input.isRequired ?? true,
          videoSourceType: input.videoSourceType,
          videoUrl: input.videoUrl,
          externalUrl: input.externalUrl,
          videoDurationSeconds: input.videoDurationSeconds,
        },
      });
    });
  }

  async addReadingContent(levelId: string, input: CreateLmsReadingContentInput) {
    await this.ensureLevelExists(levelId);

    return prisma.$transaction(async tx => {
      await this.shiftContentPositionsForCreate(tx, levelId, input.position);

      return tx.lmsLevelContent.create({
        data: {
          levelId,
          type: 'READING',
          title: input.title,
          description: input.description,
          position: input.position,
          isRequired: input.isRequired ?? false,
          attachmentUrl: input.attachmentUrl,
          externalUrl: input.externalUrl,
        },
      });
    });
  }

  async addQuestions(levelId: string, questions: CreateLmsQuestionInput[]) {
    await this.ensureLevelExists(levelId);

    return prisma.$transaction(async tx => {
      const created: unknown[] = [];
      const sorted = [...questions].sort((a, b) => a.position - b.position);

      for (const q of sorted) {
        await this.shiftQuestionPositionsForCreate(tx, levelId, q.position);

        const createdQuestion = await tx.lmsQuestion.create({
          data: {
            levelId,
            questionText: q.questionText,
            type: q.type,
            position: q.position,
            isRequired: q.isRequired ?? true,
            points: q.points ?? 1,
            explanation: q.explanation,
            options: q.options?.length
              ? {
                  create: q.options.map(option => ({
                    optionText: option.optionText,
                    position: option.position,
                    isCorrect: option.isCorrect ?? false,
                  })),
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

  async updateQuestion(questionId: string, input: UpdateLmsQuestionInput) {
    const existing = await this.ensureQuestionExists(questionId);

    return prisma.$transaction(async tx => {
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
            data: input.options.map(option => ({
              questionId,
              optionText: option.optionText,
              position: option.position,
              isCorrect: option.isCorrect ?? false,
            })),
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

  async deleteQuestion(questionId: string) {
    const existing = await this.ensureQuestionExists(questionId);

    await prisma.$transaction(async tx => {
      await tx.lmsQuestion.delete({
        where: { id: questionId },
      });

      await this.shiftQuestionPositionsForDelete(tx, existing.levelId, existing.position);
    });

    return { id: questionId };
  }
}

export default new LmsContentService();
