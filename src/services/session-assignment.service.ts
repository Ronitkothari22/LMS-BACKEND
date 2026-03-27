import { ContentType } from '@prisma/client';
import prisma from '../lib/prisma';
import HttpException from '../utils/http-exception';
import { uploadToCloudinary } from './cloudinary.service';

type AssignmentManagerContext = {
  sessionId: string;
  requesterId: string;
  requesterRole?: string;
};

type CreateAssignmentInput = {
  title: string;
  description?: string;
  instructions?: string;
  dueDate: Date;
  allowLateSubmission?: boolean;
  maxFileSizeMb?: number;
  maxFilesPerSubmission?: number;
  allowedFileTypes?: Array<'pdf' | 'doc' | 'docx'>;
  isActive?: boolean;
};

type UpdateAssignmentInput = Partial<CreateAssignmentInput>;

type AssignmentListQuery = {
  includeInactive?: boolean;
  page?: number;
  limit?: number;
};

type SubmissionListQuery = {
  filter?: 'submitted' | 'late' | 'missing';
  query?: string;
  page?: number;
  limit?: number;
};

type TimelineQuery = {
  page?: number;
  limit?: number;
};

type MyAssignmentsQuery = {
  upcomingOnly?: boolean;
  page?: number;
  limit?: number;
};

type SubmitAssignmentInput = {
  replaceExisting?: boolean;
};

const DEFAULT_FILE_TYPES = ['pdf', 'doc', 'docx'] as const;
const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_MAX_FILES_PER_SUBMISSION = 5;
const HARD_MAX_FILE_SIZE_MB = 100;
const HARD_MAX_FILES_PER_SUBMISSION = 20;

const FILE_MIME_BY_EXT: Record<string, string[]> = {
  pdf: ['application/pdf', 'application/x-pdf', 'application/octet-stream'],
  doc: ['application/msword', 'application/octet-stream'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  ],
};

class SessionAssignmentService {
  private getAssignmentModel() {
    return (prisma as any).sessionAssignment;
  }

  private getSubmissionModel() {
    return (prisma as any).sessionAssignmentSubmission;
  }

  private getSubmissionFileModel() {
    return (prisma as any).sessionAssignmentSubmissionFile;
  }

  private getTimelineModel() {
    return (prisma as any).sessionAssignmentTimelineEvent;
  }

  private normalizeAllowedFileTypes(
    fileTypes?: Array<'pdf' | 'doc' | 'docx'>,
  ): string[] {
    if (!fileTypes || fileTypes.length === 0) return [...DEFAULT_FILE_TYPES];
    const normalized = Array.from(new Set(fileTypes.map(type => type.toLowerCase())));
    const invalid = normalized.filter(type => !DEFAULT_FILE_TYPES.includes(type as any));
    if (invalid.length > 0) {
      throw new HttpException(400, `Invalid file type(s): ${invalid.join(', ')}`);
    }
    return normalized;
  }

  private getDeadlineStatus(dueDate: Date, allowLateSubmission: boolean) {
    const now = new Date();
    if (now <= dueDate) return 'OPEN' as const;
    return allowLateSubmission ? ('LATE_ALLOWED' as const) : ('CLOSED' as const);
  }

  private getPagination(page?: number, limit?: number) {
    const safePage = page && page > 0 ? page : 1;
    const safeLimit = limit && limit > 0 ? Math.min(limit, 100) : 10;
    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  }

  private validateAssignmentLimits(maxFileSizeMb?: number, maxFilesPerSubmission?: number) {
    if (maxFileSizeMb !== undefined && maxFileSizeMb > HARD_MAX_FILE_SIZE_MB) {
      throw new HttpException(400, `maxFileSizeMb cannot exceed ${HARD_MAX_FILE_SIZE_MB}`);
    }
    if (
      maxFilesPerSubmission !== undefined &&
      maxFilesPerSubmission > HARD_MAX_FILES_PER_SUBMISSION
    ) {
      throw new HttpException(
        400,
        `maxFilesPerSubmission cannot exceed ${HARD_MAX_FILES_PER_SUBMISSION}`,
      );
    }
  }

  private getFileExtension(originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase();
    return ext || '';
  }

  private validateSubmissionFiles(
    files: Express.Multer.File[],
    allowedFileTypes: string[],
    maxFileSizeMb: number,
    maxFilesPerSubmission: number,
  ) {
    if (!files.length) {
      throw new HttpException(400, 'At least one file is required for submission');
    }
    if (files.length > maxFilesPerSubmission) {
      throw new HttpException(
        400,
        `Maximum ${maxFilesPerSubmission} files are allowed for this assignment`,
      );
    }

    const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
    for (const file of files) {
      const ext = this.getFileExtension(file.originalname);
      if (!allowedFileTypes.includes(ext)) {
        throw new HttpException(
          400,
          `File "${file.originalname}" is not allowed. Allowed types: ${allowedFileTypes.join(', ')}`,
        );
      }

      const allowedMimes = FILE_MIME_BY_EXT[ext] || [];
      if (allowedMimes.length && !allowedMimes.includes(file.mimetype)) {
        throw new HttpException(
          400,
          `File "${file.originalname}" has invalid mime type "${file.mimetype}"`,
        );
      }

      if (file.size > maxFileSizeBytes) {
        throw new HttpException(
          400,
          `File "${file.originalname}" exceeds max size of ${maxFileSizeMb} MB`,
        );
      }
    }
  }

  private async getSessionBasic(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, createdById: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    return session;
  }

  async assertManagerAccess(context: AssignmentManagerContext) {
    const session = await this.getSessionBasic(context.sessionId);
    const isAdmin = context.requesterRole === 'ADMIN';
    const isCreator = session.createdById === context.requesterId;

    if (!isAdmin && !isCreator) {
      throw new HttpException(403, 'Only admin or session creator can manage assignments');
    }

    return session;
  }

  async assertParticipantAccess(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        participants: {
          where: { id: userId },
          select: { id: true },
        },
      },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    if (session.participants.length === 0) {
      throw new HttpException(403, 'Only session participants can access assignment submission');
    }

    return session;
  }

  private async createTimelineEvent(input: {
    assignmentId: string;
    actorUserId: string;
    eventType:
      | 'ASSIGNMENT_CREATED'
      | 'ASSIGNMENT_UPDATED'
      | 'LATE_SUBMISSION_ENABLED'
      | 'LATE_SUBMISSION_DISABLED'
      | 'SUBMISSION_UPLOADED'
      | 'SUBMISSION_REPLACED'
      | 'SUBMISSION_DOWNLOADED';
    submissionId?: string;
    eventMeta?: Record<string, unknown>;
  }) {
    await this.getTimelineModel().create({
      data: {
        assignmentId: input.assignmentId,
        submissionId: input.submissionId,
        actorUserId: input.actorUserId,
        eventType: input.eventType,
        eventMeta: input.eventMeta,
      },
    });
  }

  async createAssignment(sessionId: string, createdById: string, input: CreateAssignmentInput) {
    this.validateAssignmentLimits(input.maxFileSizeMb, input.maxFilesPerSubmission);

    const allowedFileTypes = this.normalizeAllowedFileTypes(input.allowedFileTypes);

    const assignment = await this.getAssignmentModel().create({
      data: {
        sessionId,
        title: input.title,
        description: input.description,
        instructions: input.instructions,
        dueDate: input.dueDate,
        allowLateSubmission: input.allowLateSubmission ?? false,
        maxFileSizeMb: input.maxFileSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB,
        maxFilesPerSubmission: input.maxFilesPerSubmission ?? DEFAULT_MAX_FILES_PER_SUBMISSION,
        allowedFileTypes,
        isActive: input.isActive ?? true,
        createdById,
      },
    });

    await this.createTimelineEvent({
      assignmentId: assignment.id,
      actorUserId: createdById,
      eventType: 'ASSIGNMENT_CREATED',
      eventMeta: {
        dueDate: assignment.dueDate,
        allowLateSubmission: assignment.allowLateSubmission,
      },
    });

    return {
      ...assignment,
      deadlineStatus: this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission),
      canSubmit:
        this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission) !== 'CLOSED',
    };
  }

  async listAssignments(sessionId: string, query: AssignmentListQuery) {
    const pagination = this.getPagination(query.page, query.limit);
    const where = {
      sessionId,
      ...(query.includeInactive ? {} : { isActive: true }),
    };

    const [total, assignments] = await Promise.all([
      this.getAssignmentModel().count({ where }),
      this.getAssignmentModel().findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      }),
    ]);

    const items = assignments.map((assignment: any) => ({
      ...assignment,
      submissionsCount: assignment._count?.submissions ?? 0,
      deadlineStatus: this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission),
      canSubmit:
        this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission) !== 'CLOSED',
    }));

    return {
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
      },
    };
  }

  async getAssignmentById(sessionId: string, assignmentId: string) {
    const assignment = await this.getAssignmentModel().findFirst({
      where: { id: assignmentId, sessionId },
      include: {
        _count: {
          select: { submissions: true, timelineEvents: true },
        },
      },
    });

    if (!assignment) {
      throw new HttpException(404, 'Assignment not found');
    }

    return {
      ...assignment,
      submissionsCount: assignment._count?.submissions ?? 0,
      timelineEventsCount: assignment._count?.timelineEvents ?? 0,
      deadlineStatus: this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission),
      canSubmit:
        this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission) !== 'CLOSED',
    };
  }

  async updateAssignment(
    sessionId: string,
    assignmentId: string,
    actorUserId: string,
    input: UpdateAssignmentInput,
  ) {
    const existing = await this.getAssignmentModel().findFirst({
      where: { id: assignmentId, sessionId },
    });

    if (!existing) {
      throw new HttpException(404, 'Assignment not found');
    }

    this.validateAssignmentLimits(input.maxFileSizeMb, input.maxFilesPerSubmission);
    const data: any = {
      title: input.title,
      description: input.description,
      instructions: input.instructions,
      dueDate: input.dueDate,
      allowLateSubmission: input.allowLateSubmission,
      maxFileSizeMb: input.maxFileSizeMb,
      maxFilesPerSubmission: input.maxFilesPerSubmission,
      isActive: input.isActive,
    };

    if (input.allowedFileTypes) {
      data.allowedFileTypes = this.normalizeAllowedFileTypes(input.allowedFileTypes);
    }

    const updated = await this.getAssignmentModel().update({
      where: { id: assignmentId },
      data,
    });

    await this.createTimelineEvent({
      assignmentId,
      actorUserId,
      eventType: 'ASSIGNMENT_UPDATED',
      eventMeta: {
        changedFields: Object.keys(input),
      },
    });

    if (
      typeof input.allowLateSubmission === 'boolean' &&
      input.allowLateSubmission !== existing.allowLateSubmission
    ) {
      await this.createTimelineEvent({
        assignmentId,
        actorUserId,
        eventType: input.allowLateSubmission
          ? 'LATE_SUBMISSION_ENABLED'
          : 'LATE_SUBMISSION_DISABLED',
      });
    }

    return {
      ...updated,
      deadlineStatus: this.getDeadlineStatus(updated.dueDate, updated.allowLateSubmission),
      canSubmit:
        this.getDeadlineStatus(updated.dueDate, updated.allowLateSubmission) !== 'CLOSED',
    };
  }

  async deactivateAssignment(sessionId: string, assignmentId: string, actorUserId: string) {
    const existing = await this.getAssignmentModel().findFirst({
      where: { id: assignmentId, sessionId },
      select: { id: true, isActive: true },
    });

    if (!existing) {
      throw new HttpException(404, 'Assignment not found');
    }

    const assignment = await this.getAssignmentModel().update({
      where: { id: assignmentId },
      data: { isActive: false },
    });

    await this.createTimelineEvent({
      assignmentId,
      actorUserId,
      eventType: 'ASSIGNMENT_UPDATED',
      eventMeta: { action: 'DEACTIVATED' },
    });

    return assignment;
  }

  async listSubmissions(sessionId: string, assignmentId: string, query: SubmissionListQuery) {
    const assignment = await this.getAssignmentModel().findFirst({
      where: { id: assignmentId, sessionId },
      select: { id: true },
    });

    if (!assignment) {
      throw new HttpException(404, 'Assignment not found');
    }

    const [participants, submissions] = await Promise.all([
      prisma.session.findUnique({
        where: { id: sessionId },
        select: {
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              companyPosition: true,
              department: true,
            },
          },
        },
      }),
      this.getSubmissionModel().findMany({
        where: { assignmentId, sessionId },
        orderBy: { submittedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              companyPosition: true,
              department: true,
            },
          },
          files: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    const participantList = participants?.participants ?? [];
    const submissionsByUser = new Map<string, any>();
    for (const submission of submissions) {
      submissionsByUser.set(submission.userId, submission);
    }

    const submittedCount = submissions.length;
    const lateCount = submissions.filter((submission: any) => submission.isLate).length;
    const missingCount = participantList.filter(p => !submissionsByUser.has(p.id)).length;

    const normalizedQuery = (query.query || '').trim().toLowerCase();
    const filter = query.filter;

    let items: any[] = [];
    if (filter === 'missing') {
      items = participantList
        .filter(participant => !submissionsByUser.has(participant.id))
        .map(participant => ({
          type: 'MISSING',
          user: participant,
          submission: null,
        }));
    } else {
      const base =
        filter === 'late'
          ? submissions.filter((submission: any) => submission.isLate)
          : submissions;
      items = base.map((submission: any) => ({
        type: 'SUBMITTED',
        user: submission.user,
        submission,
      }));
    }

    if (normalizedQuery) {
      items = items.filter(item => {
        const user = item.user || {};
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        return name.includes(normalizedQuery) || email.includes(normalizedQuery);
      });
    }

    const pagination = this.getPagination(query.page, query.limit);
    const total = items.length;
    const pagedItems = items.slice(pagination.skip, pagination.skip + pagination.limit);

    return {
      items: pagedItems,
      summary: {
        totalParticipants: participantList.length,
        submittedCount,
        lateCount,
        missingCount,
      },
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
      },
    };
  }

  async getTimeline(sessionId: string, assignmentId: string, query: TimelineQuery) {
    const assignment = await this.getAssignmentModel().findFirst({
      where: { id: assignmentId, sessionId },
      select: { id: true },
    });

    if (!assignment) {
      throw new HttpException(404, 'Assignment not found');
    }

    const pagination = this.getPagination(query.page, query.limit);
    const where = { assignmentId };
    const [total, events] = await Promise.all([
      this.getTimelineModel().count({ where }),
      this.getTimelineModel().findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      items: events,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
      },
    };
  }

  async getSubmissionFileForDownload(
    sessionId: string,
    assignmentId: string,
    submissionId: string,
    fileId: string,
    actorUserId: string,
  ) {
    const file = await this.getSubmissionFileModel().findFirst({
      where: {
        id: fileId,
        submissionId,
        submission: {
          assignmentId,
          sessionId,
        },
      },
      include: {
        submission: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!file) {
      throw new HttpException(404, 'Assignment submission file not found');
    }

    await this.createTimelineEvent({
      assignmentId,
      submissionId,
      actorUserId,
      eventType: 'SUBMISSION_DOWNLOADED',
      eventMeta: {
        fileId,
        fileName: file.fileName,
      },
    });

    return file;
  }

  async getMyAssignments(userId: string, sessionId: string, query: MyAssignmentsQuery) {
    await this.assertParticipantAccess(sessionId, userId);
    const pagination = this.getPagination(query.page, query.limit);
    const now = new Date();

    const where: any = {
      sessionId,
      isActive: true,
      ...(query.upcomingOnly ? { dueDate: { gte: now } } : {}),
    };

    const [total, assignments] = await Promise.all([
      this.getAssignmentModel().count({ where }),
      this.getAssignmentModel().findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          submissions: {
            where: { userId },
            include: { files: true },
          },
        },
      }),
    ]);

    const items = assignments.map((assignment: any) => {
      const mySubmission = assignment.submissions?.[0] ?? null;
      return {
        ...assignment,
        mySubmission,
        deadlineStatus: this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission),
        canSubmit:
          this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission) !== 'CLOSED',
      };
    });

    return {
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
      },
    };
  }

  async getMyAssignmentById(userId: string, sessionId: string, assignmentId: string) {
    await this.assertParticipantAccess(sessionId, userId);
    const assignment = await this.getAssignmentModel().findFirst({
      where: {
        id: assignmentId,
        sessionId,
        isActive: true,
      },
      include: {
        submissions: {
          where: { userId },
          include: {
            files: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new HttpException(404, 'Assignment not found');
    }

    const mySubmission = assignment.submissions?.[0] ?? null;
    return {
      ...assignment,
      mySubmission,
      deadlineStatus: this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission),
      canSubmit:
        this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission) !== 'CLOSED',
    };
  }

  async getMySubmission(userId: string, sessionId: string, assignmentId: string) {
    await this.assertParticipantAccess(sessionId, userId);
    const submission = await this.getSubmissionModel().findFirst({
      where: {
        assignmentId,
        sessionId,
        userId,
      },
      include: {
        files: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!submission) {
      throw new HttpException(404, 'Submission not found');
    }

    return submission;
  }

  async submitMyAssignment(
    userId: string,
    sessionId: string,
    assignmentId: string,
    files: Express.Multer.File[],
    input: SubmitAssignmentInput,
  ) {
    await this.assertParticipantAccess(sessionId, userId);

    const assignment = await this.getAssignmentModel().findFirst({
      where: {
        id: assignmentId,
        sessionId,
        isActive: true,
      },
      include: {
        submissions: {
          where: { userId },
          include: { files: true },
        },
      },
    });

    if (!assignment) {
      throw new HttpException(404, 'Assignment not found');
    }

    const deadlineStatus = this.getDeadlineStatus(assignment.dueDate, assignment.allowLateSubmission);
    if (deadlineStatus === 'CLOSED') {
      throw new HttpException(400, 'Submission deadline has passed');
    }

    const allowedFileTypes = assignment.allowedFileTypes?.length
      ? assignment.allowedFileTypes
      : [...DEFAULT_FILE_TYPES];
    const maxFileSizeMb = assignment.maxFileSizeMb || DEFAULT_MAX_FILE_SIZE_MB;
    const maxFilesPerSubmission =
      assignment.maxFilesPerSubmission || DEFAULT_MAX_FILES_PER_SUBMISSION;

    this.validateSubmissionFiles(files, allowedFileTypes, maxFileSizeMb, maxFilesPerSubmission);

    const existingSubmission = assignment.submissions?.[0] ?? null;
    if (existingSubmission && input.replaceExisting === false) {
      throw new HttpException(
        400,
        'Submission already exists. Set replaceExisting=true to replace current submission',
      );
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;
    const folder = `sessions/${sessionId}/assignments/${assignmentId}/users/${userId}`;

    const uploadedFiles: Array<{
      fileUrl: string;
      fileName: string;
      fileMimeType: string;
      fileSizeBytes: number;
    }> = [];
    for (const file of files) {
      const ext = this.getFileExtension(file.originalname);
      const contentType = ext === 'pdf' ? ContentType.PDF : ContentType.DOCUMENT;
      const uploadResult = await uploadToCloudinary(
        file.buffer,
        folder,
        contentType,
        file.originalname,
      );

      uploadedFiles.push({
        fileUrl: uploadResult.secure_url,
        fileName: file.originalname,
        fileMimeType: file.mimetype,
        fileSizeBytes: file.size,
      });
    }

    const submission = await prisma.$transaction(async tx => {
      if (existingSubmission) {
        await (tx as any).sessionAssignmentSubmissionFile.deleteMany({
          where: { submissionId: existingSubmission.id },
        });

        const updatedSubmission = await (tx as any).sessionAssignmentSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            submittedAt: now,
            isLate,
            version: existingSubmission.version + 1,
            status: 'REPLACED',
            files: {
              create: uploadedFiles,
            },
          },
          include: {
            files: {
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        await (tx as any).sessionAssignmentTimelineEvent.create({
          data: {
            assignmentId,
            submissionId: updatedSubmission.id,
            actorUserId: userId,
            eventType: 'SUBMISSION_REPLACED',
            eventMeta: {
              filesCount: uploadedFiles.length,
              isLate,
            },
          },
        });

        return updatedSubmission;
      }

      const createdSubmission = await (tx as any).sessionAssignmentSubmission.create({
        data: {
          assignmentId,
          sessionId,
          userId,
          submittedAt: now,
          isLate,
          status: 'SUBMITTED',
          files: {
            create: uploadedFiles,
          },
        },
        include: {
          files: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      await (tx as any).sessionAssignmentTimelineEvent.create({
        data: {
          assignmentId,
          submissionId: createdSubmission.id,
          actorUserId: userId,
          eventType: 'SUBMISSION_UPLOADED',
          eventMeta: {
            filesCount: uploadedFiles.length,
            isLate,
          },
        },
      });

      return createdSubmission;
    });

    return submission;
  }
}

const sessionAssignmentService = new SessionAssignmentService();
export default sessionAssignmentService;
