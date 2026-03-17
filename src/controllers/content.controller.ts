import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ContentType } from '@prisma/client';
import { RequestHandler } from 'express';
import HttpException from '../utils/http-exception';
import logger from '../config/logger.config';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary.service';
import { uploadToMinIO, deleteFromMinIO } from '../services/minio.service';
import https from 'https';
import http from 'http';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { minioClient, MINIO_BUCKET } from '../config/minio.config';
import { Readable } from 'stream';

const prisma = new PrismaClient();

/**
 * Upload content to a session
 * @route POST /api/content
 * @access Private (Admin only)
 */
export const uploadContent: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Log the request body and file for debugging
    logger.info('Request body:', req.body);
    logger.info('Request file:', req.file);

    const { title, sessionId, type } = req.body;
    const userId = req.user?.id;
    const file = req.file;

    if (!file) {
      throw new HttpException(400, 'No file uploaded');
    }

    if (!title || !sessionId) {
      throw new HttpException(400, 'Title and sessionId are required');
    }

    // Check file size for optimization decision
    const fileSizeInMB = file.size / (1024 * 1024);
    const isLargeFile = fileSizeInMB > 10; // Consider files > 10MB as large

    logger.info(
      `Processing file upload - Size: ${fileSizeInMB.toFixed(2)}MB, Large file: ${isLargeFile}`,
    );

    // Determine content type from file if not provided
    let contentType: ContentType;

    if (type && Object.values(ContentType).includes(type as ContentType)) {
      contentType = type as ContentType;
    } else {
      // Determine from mimetype
      if (file.mimetype.startsWith('image/')) {
        contentType = 'IMAGE';
      } else if (file.mimetype.startsWith('video/')) {
        contentType = 'VIDEO';
      } else if (file.mimetype === 'application/pdf') {
        contentType = 'PDF';
      } else if (
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        file.mimetype === 'application/vnd.ms-powerpoint'
      ) {
        // Handle PowerPoint files (.pptx and .ppt)
        contentType = 'DOCUMENT';
      } else if (
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        // Handle Word documents (.docx and .doc)
        contentType = 'DOCUMENT';
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'text/csv'
      ) {
        // Handle Excel and CSV files (.xlsx, .xls, .csv)
        contentType = 'DOCUMENT';
      } else {
        contentType = 'TEXT';
      }
    }

    // Define folder path for uploads
    const folder = `sessions/${sessionId}/content`;
    const useMinio = process.env.STORAGE_PROVIDER === 'minio';

    if (isLargeFile) {
      // For large files, process in background and return immediately
      processLargeFileUpload(file, folder, contentType, title, sessionId, userId, useMinio);

      res.status(202).json({
        message: 'Large file upload initiated. Processing in background...',
        status: 'processing',
        fileSize: `${fileSizeInMB.toFixed(2)}MB`,
        estimatedTime: `${Math.ceil(fileSizeInMB / 5)} minutes`, // Rough estimate
      });
    } else {
      let uploadResult;
      if (useMinio) {
        const key = `${folder}/${file.originalname}`;
        uploadResult = await uploadToMinIO(file.buffer, key, file.mimetype);
      } else {
        uploadResult = await uploadToCloudinary(
          file.buffer,
          folder,
          contentType,
          file.originalname,
        );
      }

      // Create content record in database
      const content = await prisma.content.create({
        data: {
          title,
          url: uploadResult.url,
          type: contentType,
          session: {
            connect: {
              id: sessionId,
            },
          },
          // By default, the content creator can edit
          canEdit: {
            connect: {
              id: userId,
            },
          },
        },
        include: {
          session: {
            select: {
              title: true,
            },
          },
        },
      });

      res.status(201).json({
        message: 'Content uploaded successfully',
        content: {
          id: content.id,
          title: content.title,
          url: content.url,
          type: content.type,
          sessionId: content.sessionId,
          sessionTitle: content.session?.title,
          createdAt: content.createdAt,
        },
      });
    }
  } catch (error) {
    logger.error('Error uploading content:', error);
    next(error);
  }
};

/**
 * Process large file uploads in background
 */
async function processLargeFileUpload(
  file: Express.Multer.File,
  folder: string,
  contentType: ContentType,
  title: string,
  sessionId: string,
  userId: string | undefined,
  useMinio: boolean = false,
): Promise<void> {
  try {
    logger.info(`Starting background processing for large file: ${title}`);
    let uploadResult;
    if (useMinio) {
      const key = `${folder}/${file.originalname}`;
      uploadResult = await uploadToMinIO(file.buffer, key, file.mimetype);
    } else {
      uploadResult = await uploadToCloudinary(
        file.buffer,
        folder,
        contentType,
        file.originalname,
        progress => {
          logger.info(`Upload progress for ${title}: ${progress.percentage}%`);
        },
      );
    }

    // Create content record in database
    const content = await prisma.content.create({
      data: {
        title,
        url: uploadResult.url,
        type: contentType,
        session: {
          connect: {
            id: sessionId,
          },
        },
        canEdit: {
          connect: {
            id: userId,
          },
        },
      },
    });

    logger.info(`Large file upload completed successfully: ${title} (ID: ${content.id})`);

    // TODO: Implement WebSocket notification to inform user of completion
    // You can emit a socket event here to notify the frontend
  } catch (error) {
    logger.error(`Error processing large file upload for ${title}:`, error);
    // TODO: Implement error notification to user
  }
}

/**
 * Get content by ID
 * @route GET /api/content/:contentId
 * @access Private (Users with access)
 */
export const getContentById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contentId } = req.params;
    const id = Array.isArray(contentId) ? contentId[0] : contentId;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            title: true,
          },
        },
        canView: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        canEdit: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!content) {
      throw new HttpException(404, 'Content not found');
    }

    res.status(200).json({
      content,
    });
  } catch (error) {
    logger.error('Error getting content:', error);
    next(error);
  }
};

/**
 * Get all content for a session
 * @route GET /api/content/session/:sessionId
 * @access Private (Session participants)
 */
export const getSessionContent: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    // Build where clause
    const where: {
      sessionId: string;
      type?: ContentType;
    } = {
      sessionId: Array.isArray(sessionId) ? sessionId[0] : sessionId,
    };

    // Filter by content type if provided
    if (
      type &&
      typeof type === 'string' &&
      Object.values(ContentType).includes(type as ContentType)
    ) {
      where.type = type as ContentType;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get total count for pagination
    const totalCount = await prisma.content.count({ where });

    // Get content for session
    const content = await prisma.content.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        canView: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        canEdit: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      content,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error getting session content:', error);
    next(error);
  }
};

/**
 * Update content metadata
 * @route PUT /api/content/:contentId
 * @access Private (Admin or users with edit permission)
 */
export const updateContent: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contentId } = req.params;
    const id = Array.isArray(contentId) ? contentId[0] : contentId;
    const { title, canView, canEdit } = req.body;

    // Prepare update data
    const updateData: {
      title?: string;
    } = {};
    if (title) updateData.title = title;

    // Update content
    const content = await prisma.content.update({
      where: { id },
      data: {
        ...updateData,
        // Update canView if provided
        ...(canView && {
          canView: {
            set: [], // Clear existing connections
            connect: canView.map((id: string) => ({ id })),
          },
        }),
        // Update canEdit if provided
        ...(canEdit && {
          canEdit: {
            set: [], // Clear existing connections
            connect: canEdit.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
          },
        },
        canView: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        canEdit: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Content updated successfully',
      content,
    });
  } catch (error) {
    logger.error('Error updating content:', error);
    next(error);
  }
};

/**
 * Delete content
 * @route DELETE /api/content/:contentId
 * @access Private (Admin or users with edit permission)
 */
export const deleteContent: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contentId } = req.params;
    const id = Array.isArray(contentId) ? contentId[0] : contentId;

    // Get content to get the URL for deletion
    const content = await prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new HttpException(404, 'Content not found');
    }

    const useMinio = process.env.STORAGE_PROVIDER === 'minio';
    if (useMinio) {
      // Extract key from URL
      const url = content.url;
      const bucketUrl = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET || 'joining-dots-content'}/`;
      const key = url.startsWith(bucketUrl) ? url.substring(bucketUrl.length) : url;
      await deleteFromMinIO(key);
    } else {
      // Extract public ID from Cloudinary URL
      const urlParts = content.url.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      const folderPath = urlParts[urlParts.length - 2];
      const fullPublicId = `${folderPath}/${publicId}`;
      await deleteFromCloudinary(fullPublicId, content.type);
    }

    // Delete from database
    await prisma.content.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Content deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting content:', error);
    next(error);
  }
};

/**
 * Download content file
 * @route GET /api/content/:contentId/download
 * @access Private
 */
export const downloadContent: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contentId } = req.params;
    const id = Array.isArray(contentId) ? contentId[0] : contentId;

    // Get content from database
    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!content) {
      throw new HttpException(404, 'Content not found');
    }

    // Get the original filename from the content title or generate one
    const originalFilename = content.title;

    // Determine file extension based on content type and URL
    let fileExtension = '';
    if (content.type === 'PDF') {
      fileExtension = '.pdf';
    } else if (content.type === 'IMAGE') {
      const urlParts = content.url.split('.');
      const lastPart = urlParts[urlParts.length - 1];
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(lastPart.toLowerCase())) {
        fileExtension = `.${lastPart.toLowerCase()}`;
      } else {
        fileExtension = '.jpg';
      }
    } else if (content.type === 'VIDEO') {
      const urlParts = content.url.split('.');
      const lastPart = urlParts[urlParts.length - 1];
      if (['mp4', 'avi', 'mov', 'webm'].includes(lastPart.toLowerCase())) {
        fileExtension = `.${lastPart.toLowerCase()}`;
      } else {
        fileExtension = '.mp4';
      }
    } else if (content.type === 'DOCUMENT') {
      const urlParts = content.url.split('.');
      const lastPart = urlParts[urlParts.length - 1];
      if (['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(lastPart.toLowerCase())) {
        fileExtension = `.${lastPart.toLowerCase()}`;
      } else {
        fileExtension = '.docx';
      }
    } else if (content.type === 'TEXT') {
      fileExtension = '.txt';
    }

    // Create proper filename
    const filename = originalFilename.includes('.')
      ? originalFilename
      : `${originalFilename}${fileExtension}`;

    // Determine MIME type
    let mimeType = 'application/octet-stream';
    if (content.type === 'PDF') {
      mimeType = 'application/pdf';
    } else if (content.type === 'IMAGE') {
      if (fileExtension.includes('png')) mimeType = 'image/png';
      else if (fileExtension.includes('gif')) mimeType = 'image/gif';
      else mimeType = 'image/jpeg';
    } else if (content.type === 'VIDEO') {
      if (fileExtension.includes('mp4')) mimeType = 'video/mp4';
      else if (fileExtension.includes('webm')) mimeType = 'video/webm';
      else mimeType = 'video/mp4';
    } else if (content.type === 'DOCUMENT') {
      if (fileExtension.includes('docx'))
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (fileExtension.includes('doc')) mimeType = 'application/msword';
      else if (fileExtension.includes('pptx'))
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (fileExtension.includes('ppt')) mimeType = 'application/vnd.ms-powerpoint';
      else if (fileExtension.includes('xlsx'))
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (fileExtension.includes('xls')) mimeType = 'application/vnd.ms-excel';
      else if (fileExtension.includes('csv')) mimeType = 'text/csv';
    } else if (content.type === 'TEXT') {
      mimeType = 'text/plain';
    }

    logger.info(`Downloading content: ${content.title} (${content.type}) - ${filename}`);

    const useMinio = process.env.STORAGE_PROVIDER === 'minio';
    if (useMinio) {
      // Extract the key from the URL
      const url = content.url;
      const bucketUrl = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET || 'joining-dots-content'}/`;
      const key = url.startsWith(bucketUrl) ? url.substring(bucketUrl.length) : url;

      // Get the object from MinIO
      const command = new GetObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: key,
      });
      const data = await minioClient.send(command);

      // Set proper headers for download (same as before)
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Stream the file to the response
      const stream = data.Body as Readable;
      if (stream && typeof stream.pipe === 'function') {
        stream.pipe(res);
      } else {
        // fallback: read the stream and send as buffer
        let chunks: Buffer[] = [];
        for await (const chunk of data.Body as any) {
          chunks.push(chunk);
        }
        res.end(Buffer.concat(chunks));
      }
      return;
    }

    // Cloudinary/HTTP(S) fallback
    const protocol = content.url.startsWith('https:') ? https : http;
    protocol
      .get(content.url, (fileStream: http.IncomingMessage) => {
        if (fileStream.statusCode !== 200) {
          throw new HttpException(404, 'File not found on server');
        }

        // Pipe the file stream to response
        fileStream.pipe(res);

        fileStream.on('error', (error: Error) => {
          logger.error('Error streaming file:', error);
          if (!res.headersSent) {
            next(new HttpException(500, 'Error downloading file'));
          }
        });

        res.on('error', (error: Error) => {
          logger.error('Error in response stream:', error);
          fileStream.destroy();
        });
      })
      .on('error', (error: Error) => {
        logger.error('Error fetching file from Cloudinary:', error);
        next(new HttpException(500, 'Error fetching file'));
      });
  } catch (error) {
    logger.error('Error in download endpoint:', error);
    next(error);
  }
};
