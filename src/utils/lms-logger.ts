import logger from '../config/logger.config';
import { LmsLogEvent } from '../types/lms-error.types';

export const lmsLogInfo = (
  event: LmsLogEvent,
  message: string,
  context: Record<string, unknown> = {},
) => {
  logger.info(`[${event}] ${message}`, context);
};

export const lmsLogError = (
  event: LmsLogEvent,
  message: string,
  context: Record<string, unknown> = {},
) => {
  logger.error(`[${event}] ${message}`, context);
};
