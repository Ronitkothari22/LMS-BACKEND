import { RequestHandler } from 'express';
import lmsAnalyticsService from '../services/lms-analytics.service';
import { getParamString } from '../utils/param-parser';
import { lmsLogInfo } from '../utils/lms-logger';

export const getTopicAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const topicId = getParamString(req.params.topicId);
    const analytics = await lmsAnalyticsService.getTopicAnalytics(topicId);
    lmsLogInfo('LMS_ANALYTICS_FETCH', 'Topic analytics fetched', { topicId, requestedBy: req.user?.id });
    res.json({
      success: true,
      message: 'LMS topic analytics fetched successfully',
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

export const getVideoAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const contentId = getParamString(req.params.contentId);
    const analytics = await lmsAnalyticsService.getVideoAnalytics(contentId);
    lmsLogInfo('LMS_ANALYTICS_FETCH', 'Video analytics fetched', {
      contentId,
      requestedBy: req.user?.id,
    });
    res.json({
      success: true,
      message: 'LMS video analytics fetched successfully',
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

export const getLevelAttemptAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const levelId = getParamString(req.params.levelId);
    const analytics = await lmsAnalyticsService.getLevelAttemptAnalytics(levelId);
    lmsLogInfo('LMS_ANALYTICS_FETCH', 'Level attempt analytics fetched', {
      levelId,
      requestedBy: req.user?.id,
    });
    res.json({
      success: true,
      message: 'LMS level attempt analytics fetched successfully',
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};
