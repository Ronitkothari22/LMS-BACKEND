import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.config';
import logger from './config/logger.config';
import { errorMiddleware } from './middleware/error.middleware';
import routes from './routes';
import { initCloudinary } from './config/cloudinary.config';

// Initialize Express app
const app = express();

// Initialize Cloudinary
initCloudinary();

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Global middleware
app.use(
  helmet({
    // Disable contentSecurityPolicy or configure it to be more permissive
    contentSecurityPolicy: false,
  }),
);
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://data.joinindots.co.in',
      'https://joining-dots-backend-2910abhishek-2910abhisheks-projects.vercel.app/',
      'https://joining-dots-frontend.vercel.app',
      'https://joining-dots-admin-2910abhishek-2910abhisheks-projects.vercel.app',
      'https://joining-dots-backend-beta.vercel.app',
      'http://admin.joiningdots.co.in',
      'https://admin.joiningdots.co.in',
      'http://session.joiningdots.co.in',
      'https://session.joiningdots.co.in',
      'http://api.joiningdots.co.in',
      'https://api.joiningdots.co.in',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Configure request timeout for large uploads
app.use((req: Request, res: Response, next: NextFunction) => {
  // Set longer timeout for upload routes
  if (req.path.includes('/content') && req.method === 'POST') {
    req.setTimeout(5 * 60 * 1000); // 5 minutes for file uploads
    res.setTimeout(5 * 60 * 1000);
  } else {
    req.setTimeout(30 * 1000); // 30 seconds for other routes
    res.setTimeout(30 * 1000);
  }
  next();
});

// Routes
app.use('/api', routes);

// Custom error interface with status property
interface NotFoundError extends Error {
  status: number;
}

// 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  const error = new Error('Not Found') as NotFoundError;
  error.status = 404;
  next(error);
});

// Error handling
app.use(errorMiddleware);

export default app;
