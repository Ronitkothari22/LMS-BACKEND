import { Router } from 'express';
import { updateUserDetails } from '../controllers/onboarding.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { updateUserDetailsSchema } from '../validations/onboarding.validation';
import { RequestHandler } from 'express';

const router = Router();

// Protected onboarding routes (admin only)
router.put(
  '/user-details',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateUserDetailsSchema) as RequestHandler,
  updateUserDetails as RequestHandler,
);

export default router;
