import { Request, Response, NextFunction } from 'express';
import { ContentType } from '@prisma/client';
import HttpException from '../utils/http-exception';
import logger from '../config/logger.config';

/**
 * Middleware to validate content form data
 * This runs after multer has processed the file upload
 */
export const validateContentForm = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const { title, sessionId, type } = req.body;
    const file = req.file;

    // Log for debugging
    logger.info('Validating content form data');
    logger.info('Body:', req.body);
    logger.info('File:', req.file ? 'File present' : 'No file');

    // Check required fields
    if (!title) {
      throw new HttpException(400, 'Title is required');
    }

    if (!sessionId) {
      throw new HttpException(400, 'Session ID is required');
    }

    // Validate session ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      throw new HttpException(400, 'Invalid session ID format');
    }

    // Validate content type if provided
    if (type && !Object.values(ContentType).includes(type as ContentType)) {
      throw new HttpException(400, 'Invalid content type');
    }

    // Check if file is uploaded
    if (!file) {
      throw new HttpException(400, 'No file uploaded');
    }

    next();
  } catch (error) {
    next(error);
  }
};
