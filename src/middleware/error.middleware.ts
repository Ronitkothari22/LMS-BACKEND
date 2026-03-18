import { Request, Response, NextFunction } from 'express';
import HttpException from '../utils/http-exception';
import logger from '../config/logger.config';

 
export function errorMiddleware(
  error: HttpException & { code?: string; context?: Record<string, unknown> },
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';

  logger.error(`${status} - ${message} - ${req.path} - ${req.method} - ${req.ip}`, {
    error: error.toString(),
    code: error.code,
    context: error.context,
  });

  res.status(status).json({
    success: false,
    message,
    ...(error.code ? { code: error.code } : {}),
    ...(error.context ? { context: error.context } : {}),
  });
}
