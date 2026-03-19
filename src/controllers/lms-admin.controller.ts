import { RequestHandler } from 'express';
import lmsTopicService from '../services/lms-topic.service';
import lmsContentService from '../services/lms-content.service';
import { getParamString } from '../utils/param-parser';
import logger from '../config/logger.config';
import type { CreateLmsTopicInput, UpdateLmsTopicInput } from '../types/lms.types';

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
};

export const createTopic: RequestHandler = async (req, res, next) => {
  try {
    const adminId = req.user?.id || '';
    const payload = req.body as CreateLmsTopicInput;
    const topic = await lmsTopicService.createTopic(payload, adminId);

    logger.info(`LMS topic created: ${topic.title} (${topic.id}) by ${adminId}`);
    res.status(201).json({
      success: true,
      message: 'LMS topic created successfully',
      data: { topic },
    });
  } catch (error) {
    next(error);
  }
};

export const getTopics: RequestHandler = async (req, res, next) => {
  try {
    const topics = await lmsTopicService.getTopics({
      isPublished: parseBoolean(req.query.isPublished),
      includeInactive: parseBoolean(req.query.includeInactive),
    });

    res.json({
      success: true,
      message: 'LMS topics fetched successfully',
      data: { topics },
    });
  } catch (error) {
    next(error);
  }
};

export const getTopicById: RequestHandler = async (req, res, next) => {
  try {
    const topicId = getParamString(req.params.topicId);
    const topic = await lmsTopicService.getTopicById(topicId);
    res.json({
      success: true,
      message: 'LMS topic fetched successfully',
      data: { topic },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTopic: RequestHandler = async (req, res, next) => {
  try {
    const topicId = getParamString(req.params.topicId);
    const payload = req.body as UpdateLmsTopicInput;
    const topic = await lmsTopicService.updateTopic(topicId, payload);

    logger.info(`LMS topic updated: ${topic.title} (${topic.id})`);
    res.json({
      success: true,
      message: 'LMS topic updated successfully',
      data: { topic },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTopic: RequestHandler = async (req, res, next) => {
  try {
    const topicId = getParamString(req.params.topicId);
    const result = await lmsTopicService.deleteTopic(topicId);

    logger.info(`LMS topic deleted: ${topicId}`);
    res.json({
      success: true,
      message: 'LMS topic deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createLevel: RequestHandler = async (_req, _res, next) => {
  try {
    const topicId = getParamString(_req.params.topicId);
    const payload = _req.body;
    const level = await lmsTopicService.createLevel(topicId, payload);

    logger.info(`LMS level created: ${level.title} (${level.id}) in topic ${topicId}`);
    _res.status(201).json({
      success: true,
      message: 'LMS level created successfully',
      data: { level },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLevel: RequestHandler = async (_req, _res, next) => {
  try {
    const levelId = getParamString(_req.params.levelId);
    const payload = _req.body;
    const level = await lmsTopicService.updateLevel(levelId, payload);

    logger.info(`LMS level updated: ${level.title} (${level.id})`);
    _res.json({
      success: true,
      message: 'LMS level updated successfully',
      data: { level },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLevel: RequestHandler = async (_req, _res, next) => {
  try {
    const levelId = getParamString(_req.params.levelId);
    const result = await lmsTopicService.deleteLevel(levelId);

    logger.info(`LMS level deleted: ${levelId}`);
    _res.json({
      success: true,
      message: 'LMS level deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const addLevelVideoContent: RequestHandler = async (_req, _res, next) => {
  try {
    const levelId = getParamString(_req.params.levelId);
    const content = await lmsContentService.addVideoContent(levelId, _req.body);

    logger.info(`LMS video content created: ${content.id} for level ${levelId}`);
    _res.status(201).json({
      success: true,
      message: 'LMS video content created successfully',
      data: { content },
    });
  } catch (error) {
    next(error);
  }
};

export const addLevelReadingContent: RequestHandler = async (_req, _res, next) => {
  try {
    const levelId = getParamString(_req.params.levelId);
    const content = await lmsContentService.addReadingContent(levelId, _req.body);

    logger.info(`LMS reading content created: ${content.id} for level ${levelId}`);
    _res.status(201).json({
      success: true,
      message: 'LMS reading content created successfully',
      data: { content },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLevelContent: RequestHandler = async (req, res, next) => {
  try {
    const contentId = getParamString(req.params.contentId);
    const content = await lmsContentService.updateContent(contentId, req.body);

    logger.info(`LMS content updated: ${contentId}`);
    res.json({
      success: true,
      message: 'LMS content updated successfully',
      data: { content },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLevelContent: RequestHandler = async (req, res, next) => {
  try {
    const contentId = getParamString(req.params.contentId);
    const result = await lmsContentService.deleteContent(contentId);

    logger.info(`LMS content deleted: ${contentId}`);
    res.json({
      success: true,
      message: 'LMS content deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const addLevelQuestions: RequestHandler = async (_req, _res, next) => {
  try {
    const levelId = getParamString(_req.params.levelId);
    const questions = await lmsContentService.addQuestions(levelId, _req.body.questions || []);

    logger.info(`LMS questions created: ${questions.length} for level ${levelId}`);
    _res.status(201).json({
      success: true,
      message: 'LMS questions created successfully',
      data: { questions },
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion: RequestHandler = async (req, res, next) => {
  try {
    const questionId = getParamString(req.params.questionId);
    const question = await lmsContentService.updateQuestion(questionId, req.body);

    logger.info(`LMS question updated: ${questionId}`);
    res.json({
      success: true,
      message: 'LMS question updated successfully',
      data: { question },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion: RequestHandler = async (req, res, next) => {
  try {
    const questionId = getParamString(req.params.questionId);
    const result = await lmsContentService.deleteQuestion(questionId);

    logger.info(`LMS question deleted: ${questionId}`);
    res.json({
      success: true,
      message: 'LMS question deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const publishTopic: RequestHandler = async (req, res, next) => {
  try {
    const topicId = getParamString(req.params.topicId);
    const topic = await lmsTopicService.setTopicPublishState(topicId, true);

    logger.info(`LMS topic published: ${topicId}`);
    res.json({
      success: true,
      message: 'LMS topic published successfully',
      data: { topic },
    });
  } catch (error) {
    next(error);
  }
};

export const unpublishTopic: RequestHandler = async (req, res, next) => {
  try {
    const topicId = getParamString(req.params.topicId);
    const topic = await lmsTopicService.setTopicPublishState(topicId, false);

    logger.info(`LMS topic unpublished: ${topicId}`);
    res.json({
      success: true,
      message: 'LMS topic unpublished successfully',
      data: { topic },
    });
  } catch (error) {
    next(error);
  }
};
