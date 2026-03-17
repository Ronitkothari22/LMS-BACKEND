"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionController = __importStar(require("../controllers/session.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const session_validation_1 = require("../validations/session.validation");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(session_validation_1.createSessionSchema), sessionController.createSession);
router.put('/:sessionId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(session_validation_1.updateSessionSchema), sessionController.updateSession);
router.post('/join', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(session_validation_1.joinSessionSchema), sessionController.joinSession);
router.patch('/:sessionId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(session_validation_1.toggleSessionStatusSchema), sessionController.toggleSessionStatus);
router.post('/bulk-invite', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, upload_middleware_1.upload.single('file'), (0, validate_middleware_1.validateRequest)(session_validation_1.bulkSessionInviteSchema), sessionController.bulkSessionInvite);
router.post('/:sessionId/invite', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(session_validation_1.addEmailToSessionSchema), sessionController.addEmailToSession);
router.post('/:sessionId/assign', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(session_validation_1.assignUsersToSessionSchema), sessionController.assignUsersToSession);
router.delete('/:sessionId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(session_validation_1.deleteSessionSchema), sessionController.deleteSession);
router.get('/', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(session_validation_1.getSessionsSchema), sessionController.getSessions);
router.get('/user', auth_middleware_1.authenticateToken, sessionController.getUserSessions);
router.get('/:sessionId/quiz-scoring', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(session_validation_1.getSessionQuizScoringSchema), sessionController.getSessionQuizScoring);
router.get('/:sessionId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(session_validation_1.getSessionByIdSchema), sessionController.getSessionById);
exports.default = router;
//# sourceMappingURL=session.routes.js.map