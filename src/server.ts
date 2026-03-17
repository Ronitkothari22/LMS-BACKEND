import 'dotenv/config';
import app from './app';
import { env } from './config/env.config';
import logger from './config/logger.config';
import prisma from './lib/prisma';
import { createServer } from 'http';
import SocketService from './services/socket.service';

const PORT = env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connection established');

    const httpServer = createServer(app);
    const socketService = new SocketService(httpServer);

    // Attach socket service to app for use in routes
    app.set('socketService', socketService);

    const server = httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api/docs`);
      logger.info('WebSocket server is running');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('Unhandled Rejection:', err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception:', err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully');
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
