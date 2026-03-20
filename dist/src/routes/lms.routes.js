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
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const lmsAdminController = __importStar(require("../controllers/lms-admin.controller"));
const lmsLearnerController = __importStar(require("../controllers/lms-learner.controller"));
const lmsAnalyticsController = __importStar(require("../controllers/lms-analytics.controller"));
const lms_validation_1 = require("../validations/lms.validation");
const router = (0, express_1.Router)();
router.post('/topics', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.createTopicSchema), lmsAdminController.createTopic);
router.get('/topics', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.getTopicsSchema), lmsAdminController.getTopics);
router.get('/topics/:topicId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.topicIdParamSchema), lmsAdminController.getTopicById);
router.put('/topics/:topicId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.updateTopicSchema), lmsAdminController.updateTopic);
router.delete('/topics/:topicId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.topicIdParamSchema), lmsAdminController.deleteTopic);
router.post('/topics/:topicId/publish', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.topicIdParamSchema), lmsAdminController.publishTopic);
router.post('/topics/:topicId/unpublish', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.topicIdParamSchema), lmsAdminController.unpublishTopic);
router.post('/topics/:topicId/levels', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.createLevelSchema), lmsAdminController.createLevel);
router.put('/levels/:levelId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.updateLevelSchema), lmsAdminController.updateLevel);
router.delete('/levels/:levelId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.levelIdParamSchema), lmsAdminController.deleteLevel);
router.post('/levels/:levelId/content/video', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.addLevelVideoContentSchema), lmsAdminController.addLevelVideoContent);
router.post('/levels/:levelId/content/reading', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.addLevelReadingContentSchema), lmsAdminController.addLevelReadingContent);
router.put('/content/:contentId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.updateLevelContentSchema), lmsAdminController.updateLevelContent);
router.delete('/content/:contentId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.contentIdParamSchema), lmsAdminController.deleteLevelContent);
router.post('/levels/:levelId/questions', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.addLevelQuestionsSchema), lmsAdminController.addLevelQuestions);
router.put('/questions/:questionId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.updateQuestionSchema), lmsAdminController.updateQuestion);
router.delete('/questions/:questionId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.questionIdParamSchema), lmsAdminController.deleteQuestion);
router.get('/me/topics', auth_middleware_1.authenticateToken, lmsLearnerController.getMyTopics);
router.get('/me/topics/:topicId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(lms_validation_1.topicIdParamSchema), lmsLearnerController.getMyTopicById);
router.get('/me/levels/:levelId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(lms_validation_1.getMyLevelByIdSchema), lmsLearnerController.getMyLevelById);
router.post('/me/levels/:levelId/video-progress', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(lms_validation_1.updateVideoProgressSchema), lmsLearnerController.updateMyVideoProgress);
router.post('/me/levels/:levelId/attempts', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(lms_validation_1.createLevelAttemptSchema), lmsLearnerController.createMyLevelAttempt);
router.post('/me/levels/:levelId/complete', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(lms_validation_1.completeLevelSchema), lmsLearnerController.completeMyLevel);
router.get('/me/progress', auth_middleware_1.authenticateToken, lmsLearnerController.getMyProgress);
router.get('/leaderboard/global', auth_middleware_1.authenticateToken, lmsLearnerController.getGlobalLeaderboard);
router.get('/leaderboard/topics/:topicId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(lms_validation_1.topicLeaderboardSchema), lmsLearnerController.getTopicLeaderboard);
router.get('/analytics/topics/:topicId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.topicAnalyticsSchema), lmsAnalyticsController.getTopicAnalytics);
router.get('/analytics/videos/:contentId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.videoAnalyticsSchema), lmsAnalyticsController.getVideoAnalytics);
router.get('/analytics/levels/:levelId/attempts', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(lms_validation_1.levelAttemptAnalyticsSchema), lmsAnalyticsController.getLevelAttemptAnalytics);
exports.default = router;
//# sourceMappingURL=lms.routes.js.map