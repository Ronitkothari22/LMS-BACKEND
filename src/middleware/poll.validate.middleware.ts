import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../config/logger.config';

export const validatePollRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Directly validate the body without wrapping it
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Poll validation error:', error.errors);
        res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map(e => ({
            field: e.path[0], // Get just the first path segment
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
