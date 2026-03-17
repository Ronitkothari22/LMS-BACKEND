"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const onboarding_routes_1 = __importDefault(require("./onboarding.routes"));
const session_routes_1 = __importDefault(require("./session.routes"));
const quiz_routes_1 = __importDefault(require("./quiz.routes"));
const poll_routes_1 = __importDefault(require("./poll.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const content_routes_1 = __importDefault(require("./content.routes"));
const team_routes_1 = __importDefault(require("./team.routes"));
const feedback_routes_1 = __importDefault(require("./feedback.routes"));
const organization_routes_1 = __importDefault(require("./organization.routes"));
const survey_routes_1 = __importDefault(require("./survey.routes"));
const router = (0, express_1.Router)();
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://69.62.61.93:3000',
    'http://69.62.61.93:3001',
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
router.options('/*', (req, res) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
});
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/onboarding', onboarding_routes_1.default);
router.use('/sessions', session_routes_1.default);
router.use('/quizzes', quiz_routes_1.default);
router.use('/poll', poll_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
router.use('/content', content_routes_1.default);
router.use('/teams', team_routes_1.default);
router.use('/feedback', feedback_routes_1.default);
router.use('/organization', organization_routes_1.default);
router.use('/survey', survey_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map