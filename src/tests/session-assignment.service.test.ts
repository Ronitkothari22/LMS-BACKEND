import sessionAssignmentService from '../services/session-assignment.service';
import prisma from '../lib/prisma';
import { uploadToCloudinary } from '../services/cloudinary.service';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    session: {
      findUnique: jest.fn(),
    },
    sessionAssignment: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../services/cloudinary.service', () => ({
  __esModule: true,
  uploadToCloudinary: jest.fn(),
}));

describe('session-assignment.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks participant submission when deadline is closed', async () => {
    (prisma.session.findUnique as jest.Mock).mockResolvedValue({
      id: 'session-1',
      participants: [{ id: 'user-1' }],
    });

    (prisma.sessionAssignment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assignment-1',
      sessionId: 'session-1',
      dueDate: new Date('2026-01-01T10:00:00.000Z'),
      allowLateSubmission: false,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSizeMb: 10,
      maxFilesPerSubmission: 5,
      submissions: [],
      isActive: true,
    });

    const files = [
      {
        originalname: 'solution.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('demo'),
      },
    ] as Express.Multer.File[];

    await expect(
      sessionAssignmentService.submitMyAssignment('user-1', 'session-1', 'assignment-1', files, {}),
    ).rejects.toThrow('Submission deadline has passed');
  });

  it('blocks replacing existing submission unless replaceExisting=true', async () => {
    (prisma.session.findUnique as jest.Mock).mockResolvedValue({
      id: 'session-1',
      participants: [{ id: 'user-1' }],
    });

    (prisma.sessionAssignment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assignment-1',
      sessionId: 'session-1',
      dueDate: new Date('2099-01-01T10:00:00.000Z'),
      allowLateSubmission: false,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSizeMb: 10,
      maxFilesPerSubmission: 5,
      submissions: [{ id: 'submission-1', version: 1 }],
      isActive: true,
    });

    const files = [
      {
        originalname: 'solution.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('demo'),
      },
    ] as Express.Multer.File[];

    await expect(
      sessionAssignmentService.submitMyAssignment('user-1', 'session-1', 'assignment-1', files, {
        replaceExisting: false,
      }),
    ).rejects.toThrow('Submission already exists');
  });

  it('accepts multi-file submission and stores files in a single submission', async () => {
    (prisma.session.findUnique as jest.Mock).mockResolvedValue({
      id: 'session-1',
      participants: [{ id: 'user-1' }],
    });

    (prisma.sessionAssignment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assignment-1',
      sessionId: 'session-1',
      dueDate: new Date('2099-01-01T10:00:00.000Z'),
      allowLateSubmission: false,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSizeMb: 10,
      maxFilesPerSubmission: 5,
      submissions: [],
      isActive: true,
    });

    (uploadToCloudinary as jest.Mock)
      .mockResolvedValueOnce({ secure_url: 'https://files.test/one.pdf' })
      .mockResolvedValueOnce({ secure_url: 'https://files.test/two.docx' });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
      const tx = {
        sessionAssignmentSubmission: {
          create: jest.fn().mockResolvedValue({
            id: 'submission-new',
            assignmentId: 'assignment-1',
            sessionId: 'session-1',
            userId: 'user-1',
            status: 'SUBMITTED',
            files: [
              { id: 'f1', fileName: 'one.pdf' },
              { id: 'f2', fileName: 'two.docx' },
            ],
          }),
        },
        sessionAssignmentTimelineEvent: {
          create: jest.fn().mockResolvedValue({ id: 'event-1' }),
        },
      };
      return callback(tx);
    });

    const files = [
      {
        originalname: 'one.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('one'),
      },
      {
        originalname: 'two.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2048,
        buffer: Buffer.from('two'),
      },
    ] as Express.Multer.File[];

    const result = await sessionAssignmentService.submitMyAssignment(
      'user-1',
      'session-1',
      'assignment-1',
      files,
      {},
    );

    expect(uploadToCloudinary).toHaveBeenCalledTimes(2);
    expect(result.id).toBe('submission-new');
    expect(result.files).toHaveLength(2);
  });
});
