import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.config';

const prisma = new PrismaClient({
  log: env.isProduction ? ['error'] : ['query', 'info', 'warn', 'error'],
});

export default prisma;
