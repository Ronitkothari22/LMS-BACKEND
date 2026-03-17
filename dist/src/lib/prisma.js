"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const env_config_1 = require("../config/env.config");
const prisma = new client_1.PrismaClient({
    log: env_config_1.env.isProduction ? ['error'] : ['query', 'info', 'warn', 'error'],
});
exports.default = prisma;
//# sourceMappingURL=prisma.js.map