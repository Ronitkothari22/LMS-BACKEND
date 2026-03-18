import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import onboardingRoutes from './onboarding.routes';
import sessionRoutes from './session.routes';
import quizRoutes from './quiz.routes';
import pollRoutes from './poll.routes';
import dashboardRoutes from './dashboard.routes';
import contentRoutes from './content.routes';
import teamRoutes from './team.routes';
import feedbackRoutes from './feedback.routes';
import organizationRoutes from './organization.routes';
import surveyRoutes from './survey.routes';
import lmsRoutes from './lms.routes';

const router = Router();

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://69.62.61.93:3000', // VPS frontend admin (new IP)
  'http://69.62.61.93:3001', // VPS frontend user (new IP)
  'https://joining-dots-frontend.vercel.app',
  'https://joining-dots-admin-2910abhishek-2910abhisheks-projects.vercel.app',
  'https://joining-dots-backend-beta.vercel.app',
  'http://admin.joiningdots.co.in',
  'https://admin.joiningdots.co.in',
  'http://session.joiningdots.co.in',
  'https://session.joiningdots.co.in',
  'http://api.joiningdots.co.in',
  'https://api.joiningdots.co.in',
];

// Handle OPTIONS requests globally
router.options('/*', (req: Request, res: Response) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With',
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/sessions', sessionRoutes);
router.use('/quizzes', quizRoutes);
router.use('/poll', pollRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/content', contentRoutes);
router.use('/teams', teamRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/organization', organizationRoutes);
router.use('/survey', surveyRoutes);
router.use('/lms', lmsRoutes);

export default router;
