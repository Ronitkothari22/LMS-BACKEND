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
const feedbackController = __importStar(require("../controllers/feedback.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const feedback_validation_1 = require("../validations/feedback.validation");
const router = (0, express_1.Router)();
router.post('/:sessionId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(feedback_validation_1.createFeedbackSchema), feedbackController.createFeedback);
router.get('/:sessionId', auth_middleware_1.authenticateToken, feedbackController.getFeedback);
router.post('/:sessionId/submit', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(feedback_validation_1.submitFeedbackResponseSchema), feedbackController.submitFeedbackResponse);
router.get('/:sessionId/results', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, feedbackController.getFeedbackResults);
router.put('/:sessionId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(feedback_validation_1.updateFeedbackSchema), feedbackController.updateFeedback);
router.delete('/:sessionId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(feedback_validation_1.deleteFeedbackSchema), feedbackController.deleteFeedback);
router.post('/:sessionId/questions', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(feedback_validation_1.addFeedbackQuestionSchema), feedbackController.addFeedbackQuestion);
router.put('/:sessionId/questions/:questionId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(feedback_validation_1.updateFeedbackQuestionSchema), feedbackController.updateFeedbackQuestion);
router.delete('/:sessionId/questions/:questionId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(feedback_validation_1.deleteFeedbackQuestionSchema), feedbackController.deleteFeedbackQuestion);
router.put('/:sessionId/reorder-questions', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(feedback_validation_1.reorderFeedbackQuestionsSchema), feedbackController.reorderFeedbackQuestions);
router.get('/:sessionId/forms/:feedbackId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(feedback_validation_1.getSingleFeedbackSchema), feedbackController.getSingleFeedback);
router.post('/:sessionId/forms/:feedbackId/submit', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(feedback_validation_1.submitFeedbackResponsePathSchema), feedbackController.submitFeedbackResponse);
exports.default = router;
//# sourceMappingURL=feedback.routes.js.map