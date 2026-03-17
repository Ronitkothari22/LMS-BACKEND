import { Request, Response, NextFunction } from 'express';
import HttpException from '../utils/http-exception';
import { Role } from '@prisma/client';

export const isAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new HttpException(401, 'Authentication required');
    }

    if (req.user.role !== Role.ADMIN) {
      throw new HttpException(403, 'Access denied. Admin privileges required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
