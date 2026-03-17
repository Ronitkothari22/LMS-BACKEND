import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Define allowed origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://joining-dots-frontend.vercel.app',
    'https://joining-dots-admin-2910abhishek-2910abhisheks-projects.vercel.app',
    'http://admin.joiningdots.co.in',
    'https://admin.joiningdots.co.in',
    'http://session.joiningdots.co.in',
    'https://session.joiningdots.co.in',
    'http://api.joiningdots.co.in',
    'https://api.joiningdots.co.in',
  ];

  const origin = req.headers.origin;

  // Check if the request origin is in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
};
