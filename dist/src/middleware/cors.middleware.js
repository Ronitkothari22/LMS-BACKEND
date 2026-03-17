"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const corsMiddleware = (req, res, next) => {
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
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
};
exports.corsMiddleware = corsMiddleware;
//# sourceMappingURL=cors.middleware.js.map