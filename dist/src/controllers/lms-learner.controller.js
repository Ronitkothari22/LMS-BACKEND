"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopicLeaderboard = exports.getGlobalLeaderboard = exports.getMyProgress = exports.completeMyLevel = exports.createMyLevelAttempt = exports.updateMyVideoProgress = exports.getMyLevelById = exports.getMyTopicById = exports.getMyTopics = void 0;
const lms_progress_service_1 = __importDefault(require("../services/lms-progress.service"));
const lms_gamification_service_1 = __importDefault(require("../services/lms-gamification.service"));
const param_parser_1 = require("../utils/param-parser");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const lms_logger_1 = require("../utils/lms-logger");
const getMyTopics = async (req, res, next) => {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || '';
        const topics = await lms_progress_service_1.default.getMyTopics(userId);
        res.json({
            success: true,
            message: 'LMS learner topics fetched successfully',
            data: { topics },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTopics = getMyTopics;
const getMyTopicById = async (req, res, next) => {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || '';
        const topicId = (0, param_parser_1.getParamString)(req.params.topicId);
        const topic = await lms_progress_service_1.default.getMyTopicById(userId, topicId);
        res.json({
            success: true,
            message: 'LMS learner topic fetched successfully',
            data: { topic },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTopicById = getMyTopicById;
const getMyLevelById = async (req, res, next) => {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || '';
        const levelId = (0, param_parser_1.getParamString)(req.params.levelId);
        const level = await lms_progress_service_1.default.getMyLevelById(userId, levelId);
        res.json({
            success: true,
            message: 'LMS learner level fetched successfully',
            data: { level },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyLevelById = getMyLevelById;
const updateMyVideoProgress = async (req, res, next) => {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || '';
        const levelId = (0, param_parser_1.getParamString)(req.params.levelId);
        const progress = await lms_progress_service_1.default.updateVideoProgress(userId, levelId, req.body);
        res.json({
            success: true,
            message: 'LMS video progress updated successfully',
            data: progress,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMyVideoProgress = updateMyVideoProgress;
const createMyLevelAttempt = async (req, res, next) => {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || '';
        const levelId = (0, param_parser_1.getParamString)(req.params.levelId);
        const attempt = await lms_progress_service_1.default.createLevelAttempt(userId, levelId, req.body);
        res.status(201).json({
            success: true,
            message: 'LMS level attempt submitted successfully',
            data: attempt,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createMyLevelAttempt = createMyLevelAttempt;
const completeMyLevel = async (req, res, next) => {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || '';
        const levelId = (0, param_parser_1.getParamString)(req.params.levelId);
        const force = Boolean((_b = req.body) === null || _b === void 0 ? void 0 : _b.force);
        const completion = await lms_progress_service_1.default.completeLevel(userId, levelId, force);
        logger_config_1.default.info(`LMS level completion processed: level=${levelId}, user=${userId}`);
        res.json({
            success: true,
            message: 'LMS level completion evaluated successfully',
            data: completion,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.completeMyLevel = completeMyLevel;
const getMyProgress = async (req, res, next) => {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || '';
        const progress = await lms_progress_service_1.default.getMyProgress(userId);
        res.json({
            success: true,
            message: 'LMS learner progress fetched successfully',
            data: progress,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyProgress = getMyProgress;
const getGlobalLeaderboard = async (_req, _res, next) => {
    var _a;
    try {
        const limitRaw = _req.query.limit;
        const limit = typeof limitRaw === 'string' ? Number(limitRaw) : undefined;
        const leaderboard = await lms_gamification_service_1.default.getGlobalLeaderboard(limit);
        (0, lms_logger_1.lmsLogInfo)('LMS_LEADERBOARD_FETCH', 'Global leaderboard fetched', {
            requestedBy: (_a = _req.user) === null || _a === void 0 ? void 0 : _a.id,
            limit: limit || 50,
        });
        _res.json({
            success: true,
            message: 'LMS global leaderboard fetched successfully',
            data: { leaderboard },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGlobalLeaderboard = getGlobalLeaderboard;
const getTopicLeaderboard = async (req, res, next) => {
    var _a;
    try {
        const topicId = (0, param_parser_1.getParamString)(req.params.topicId);
        const limitRaw = req.query.limit;
        const limit = typeof limitRaw === 'string' ? Number(limitRaw) : undefined;
        const leaderboard = await lms_gamification_service_1.default.getTopicLeaderboard(topicId, limit);
        (0, lms_logger_1.lmsLogInfo)('LMS_LEADERBOARD_FETCH', 'Topic leaderboard fetched', {
            requestedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            topicId,
            limit: limit || 50,
        });
        res.json({
            success: true,
            message: 'LMS topic leaderboard fetched successfully',
            data: leaderboard,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTopicLeaderboard = getTopicLeaderboard;
//# sourceMappingURL=lms-learner.controller.js.map