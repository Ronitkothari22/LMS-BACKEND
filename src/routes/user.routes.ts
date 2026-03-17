import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from '../validations/user.validation';
import { upload } from '../middleware/upload.middleware';
import { RequestHandler } from 'express';

const router = Router();

// Protected routes
// router.use(authenticateToken as RequestHandler);

// Create new user (admin only)
router.post(
  '/create-user',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(createUserSchema),
  userController.createUser,
);

// Bulk invite users from CSV/Excel
router.post(
  '/bulk-invite',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  upload.single('file'),
  userController.sendBulkInvitations,
);

// Get all users with pagination
router.get(
  '/',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  userController.getAllUsers,
);

// Get user by ID
router.get(
  '/:userId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  userController.getUserById,
);

// Update user
router.put(
  '/:userId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateUserSchema),
  userController.updateUser,
);

// Toggle user active status
router.patch(
  '/:userId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  userController.toggleUserActiveStatus,
);

export default router;
