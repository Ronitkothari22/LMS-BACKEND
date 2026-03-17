import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { RequestHandler } from 'express';

const router = Router();

// Get dashboard data
router.get('/', authenticateToken as RequestHandler, getDashboard as RequestHandler);

export default router;
