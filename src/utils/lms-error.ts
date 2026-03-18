import HttpException from './http-exception';
import { LmsErrorCode } from '../types/lms-error.types';

export class LmsException extends HttpException {
  code: LmsErrorCode;
  context?: Record<string, unknown>;

  constructor(
    status: number,
    code: LmsErrorCode,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(status, message);
    this.code = code;
    this.context = context;
  }
}
