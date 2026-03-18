import { RequestHandler } from 'express';
import lmsProgressService from '../services/lms-progress.service';
import lmsGamificationService from '../services/lms-gamification.service';
import { getParamString } from '../utils/param-parser';
import logger from '../config/logger.config';
import { lmsLogInfo } from '../utils/lms-logger';

export const getMyTopics: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || '';
    const topics = await lmsProgressService.getMyTopics(userId);
    res.json({
      success: true,
      message: 'LMS learner topics fetched successfully',
      data: { topics },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTopicById: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || '';
    const topicId = getParamString(req.params.topicId);
    const topic = await lmsProgressService.getMyTopicById(userId, topicId);
    res.json({
      success: true,
      message: 'LMS learner topic fetched successfully',
      data: { topic },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLevelById: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || '';
    const levelId = getParamString(req.params.levelId);
    const level = await lmsProgressService.getMyLevelById(userId, levelId);
    res.json({
      success: true,
      message: 'LMS learner level fetched successfully',
      data: { level },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyVideoProgress: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || '';
    const levelId = getParamString(req.params.levelId);
    const progress = await lmsProgressService.updateVideoProgress(userId, levelId, req.body);

    res.json({
      success: true,
      message: 'LMS video progress updated successfully',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const createMyLevelAttempt: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || '';
    const levelId = getParamString(req.params.levelId);
    const attempt = await lmsProgressService.createLevelAttempt(userId, levelId, req.body);

    res.status(201).json({
      success: true,
      message: 'LMS level attempt submitted successfully',
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

export const completeMyLevel: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || '';
    const levelId = getParamString(req.params.levelId);
    const force = Boolean(req.body?.force);
    const completion = await lmsProgressService.completeLevel(userId, levelId, force);

    logger.info(`LMS level completion processed: level=${levelId}, user=${userId}`);
    res.json({
      success: true,
      message: 'LMS level completion evaluated successfully',
      data: completion,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProgress: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id || '';
    const progress = await lmsProgressService.getMyProgress(userId);
    res.json({
      success: true,
      message: 'LMS learner progress fetched successfully',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const getGlobalLeaderboard: RequestHandler = async (_req, _res, next) => {
  try {
    const limitRaw = _req.query.limit;
    const limit = typeof limitRaw === 'string' ? Number(limitRaw) : undefined;
    const leaderboard = await lmsGamificationService.getGlobalLeaderboard(limit);
    lmsLogInfo('LMS_LEADERBOARD_FETCH', 'Global leaderboard fetched', {
      requestedBy: _req.user?.id,
      limit: limit || 50,
    });
    _res.json({
      success: true,
      message: 'LMS global leaderboard fetched successfully',
      data: { leaderboard },
    });
  } catch (error) {
    next(error);
  }
};

export const getTopicLeaderboard: RequestHandler = async (req, res, next) => {
  try {
    const topicId = getParamString(req.params.topicId);
    const limitRaw = req.query.limit;
    const limit = typeof limitRaw === 'string' ? Number(limitRaw) : undefined;
    const leaderboard = await lmsGamificationService.getTopicLeaderboard(topicId, limit);
    lmsLogInfo('LMS_LEADERBOARD_FETCH', 'Topic leaderboard fetched', {
      requestedBy: req.user?.id,
      topicId,
      limit: limit || 50,
    });
    res.json({
      success: true,
      message: 'LMS topic leaderboard fetched successfully',
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
};
