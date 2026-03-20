"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpublishTopic = exports.publishTopic = exports.deleteQuestion = exports.updateQuestion = exports.addLevelQuestions = exports.deleteLevelContent = exports.updateLevelContent = exports.addLevelReadingContent = exports.addLevelVideoContent = exports.deleteLevel = exports.updateLevel = exports.createLevel = exports.deleteTopic = exports.updateTopic = exports.getTopicById = exports.getTopics = exports.createTopic = void 0;
const lms_topic_service_1 = __importDefault(require("../services/lms-topic.service"));
const lms_content_service_1 = __importDefault(require("../services/lms-content.service"));
const param_parser_1 = require("../utils/param-parser");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const parseBoolean = (value) => {
    if (typeof value !== 'string')
        return undefined;
    if (value.toLowerCase() === 'true')
        return true;
    if (value.toLowerCase() === 'false')
        return false;
    return undefined;
};
const createTopic = async (req, res, next) => {
    var _a;
    try {
        const adminId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || '';
        const payload = req.body;
        const topic = await lms_topic_service_1.default.createTopic(payload, adminId);
        logger_config_1.default.info(`LMS topic created: ${topic.title} (${topic.id}) by ${adminId}`);
        res.status(201).json({
            success: true,
            message: 'LMS topic created successfully',
            data: { topic },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTopic = createTopic;
const getTopics = async (req, res, next) => {
    try {
        const topics = await lms_topic_service_1.default.getTopics({
            isPublished: parseBoolean(req.query.isPublished),
            includeInactive: parseBoolean(req.query.includeInactive),
        });
        res.json({
            success: true,
            message: 'LMS topics fetched successfully',
            data: { topics },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTopics = getTopics;
const getTopicById = async (req, res, next) => {
    try {
        const topicId = (0, param_parser_1.getParamString)(req.params.topicId);
        const topic = await lms_topic_service_1.default.getTopicById(topicId);
        res.json({
            success: true,
            message: 'LMS topic fetched successfully',
            data: { topic },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTopicById = getTopicById;
const updateTopic = async (req, res, next) => {
    try {
        const topicId = (0, param_parser_1.getParamString)(req.params.topicId);
        const payload = req.body;
        const topic = await lms_topic_service_1.default.updateTopic(topicId, payload);
        logger_config_1.default.info(`LMS topic updated: ${topic.title} (${topic.id})`);
        res.json({
            success: true,
            message: 'LMS topic updated successfully',
            data: { topic },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTopic = updateTopic;
const deleteTopic = async (req, res, next) => {
    try {
        const topicId = (0, param_parser_1.getParamString)(req.params.topicId);
        const result = await lms_topic_service_1.default.deleteTopic(topicId);
        logger_config_1.default.info(`LMS topic deleted: ${topicId}`);
        res.json({
            success: true,
            message: 'LMS topic deleted successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTopic = deleteTopic;
const createLevel = async (_req, _res, next) => {
    try {
        const topicId = (0, param_parser_1.getParamString)(_req.params.topicId);
        const payload = _req.body;
        const level = await lms_topic_service_1.default.createLevel(topicId, payload);
        logger_config_1.default.info(`LMS level created: ${level.title} (${level.id}) in topic ${topicId}`);
        _res.status(201).json({
            success: true,
            message: 'LMS level created successfully',
            data: { level },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createLevel = createLevel;
const updateLevel = async (_req, _res, next) => {
    try {
        const levelId = (0, param_parser_1.getParamString)(_req.params.levelId);
        const payload = _req.body;
        const level = await lms_topic_service_1.default.updateLevel(levelId, payload);
        logger_config_1.default.info(`LMS level updated: ${level.title} (${level.id})`);
        _res.json({
            success: true,
            message: 'LMS level updated successfully',
            data: { level },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateLevel = updateLevel;
const deleteLevel = async (_req, _res, next) => {
    try {
        const levelId = (0, param_parser_1.getParamString)(_req.params.levelId);
        const result = await lms_topic_service_1.default.deleteLevel(levelId);
        logger_config_1.default.info(`LMS level deleted: ${levelId}`);
        _res.json({
            success: true,
            message: 'LMS level deleted successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteLevel = deleteLevel;
const addLevelVideoContent = async (_req, _res, next) => {
    try {
        const levelId = (0, param_parser_1.getParamString)(_req.params.levelId);
        const content = await lms_content_service_1.default.addVideoContent(levelId, _req.body);
        logger_config_1.default.info(`LMS video content created: ${content.id} for level ${levelId}`);
        _res.status(201).json({
            success: true,
            message: 'LMS video content created successfully',
            data: { content },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addLevelVideoContent = addLevelVideoContent;
const addLevelReadingContent = async (_req, _res, next) => {
    try {
        const levelId = (0, param_parser_1.getParamString)(_req.params.levelId);
        const content = await lms_content_service_1.default.addReadingContent(levelId, _req.body);
        logger_config_1.default.info(`LMS reading content created: ${content.id} for level ${levelId}`);
        _res.status(201).json({
            success: true,
            message: 'LMS reading content created successfully',
            data: { content },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addLevelReadingContent = addLevelReadingContent;
const updateLevelContent = async (req, res, next) => {
    try {
        const contentId = (0, param_parser_1.getParamString)(req.params.contentId);
        const content = await lms_content_service_1.default.updateContent(contentId, req.body);
        logger_config_1.default.info(`LMS content updated: ${contentId}`);
        res.json({
            success: true,
            message: 'LMS content updated successfully',
            data: { content },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateLevelContent = updateLevelContent;
const deleteLevelContent = async (req, res, next) => {
    try {
        const contentId = (0, param_parser_1.getParamString)(req.params.contentId);
        const result = await lms_content_service_1.default.deleteContent(contentId);
        logger_config_1.default.info(`LMS content deleted: ${contentId}`);
        res.json({
            success: true,
            message: 'LMS content deleted successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteLevelContent = deleteLevelContent;
const addLevelQuestions = async (_req, _res, next) => {
    try {
        const levelId = (0, param_parser_1.getParamString)(_req.params.levelId);
        const questions = await lms_content_service_1.default.addQuestions(levelId, _req.body.questions || []);
        logger_config_1.default.info(`LMS questions created: ${questions.length} for level ${levelId}`);
        _res.status(201).json({
            success: true,
            message: 'LMS questions created successfully',
            data: { questions },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addLevelQuestions = addLevelQuestions;
const updateQuestion = async (req, res, next) => {
    try {
        const questionId = (0, param_parser_1.getParamString)(req.params.questionId);
        const question = await lms_content_service_1.default.updateQuestion(questionId, req.body);
        logger_config_1.default.info(`LMS question updated: ${questionId}`);
        res.json({
            success: true,
            message: 'LMS question updated successfully',
            data: { question },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateQuestion = updateQuestion;
const deleteQuestion = async (req, res, next) => {
    try {
        const questionId = (0, param_parser_1.getParamString)(req.params.questionId);
        const result = await lms_content_service_1.default.deleteQuestion(questionId);
        logger_config_1.default.info(`LMS question deleted: ${questionId}`);
        res.json({
            success: true,
            message: 'LMS question deleted successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteQuestion = deleteQuestion;
const publishTopic = async (req, res, next) => {
    try {
        const topicId = (0, param_parser_1.getParamString)(req.params.topicId);
        const topic = await lms_topic_service_1.default.setTopicPublishState(topicId, true);
        logger_config_1.default.info(`LMS topic published: ${topicId}`);
        res.json({
            success: true,
            message: 'LMS topic published successfully',
            data: { topic },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.publishTopic = publishTopic;
const unpublishTopic = async (req, res, next) => {
    try {
        const topicId = (0, param_parser_1.getParamString)(req.params.topicId);
        const topic = await lms_topic_service_1.default.setTopicPublishState(topicId, false);
        logger_config_1.default.info(`LMS topic unpublished: ${topicId}`);
        res.json({
            success: true,
            message: 'LMS topic unpublished successfully',
            data: { topic },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.unpublishTopic = unpublishTopic;
//# sourceMappingURL=lms-admin.controller.js.map