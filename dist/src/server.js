"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const env_config_1 = require("./config/env.config");
const logger_config_1 = __importDefault(require("./config/logger.config"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const http_1 = require("http");
const socket_service_1 = __importDefault(require("./services/socket.service"));
const PORT = env_config_1.env.PORT || 3000;
async function startServer() {
    try {
        await prisma_1.default.$connect();
        logger_config_1.default.info('Database connection established');
        const httpServer = (0, http_1.createServer)(app_1.default);
        const socketService = new socket_service_1.default(httpServer);
        app_1.default.set('socketService', socketService);
        const server = httpServer.listen(PORT, () => {
            logger_config_1.default.info(`Server running on port ${PORT} in ${env_config_1.env.NODE_ENV} mode`);
            logger_config_1.default.info(`API Documentation available at http://localhost:${PORT}/api/docs`);
            logger_config_1.default.info('WebSocket server is running');
        });
        process.on('unhandledRejection', (err) => {
            logger_config_1.default.error('Unhandled Rejection:', err);
            server.close(() => process.exit(1));
        });
        process.on('uncaughtException', (err) => {
            logger_config_1.default.error('Uncaught Exception:', err);
            server.close(() => process.exit(1));
        });
        process.on('SIGTERM', () => {
            logger_config_1.default.info('SIGTERM received. Shutting down gracefully');
            server.close(async () => {
                await prisma_1.default.$disconnect();
                logger_config_1.default.info('Process terminated');
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger_config_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map