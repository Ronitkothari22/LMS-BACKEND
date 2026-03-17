import { Router } from 'express';
import {
  signup,
  adminSignup,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  refreshToken,
} from '../controllers/auth.controller';
import { RequestHandler } from 'express';
import { validateRequest } from '../middleware/validate.middleware';
import {
  signupSchema,
  adminSignupSchema,
  loginSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validations/auth.validation';

const router = Router();

// Auth routes
router.post('/signup', validateRequest(signupSchema) as RequestHandler, signup as RequestHandler);
router.post(
  '/admin-signup',
  validateRequest(adminSignupSchema) as RequestHandler,
  adminSignup as RequestHandler,
);
router.post('/login', validateRequest(loginSchema) as RequestHandler, login as RequestHandler);
router.post(
  '/verify-email',
  validateRequest(verifyEmailSchema) as RequestHandler,
  verifyEmail as RequestHandler,
);

router.post(
  '/request-password-reset',
  validateRequest(requestPasswordResetSchema) as RequestHandler,
  requestPasswordReset as RequestHandler,
);

router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema) as RequestHandler,
  resetPassword as RequestHandler,
);

router.post(
  '/refresh-token',
  validateRequest(refreshTokenSchema) as RequestHandler,
  refreshToken as RequestHandler,
);

export default router;
