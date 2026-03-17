import { Request, Response, NextFunction, RequestHandler } from 'express';
import HttpException from '../utils/http-exception';
import logger from '../config/logger.config';
import prisma from '../lib/prisma';
import { FeedbackType, SmileyRating } from '@prisma/client';

// Create feedback form for a session (Admin only)
export const createFeedback: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { title, description, isAnonymous, questions } = req.body;

    // Ensure sessionId is a string
    const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: normalizedSessionId },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Multiple feedback forms are now allowed per session
    // No need to check for existing feedback

    // Create feedback with questions
    const feedback = await prisma.feedback.create({
      data: {
        title,
        description,
        sessionId: normalizedSessionId,
        isAnonymous: isAnonymous || false,
        questions: {
          create: questions.map(
            (
              q: { question: string; type?: FeedbackType; isRequired?: boolean },
              index: number,
            ) => ({
              question: q.question,
              type: q.type || FeedbackType.SMILEY_SCALE,
              isRequired: q.isRequired !== undefined ? q.isRequired : true,
              order: index + 1,
            }),
          ),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        session: {
          select: {
            title: true,
            state: true,
          },
        },
      },
    });

    logger.info(`Feedback form created for session ${sessionId}`);

    res.status(201).json({
      success: true,
      message: 'Feedback form created successfully',
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

// Get all feedback forms for a session
export const getFeedback: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpException(401, 'User not authenticated');
    }

    // Ensure sessionId is a string
    const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;

    // Get all feedback forms for this session
    const feedbacks = await prisma.feedback.findMany({
      where: { sessionId: normalizedSessionId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        session: {
          select: {
            title: true,
            state: true,
            participants: {
              where: { id: userId },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (feedbacks.length === 0) {
      throw new HttpException(404, 'No feedback forms found for this session');
    }

    // Check if user is a participant of the session
    const isParticipant = feedbacks[0].session.participants.length > 0;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isParticipant && !isAdmin) {
      throw new HttpException(
        403,
        'You are not authorized to view feedback forms for this session',
      );
    }

    // Check submission status for each feedback form
    const feedbacksWithStatus = await Promise.all(
      feedbacks.map(async feedback => {
        const existingResponse = await prisma.feedbackResponse.findFirst({
          where: {
            feedbackId: feedback.id,
            userId,
          },
        });

        return {
          ...feedback,
          hasSubmitted: !!existingResponse,
        };
      }),
    );

    res.json({
      success: true,
      data: feedbacksWithStatus,
    });
  } catch (error) {
    next(error);
  }
};

// Get single feedback form
export const getSingleFeedback: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId, feedbackId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpException(401, 'User not authenticated');
    }

    // Ensure sessionId and feedbackId are strings
    const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
    const normalizedFeedbackId = Array.isArray(feedbackId) ? feedbackId[0] : feedbackId;

    const feedback = await prisma.feedback.findFirst({
      where: { id: normalizedFeedbackId, sessionId: normalizedSessionId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        session: {
          select: {
            title: true,
            state: true,
            participants: {
              where: { id: userId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!feedback) {
      throw new HttpException(404, 'Feedback form not found for this session');
    }

    const isParticipant = feedback.session.participants.length > 0;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isParticipant && !isAdmin) {
      throw new HttpException(
        403,
        'You are not authorized to view this feedback form for this session',
      );
    }

    // Check if the user has already submitted
    const existingResponse = await prisma.feedbackResponse.findFirst({
      where: {
        feedbackId: normalizedFeedbackId,
        userId,
      },
    });

    res.json({
      success: true,
      data: {
        ...feedback,
        hasSubmitted: !!existingResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Submit feedback response
export const submitFeedbackResponse: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId, feedbackId: feedbackIdParam } = req.params;
    const { feedbackId: feedbackIdBody, responses } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new HttpException(401, 'User not authenticated');
    }

    // Determine feedbackId source (URL param takes precedence)
    let feedbackId = feedbackIdParam || feedbackIdBody;

    // Ensure feedbackId is a string
    if (Array.isArray(feedbackId)) {
      feedbackId = feedbackId[0];
    }

    if (!feedbackId) {
      throw new HttpException(400, 'Feedback ID is required');
    }

    // Normalize feedbackId to string
    const normalizedFeedbackId = String(feedbackId);

    // Get feedback form by ID and verify it belongs to the specified session
    const feedback = await prisma.feedback.findUnique({
      where: { id: normalizedFeedbackId },
      include: {
        questions: true,
        session: {
          select: {
            id: true,
            participants: {
              where: { id: userId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!feedback) {
      throw new HttpException(404, 'Feedback form not found');
    }

    // Verify the feedback belongs to the specified session
    if (feedback.session.id !== sessionId) {
      throw new HttpException(400, 'Feedback form does not belong to the specified session');
    }

    if (!feedback.isActive) {
      throw new HttpException(400, 'Feedback form is not active');
    }

    // Check if user is a participant
    const isParticipant = feedback.session.participants.length > 0;
    if (!isParticipant) {
      throw new HttpException(403, 'You are not a participant of this session');
    }

    // Check if user has already submitted feedback
    const existingResponse = await prisma.feedbackResponse.findFirst({
      where: {
        feedbackId: normalizedFeedbackId,
        userId,
      },
    });

    if (existingResponse) {
      throw new HttpException(400, 'You have already submitted feedback for this session');
    }

    // Validate responses
    const requiredQuestionIds = feedback.questions.filter(q => q.isRequired).map(q => q.id);

    // Check if all required questions are answered
    const answeredQuestionIds = responses.map((r: { questionId: string }) => r.questionId);
    const missingRequiredQuestions = requiredQuestionIds.filter(
      qId => !answeredQuestionIds.includes(qId),
    );

    if (missingRequiredQuestions.length > 0) {
      throw new HttpException(400, 'Please answer all required questions');
    }

    // Create responses
    const feedbackResponses = await Promise.all(
      responses.map(
        async (response: { questionId: string; rating?: string; textAnswer?: string }) => {
          const question = feedback.questions.find(q => q.id === response.questionId);

          if (!question) {
            throw new HttpException(400, `Invalid question ID: ${response.questionId}`);
          }

          // Validate response based on question type
          if (question.type === FeedbackType.SMILEY_SCALE) {
            if (
              !response.rating ||
              !Object.values(SmileyRating).includes(response.rating as SmileyRating)
            ) {
              throw new HttpException(
                400,
                `Invalid smiley rating for question: ${question.question}`,
              );
            }
          }

          return prisma.feedbackResponse.create({
            data: {
              feedbackId: feedback.id,
              questionId: response.questionId,
              userId,
              rating: (response.rating as SmileyRating) || null,
              textAnswer: response.textAnswer || null,
              isAnonymous: feedback.isAnonymous,
            },
          });
        },
      ),
    );

    logger.info(`Feedback response submitted by user ${userId} for session ${sessionId}`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        responseCount: feedbackResponses.length,
        submittedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get feedback results for all feedback forms in a session (Admin only)
export const getFeedbackResults: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Ensure sessionId is a string
    const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;

    // Get all feedback forms for this session
    const feedbacks = await prisma.feedback.findMany({
      where: { sessionId: normalizedSessionId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            responses: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        session: {
          select: {
            title: true,
            participants: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (feedbacks.length === 0) {
      throw new HttpException(404, 'No feedback forms found for this session');
    }

    // Calculate statistics for each feedback form
    const feedbackResults = await Promise.all(
      feedbacks.map(async feedback => {
        const totalParticipants = feedback.session.participants.length;
        const totalResponses = await prisma.feedbackResponse.findMany({
          where: { feedbackId: feedback.id },
          distinct: ['userId'],
        });
        const responseRate =
          totalParticipants > 0 ? (totalResponses.length / totalParticipants) * 100 : 0;

        // Process results by question
        const questionResults = feedback.questions.map(
          (question: {
            id: string;
            question: string;
            type: FeedbackType;
            responses: {
              rating: string | null;
              user: { id: string; name: string; email: string };
              createdAt: Date;
              textAnswer: string | null;
            }[];
          }) => {
            const responses = question.responses;
            const responseCount = responses.length;

            if (question.type === FeedbackType.SMILEY_SCALE) {
              // Calculate smiley rating statistics
              const ratingCounts = {
                VERY_POOR: 0,
                POOR: 0,
                AVERAGE: 0,
                GOOD: 0,
                EXCELLENT: 0,
              };

              responses.forEach((response: { rating: string | null }) => {
                if (response.rating) {
                  ratingCounts[response.rating as keyof typeof ratingCounts]++;
                }
              });

              // Calculate average rating (1-5 scale)
              const ratingValues = {
                VERY_POOR: 1,
                POOR: 2,
                AVERAGE: 3,
                GOOD: 4,
                EXCELLENT: 5,
              };

              const totalRatingSum = responses.reduce(
                (sum: number, response: { rating: string | null }) => {
                  return (
                    sum +
                    (response.rating
                      ? ratingValues[response.rating as keyof typeof ratingValues]
                      : 0)
                  );
                },
                0,
              );

              const averageRating = responseCount > 0 ? totalRatingSum / responseCount : 0;

              return {
                questionId: question.id,
                question: question.question,
                type: question.type,
                responseCount,
                ratingCounts,
                averageRating: Math.round(averageRating * 100) / 100,
                responses: feedback.isAnonymous
                  ? undefined
                  : responses.map(
                      (r: {
                        user: { id: string; name: string; email: string };
                        rating: string | null;
                        createdAt: Date;
                      }) => ({
                        user: r.user,
                        rating: r.rating,
                        submittedAt: r.createdAt,
                      }),
                    ),
              };
            } else {
              // Text responses
              return {
                questionId: question.id,
                question: question.question,
                type: question.type,
                responseCount,
                responses: responses.map(
                  (r: {
                    user: { id: string; name: string; email: string };
                    textAnswer: string | null;
                    createdAt: Date;
                  }) => ({
                    user: feedback.isAnonymous ? undefined : r.user,
                    textAnswer: r.textAnswer,
                    submittedAt: r.createdAt,
                  }),
                ),
              };
            }
          },
        );

        return {
          feedback: {
            id: feedback.id,
            title: feedback.title,
            description: feedback.description,
            isAnonymous: feedback.isAnonymous,
            createdAt: feedback.createdAt,
          },
          statistics: {
            totalParticipants,
            totalResponseCount: totalResponses.length,
            responseRate: Math.round(responseRate * 100) / 100,
          },
          questionResults,
        };
      }),
    );

    res.json({
      success: true,
      data: {
        session: {
          title: feedbacks[0].session.title,
        },
        feedbackForms: feedbackResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update feedback form (Admin only)
export const updateFeedback: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { feedbackId, title, description, isActive, isAnonymous } = req.body;

    // Get feedback by ID and verify it belongs to the specified session
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        session: {
          select: { id: true },
        },
      },
    });

    if (!feedback) {
      throw new HttpException(404, 'Feedback form not found');
    }

    // Verify the feedback belongs to the specified session
    if (feedback.session.id !== sessionId) {
      throw new HttpException(400, 'Feedback form does not belong to the specified session');
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(isAnonymous !== undefined && { isAnonymous }),
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    logger.info(`Feedback form ${feedbackId} updated for session ${sessionId}`);

    res.json({
      success: true,
      message: 'Feedback form updated successfully',
      data: updatedFeedback,
    });
  } catch (error) {
    next(error);
  }
};

// Delete feedback form (Admin only)
export const deleteFeedback: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { feedbackId } = req.body;

    // Get feedback by ID and verify it belongs to the specified session
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        session: {
          select: { id: true },
        },
      },
    });

    if (!feedback) {
      throw new HttpException(404, 'Feedback form not found');
    }

    // Verify the feedback belongs to the specified session
    if (feedback.session.id !== sessionId) {
      throw new HttpException(400, 'Feedback form does not belong to the specified session');
    }

    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    logger.info(`Feedback form ${feedbackId} deleted for session ${sessionId}`);

    res.json({
      success: true,
      message: 'Feedback form deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Add question to existing feedback form (Admin only)
export const addFeedbackQuestion: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { feedbackId, question, type, isRequired, order } = req.body;

    // Get feedback by ID and verify it belongs to the specified session
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        session: {
          select: { id: true },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!feedback) {
      throw new HttpException(404, 'Feedback form not found');
    }

    // Verify the feedback belongs to the specified session
    if (feedback.session.id !== sessionId) {
      throw new HttpException(400, 'Feedback form does not belong to the specified session');
    }

    // Check if feedback has responses - prevent editing if responses exist
    const responseCount = await prisma.feedbackResponse.count({
      where: { feedbackId },
    });

    if (responseCount > 0) {
      throw new HttpException(
        400,
        'Cannot add questions to feedback form that already has responses',
      );
    }

    // Determine the order for the new question
    const questionOrder =
      order ||
      (feedback.questions.length > 0 ? Math.max(...feedback.questions.map(q => q.order)) + 1 : 1);

    // Create new question
    const newQuestion = await prisma.feedbackQuestion.create({
      data: {
        feedbackId,
        question,
        type: type || FeedbackType.SMILEY_SCALE,
        isRequired: isRequired !== undefined ? isRequired : true,
        order: questionOrder,
      },
    });

    logger.info(`Question added to feedback form ${feedbackId} for session ${sessionId}`);

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: newQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// Update existing feedback question (Admin only)
export const updateFeedbackQuestion: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId, questionId } = req.params;
    const { question, type, isRequired, order } = req.body;

    // Ensure questionId is a string
    const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;

    // Get question and verify it belongs to the specified session
    const existingQuestion = await prisma.feedbackQuestion.findUnique({
      where: { id: normalizedQuestionId },
      include: {
        feedback: {
          include: {
            session: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!existingQuestion) {
      throw new HttpException(404, 'Question not found');
    }

    // Verify the question belongs to a feedback form in the specified session
    if (existingQuestion.feedback.session.id !== sessionId) {
      throw new HttpException(400, 'Question does not belong to the specified session');
    }

    // Check if feedback has responses - prevent editing if responses exist
    const responseCount = await prisma.feedbackResponse.count({
      where: { questionId: normalizedQuestionId },
    });

    if (responseCount > 0) {
      throw new HttpException(400, 'Cannot update question that already has responses');
    }

    // Update question
    const updatedQuestion = await prisma.feedbackQuestion.update({
      where: { id: normalizedQuestionId },
      data: {
        ...(question && { question }),
        ...(type && { type }),
        ...(isRequired !== undefined && { isRequired }),
        ...(order !== undefined && { order }),
      },
    });

    logger.info(`Question ${questionId} updated for session ${sessionId}`);

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// Delete feedback question (Admin only)
export const deleteFeedbackQuestion: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId, questionId } = req.params;

    // Ensure questionId is a string
    const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;

    // Get question and verify it belongs to the specified session
    const existingQuestion = await prisma.feedbackQuestion.findUnique({
      where: { id: normalizedQuestionId },
      include: {
        feedback: {
          include: {
            session: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!existingQuestion) {
      throw new HttpException(404, 'Question not found');
    }

    // Verify the question belongs to a feedback form in the specified session
    if (existingQuestion.feedback.session.id !== sessionId) {
      throw new HttpException(400, 'Question does not belong to the specified session');
    }

    // Check if feedback has responses - prevent deletion if responses exist
    const responseCount = await prisma.feedbackResponse.count({
      where: { questionId: normalizedQuestionId },
    });

    if (responseCount > 0) {
      throw new HttpException(400, 'Cannot delete question that already has responses');
    }

    // Delete question
    await prisma.feedbackQuestion.delete({
      where: { id: normalizedQuestionId },
    });

    logger.info(`Question ${normalizedQuestionId} deleted for session ${sessionId}`);

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Reorder feedback questions (Admin only)
export const reorderFeedbackQuestions: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { feedbackId, questionOrders } = req.body;

    // Get feedback by ID and verify it belongs to the specified session
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        session: {
          select: { id: true },
        },
        questions: true,
      },
    });

    if (!feedback) {
      throw new HttpException(404, 'Feedback form not found');
    }

    // Verify the feedback belongs to the specified session
    if (feedback.session.id !== sessionId) {
      throw new HttpException(400, 'Feedback form does not belong to the specified session');
    }

    // Check if feedback has responses - prevent reordering if responses exist
    const responseCount = await prisma.feedbackResponse.count({
      where: { feedbackId },
    });

    if (responseCount > 0) {
      throw new HttpException(
        400,
        'Cannot reorder questions in feedback form that already has responses',
      );
    }

    // Validate that all question IDs belong to this feedback form
    const questionIds = questionOrders.map(
      (item: { questionId: string; order: number }) => item.questionId,
    );
    const existingQuestionIds = feedback.questions.map(q => q.id);

    const invalidQuestions = questionIds.filter((id: string) => !existingQuestionIds.includes(id));
    if (invalidQuestions.length > 0) {
      throw new HttpException(400, 'Some question IDs do not belong to this feedback form');
    }

    // Check if all questions are included
    if (questionIds.length !== existingQuestionIds.length) {
      throw new HttpException(400, 'All questions must be included in the reorder request');
    }

    // Update the order of each question
    await Promise.all(
      questionOrders.map(async (item: { questionId: string; order: number }) => {
        return prisma.feedbackQuestion.update({
          where: { id: item.questionId },
          data: { order: item.order },
        });
      }),
    );

    // Fetch the updated feedback form with reordered questions
    const updatedFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    logger.info(`Questions reordered for feedback form ${feedbackId} in session ${sessionId}`);

    res.json({
      success: true,
      message: 'Questions reordered successfully',
      data: updatedFeedback,
    });
  } catch (error) {
    next(error);
  }
};
