"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevelAttemptAnalytics = exports.getVideoAnalytics = exports.getTopicAnalytics = void 0;
const lms_analytics_service_1 = __importDefault(require("../services/lms-analytics.service"));
const param_parser_1 = require("../utils/param-parser");
const lms_logger_1 = require("../utils/lms-logger");
const getTopicAnalytics = async (req, res, next) => {
    var _a;
    try {
        const topicId = (0, param_parser_1.getParamString)(req.params.topicId);
        const analytics = await lms_analytics_service_1.default.getTopicAnalytics(topicId);
        (0, lms_logger_1.lmsLogInfo)('LMS_ANALYTICS_FETCH', 'Topic analytics fetched', { topicId, requestedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id });
        res.json({
            success: true,
            message: 'LMS topic analytics fetched successfully',
            data: analytics,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTopicAnalytics = getTopicAnalytics;
const getVideoAnalytics = async (req, res, next) => {
    var _a;
    try {
        const contentId = (0, param_parser_1.getParamString)(req.params.contentId);
        const analytics = await lms_analytics_service_1.default.getVideoAnalytics(contentId);
        (0, lms_logger_1.lmsLogInfo)('LMS_ANALYTICS_FETCH', 'Video analytics fetched', {
            contentId,
            requestedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        res.json({
            success: true,
            message: 'LMS video analytics fetched successfully',
            data: analytics,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getVideoAnalytics = getVideoAnalytics;
const getLevelAttemptAnalytics = async (req, res, next) => {
    var _a;
    try {
        const levelId = (0, param_parser_1.getParamString)(req.params.levelId);
        const analytics = await lms_analytics_service_1.default.getLevelAttemptAnalytics(levelId);
        (0, lms_logger_1.lmsLogInfo)('LMS_ANALYTICS_FETCH', 'Level attempt analytics fetched', {
            levelId,
            requestedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        res.json({
            success: true,
            message: 'LMS level attempt analytics fetched successfully',
            data: analytics,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLevelAttemptAnalytics = getLevelAttemptAnalytics;
//# sourceMappingURL=lms-analytics.controller.js.map