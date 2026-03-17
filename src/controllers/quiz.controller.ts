import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.config';
import HttpException from '../utils/http-exception';
import { uploadToMinIO } from '../services/minio.service';
import xlsx from 'xlsx';

const prisma = new PrismaClient();

// Helper function to parse options that handles both old and new formats
const parseOptions = (optionsString: string | null): string[] | null => {
  if (!optionsString) return null;

  try {
    // Try parsing as JSON first (new format)
    return JSON.parse(optionsString);
  } catch {
    // If JSON parsing fails, it's the old comma-separated format
    return optionsString.split(',').map(opt => opt.trim());
  }
};

export const createQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      sessionId,
      timeLimitSeconds,
      pointsPerQuestion,
      passingPercentage,
      totalMarks,
      questions,
    } = req.body;

    // Check if the session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Check if a quiz with the same title already exists in the session
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        title: title,
        sessionId: sessionId,
      },
    });

    if (existingQuiz) {
      res
        .status(409)
        .json({ success: false, message: 'A quiz with this title already exists in the session.' });
      return; // Early return if quiz already exists
    }

    // Create the quiz
    const quiz = await prisma.quiz.create({
      data: {
        title,
        session: { connect: { id: sessionId } },
        timeLimitSeconds,
        pointsPerQuestion,
        passingScore: (passingPercentage / 100) * totalMarks, // Calculate passing score based on percentage
        totalMarks,
        retryQuiz: req.body.retryQuiz || false, // Add this line
      },
    });

    // Create questions associated with the quiz if provided
    if (questions && questions.length > 0) {
      await Promise.all(
        questions.map(async (question: any, index: number) => {
          await prisma.question.create({
            data: {
              text: question.text,
              type: question.type,
              options: question.options ? JSON.stringify(question.options) : null,
              correctAnswer: question.correctAnswer,
              order: index + 1,
              quiz: { connect: { id: quiz.id } },
              marks: question.marks, // Add this line to include marks
            },
          });
        }),
      );
    }

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz,
    });
  } catch (error) {
    logger.error('Error creating quiz:', error);

    // Check if the error is an instance of HttpException
    if (error instanceof HttpException) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      // Handle other types of errors
      res.status(500).json({ success: false, message: 'An unexpected error occurred' });
    }
  }
};

// Get all quizzes for a specific session
export const getQuizzes = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.query; // Get sessionId from query parameters
  const userId = req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';

  try {
    // Validate sessionId
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Session ID is required' });
      return;
    }

    // If not admin, check if user is a participant in the session
    if (!isAdmin) {
      const sessionParticipation = await prisma.session.findFirst({
        where: {
          id: String(sessionId),
          participants: {
            some: {
              id: userId,
            },
          },
        },
      });

      if (!sessionParticipation) {
        res.status(403).json({
          success: false,
          message: 'You must be a participant in this session to view its quizzes',
        });
        return;
      }
    }

    // Fetch quizzes for the specified session
    const quizzes = await prisma.quiz.findMany({
      where: {
        sessionId: String(sessionId), // Ensure sessionId is a string
      },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            order: true,
            marks: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    logger.error('Error retrieving quizzes:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get quiz by ID
export const getQuizById = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
  const userId = req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';

  try {
    // Fetch the quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    // Check if user has already submitted a response to this quiz (only for non-admin users)
    if (!isAdmin && userId) {
      const existingResponse = await prisma.quizResponse.findFirst({
        where: {
          quizId: normalizedQuizId,
          userId: userId,
        },
      });

      // If user has already submitted and retryQuiz is false, return quiz with completed status
      if (existingResponse && !quiz.retryQuiz) {
        res.status(200).json({
          success: true,
          data: {
            ...quiz,
            questions: quiz.questions.map(q => ({
              ...q,
              options: parseOptions(q.options),
              correctAnswer: undefined, // Hide correct answer
            })),
            userStatus: 'COMPLETED',
            canRetake: false,
            message: 'You have already completed this quiz and retries are not allowed.',
            userResponse: {
              completedAt: existingResponse.completedAt,
              totalScore: existingResponse.totalScore,
            },
          },
        });
        return;
      }

      // If user has submitted but retries are allowed
      if (existingResponse && quiz.retryQuiz) {
        res.status(200).json({
          success: true,
          data: {
            ...quiz,
            questions: quiz.questions.map(q => ({
              ...q,
              options: parseOptions(q.options),
              correctAnswer: undefined, // Hide correct answer
            })),
            userStatus: 'CAN_RETRY',
            canRetake: true,
            message: 'You can retake this quiz.',
            userResponse: {
              completedAt: existingResponse.completedAt,
              totalScore: existingResponse.totalScore,
            },
          },
        });
        return;
      }
    }

    // Default response for new quiz attempt or admin users
    const transformedQuiz = {
      ...quiz,
      questions: quiz.questions.map(question => ({
        ...question,
        // Split options into array for frontend consumption
        options: parseOptions(question.options),
        // Hide correct answers from non-admin users
        correctAnswer: isAdmin ? question.correctAnswer : undefined,
      })),
      userStatus: isAdmin ? 'ADMIN_ACCESS' : 'AVAILABLE',
      canRetake: quiz.retryQuiz,
      message: 'Quiz is available to take.',
    };

    res.status(200).json({
      success: true,
      data: transformedQuiz,
    });
  } catch (error) {
    logger.error('Error retrieving quiz by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Add multiple questions to a quiz
export const addQuestionsToQuiz = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params; // Get quiz ID from request parameters
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
  const questions = req.body; // Get questions array from request body
  const skippedQuestions: string[] = []; // Array to hold skipped question texts

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    // Get existing questions to determine the next order number
    const existingQuestions = await prisma.question.findMany({
      where: { quizId: normalizedQuizId },
      orderBy: { order: 'asc' },
    });

    // Determine the next available order number
    let nextOrderNumber =
      existingQuestions.length > 0 ? Math.max(...existingQuestions.map(q => q.order)) + 1 : 1;

    // Create questions in bulk
    for (const question of questions) {
      const existingQuestion = await prisma.question.findFirst({
        where: {
          text: question.text.toLowerCase(), // Convert to lowercase
          quizId: normalizedQuizId, // Ensure the question is associated with the correct quiz
        },
      });

      if (existingQuestion) {
        skippedQuestions.push(question.text); // Add to skipped questions
        continue; // Skip to the next question
      }

      // Create the question
      await prisma.question.create({
        data: {
          text: question.text.toLowerCase(), // Store in lowercase
          type: question.type,
          options: question.options
            ? JSON.stringify(question.options.map((option: string) => option.toLowerCase()))
            : null, // Convert options to lowercase
          correctAnswer: question.correctAnswer.toString().toLowerCase(), // Store correctAnswer as a lowercase string
          order: nextOrderNumber, // Set the new order number
          quiz: { connect: { id: normalizedQuizId } }, // Associate the question with the quiz
          imageUrl: question.imageUrl, // Add imageUrl here
          timeTaken: question.timeTaken, // Include timeTaken here
          marks: question.marks, // Include marks here
        },
      });

      // Increment the order number for the next question
      nextOrderNumber++;
    }

    res.status(201).json({
      success: true,
      message: 'Questions added successfully',
      skipped: skippedQuestions, // Return the skipped questions
    });
  } catch (error) {
    logger.error('Error adding questions to quiz:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Join a quiz
export const joinQuiz = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params; // Get quiz ID from request parameters
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
  const userId = req.user?.id; // Get user ID from the request (assumed to be set by auth middleware)

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return; // Early return if quiz does not exist
    }

    // Check if the user is already participating in the quiz
    const existingParticipation = await prisma.quizResponse.findFirst({
      where: {
        quizId: normalizedQuizId,
        userId,
      },
    });

    if (existingParticipation) {
      res
        .status(409)
        .json({ success: false, message: 'You are already participating in this quiz.' });
      return;
    }

    // Create a new quiz response for the user
    const quizResponse = await prisma.quizResponse.create({
      data: {
        quiz: { connect: { id: normalizedQuizId } },
        user: { connect: { id: userId } },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined the quiz.',
      data: quizResponse,
    });
  } catch (error) {
    logger.error('Error joining quiz:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Submit quiz responses
export const submitQuizResponse = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params; // Get quiz ID from request parameters
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
  const userId = req.user?.id; // Get user ID from the request (assumed to be set by auth middleware)
  const { answers, attemptTime, timeTaken } = req.body; // Get answers and attempt time from request body

  try {
    // Check if the quiz exists and fetch total marks
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return; // Early return if quiz does not exist
    }

    // Check if user has already submitted a response to this quiz
    const existingResponse = await prisma.quizResponse.findFirst({
      where: {
        quizId: normalizedQuizId,
        userId: userId,
      },
    });

    // If user has already submitted and retryQuiz is false, prevent submission
    if (existingResponse && !quiz.retryQuiz) {
      res.status(403).json({
        success: false,
        message: 'You have already submitted this quiz and retries are not allowed.',
      });
      return;
    }

    // Calculate total marks and marks obtained
    let marksObtained = 0;
    // Define an interface for the question result
    // interface QuestionResult {
    //   questionId: string;
    //   questionText: string;
    //   userAnswer: string;
    //   correctAnswer: string | null;
    //   isCorrect: boolean;
    //   marks: number;
    //   marksObtained: number;
    //   timeTaken: number;
    // }

    // Then use the interface when declaring the array
    const questionResults: Array<{
      questionId: string;
      questionText: string;
      userAnswer: string;
      correctAnswer: string | null;
      isCorrect: boolean;
      marks: number;
      marksObtained: number;
      timeTaken: number;
    }> = [];

    quiz.questions.forEach(question => {
      const correctAnswer = question.correctAnswer;
      const questionMark = question.marks || quiz.pointsPerQuestion || 0;

      if (correctAnswer !== null) {
        let isCorrect = false;
        const userAnswer = answers[question.id];

        // Handle different question types differently
        if (question.type === 'MULTI_CORRECT') {
          // For multi-correct questions, split and compare arrays
          const normalizedCorrectAnswer = correctAnswer
            .toString()
            .split(',')
            .map((ans: string) => ans.trim().toLowerCase())
            .sort()
            .join(',');
          const normalizedUserAnswer = userAnswer
            ?.split(',')
            .map((ans: string) => ans.trim().toLowerCase())
            .sort()
            .join(',');

          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        } else {
          // For single-choice questions, compare directly without splitting
          const normalizedCorrectAnswer = correctAnswer.toString().trim().toLowerCase();
          const normalizedUserAnswer = userAnswer?.trim().toLowerCase() || '';

          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        }

        if (isCorrect) {
          marksObtained += questionMark;
        }

        // Store detailed result for each question
        questionResults.push({
          questionId: question.id,
          questionText: question.text,
          userAnswer: answers[question.id] || '',
          correctAnswer: question.correctAnswer,
          isCorrect,
          marks: questionMark,
          marksObtained: isCorrect ? questionMark : 0,
          timeTaken: timeTaken[question.id] || 0,
        });
      }
    });

    // Calculate total time taken for the quiz
    const totalTimeTaken = Object.values(timeTaken).reduce(
      (total: number, time: unknown) => total + (time as number),
      0,
    );

    // Create a new quiz response record
    const quizResponse = await prisma.quizResponse.create({
      data: {
        quiz: { connect: { id: normalizedQuizId } },
        user: { connect: { id: userId } },
        completedAt: new Date(attemptTime), // Store the attempt time
        answers: JSON.stringify(answers), // Store the user's answers as a JSON string
        totalScore: marksObtained, // Store the total score
      },
    });

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully.',
      data: {
        marksObtained,
        totalMarks: quiz.totalMarks,
        totalTimeTaken,
        passingScore: quiz.passingScore,
        passed: marksObtained >= (quiz.passingScore || 0),
        questionResults,
        quizResponse: {
          id: quizResponse.id,
          quizId: quizResponse.quizId,
          userId: quizResponse.userId,
          completedAt: quizResponse.completedAt,
          answers: quizResponse.answers,
          createdAt: quizResponse.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error('Error submitting quiz response:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update quiz
export const updateQuiz = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
  const { title, timeLimitSeconds, pointsPerQuestion, passingScore, questions } = req.body;

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    // Update the quiz's basic details
    const updatedQuiz = await prisma.quiz.update({
      where: { id: normalizedQuizId },
      data: {
        title,
        timeLimitSeconds,
        pointsPerQuestion,
        passingScore,
      },
    });

    // If questions are provided, update them
    if (questions && Array.isArray(questions)) {
      await Promise.all(
        questions.map(async (question: any, index: number) => {
          if (question.id) {
            // Update existing question
            await prisma.question.update({
              where: { id: question.id },
              data: {
                text: question.text,
                type: question.type,
                options: question.options ? JSON.stringify(question.options) : null,
                correctAnswer: question.correctAnswer,
                timeTaken: question.timeTaken,
                imageUrl: question.imageUrl,
              },
            });
          } else {
            // Create new question if no ID is provided
            await prisma.question.create({
              data: {
                text: question.text,
                type: question.type,
                options: question.options ? JSON.stringify(question.options) : null,
                correctAnswer: question.correctAnswer,
                quiz: { connect: { id: normalizedQuizId } }, // Associate with the quiz
                timeTaken: question.timeTaken,
                imageUrl: question.imageUrl,
                order: index + 1, // Set the order based on the index
              },
            });
          }
        }),
      );
    }

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: updatedQuiz,
    });
  } catch (error) {
    logger.error('Error updating quiz:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete quiz
export const deleteQuiz = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    // Delete all quiz responses associated with the quiz
    await prisma.quizResponse.deleteMany({
      where: { quizId: normalizedQuizId },
    });

    // Delete all questions associated with the quiz
    await prisma.question.deleteMany({
      where: { quizId: normalizedQuizId },
    });

    // Delete the quiz
    await prisma.quiz.delete({
      where: { id: normalizedQuizId },
    });

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting quiz:', error);

    // Check if the error is an instance of HttpException
    if (error instanceof HttpException) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      // Handle other types of errors
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

// Delete a question from a quiz
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  const { quizId, questionId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
  const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
    });

    if (!quiz) {
      throw new HttpException(404, 'Quiz not found');
    }

    // Check if the question exists
    const question = await prisma.question.findUnique({
      where: { id: normalizedQuestionId },
    });

    if (!question) {
      throw new HttpException(404, 'Question not found');
    }

    // Delete the question
    await prisma.question.delete({
      where: { id: normalizedQuestionId },
    });

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting question:', error);
    if (error instanceof HttpException) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

// Update a question in a quiz
export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  const { quizId, questionId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
  const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;
  const { text, type, options, correctAnswer } = req.body;

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
    });

    if (!quiz) {
      throw new HttpException(404, 'Quiz not found');
    }

    // Check if the question exists
    const question = await prisma.question.findUnique({
      where: { id: normalizedQuestionId },
    });

    if (!question) {
      throw new HttpException(404, 'Question not found');
    }

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id: normalizedQuestionId },
      data: {
        text,
        type,
        options: options ? JSON.stringify(options) : null, // Convert options to a comma-separated string
        correctAnswer,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion,
    });
  } catch (error) {
    logger.error('Error updating question:', error);
    if (error instanceof HttpException) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

// Get leaderboard for a specific quiz
export const getQuizLeaderboard = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;

  try {
    // Fetch quiz responses for the specified quiz and group by user
    const leaderboard = await prisma.quizResponse.groupBy({
      by: ['userId'],
      where: { quizId: normalizedQuizId },
      _max: {
        totalScore: true, // Get the maximum score for each user
      },
      _count: {
        userId: true, // Count the number of attempts for each user
      },
    });

    // Extract user IDs from the leaderboard
    const userIds = leaderboard.map(response => response.userId);

    // Fetch user details for the leaderboard
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Map the results to the desired format
    const formattedLeaderboard = leaderboard.map(response => {
      const user = users.find(u => u.id === response.userId);
      return {
        userId: user?.id,
        userName: user?.name,
        score: response._max.totalScore || 0, // Default to 0 if no score
        attempts: response._count.userId, // Number of attempts
      };
    });

    // Sort by score in descending order
    formattedLeaderboard.sort((a, b) => (b.score || 0) - (a.score || 0));

    res.status(200).json({
      success: true,
      data: formattedLeaderboard,
    });
  } catch (error) {
    logger.error('Error retrieving quiz leaderboard:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get detailed quiz results including individual answers
export const getQuizResults = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    // Get all responses for this quiz
    const responses = await prisma.quizResponse.findMany({
      where: { quizId: normalizedQuizId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Format the results
    const results = responses.map(response => {
      // Parse the answers JSON string
      const answers = response.answers ? JSON.parse(response.answers) : {};

      // Map each question to the user's answer
      const questionAnswers = quiz.questions.map(question => {
        const userAnswer = answers[question.id] || '';
        const questionMark = question.marks || quiz.pointsPerQuestion || 0;

        let isCorrect = false;
        const correctAnswer = question.correctAnswer || '';

        // Handle different question types differently
        if (question.type === 'MULTI_CORRECT') {
          // For multi-correct questions, split and compare arrays
          const normalizedCorrectAnswer = correctAnswer
            .toString()
            .split(',')
            .map((ans: string) => ans.trim().toLowerCase())
            .sort()
            .join(',');
          const normalizedUserAnswer = userAnswer
            .split(',')
            .map((ans: string) => ans.trim().toLowerCase())
            .sort()
            .join(',');

          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        } else {
          // For single-choice questions, compare directly without splitting
          const normalizedCorrectAnswer = correctAnswer.toString().trim().toLowerCase();
          const normalizedUserAnswer = userAnswer.trim().toLowerCase();

          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        }

        return {
          questionId: question.id,
          questionText: question.text,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          marks: questionMark,
          marksObtained: isCorrect ? questionMark : 0,
        };
      });

      // Calculate total marks obtained
      const totalMarksObtained = questionAnswers.reduce(
        (total, q) => total + (q.marksObtained || 0),
        0,
      );

      return {
        userId: response.user.id,
        userName: response.user.name,
        userEmail: response.user.email,
        totalScore: response.totalScore || totalMarksObtained,
        completedAt: response.completedAt,
        answers: questionAnswers,
        passed: (response.totalScore || totalMarksObtained) >= (quiz.passingScore || 0),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        quizId: quiz.id,
        quizTitle: quiz.title,
        totalMarks: quiz.totalMarks,
        passingScore: quiz.passingScore,
        results,
      },
    });
  } catch (error) {
    logger.error('Error retrieving quiz results:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get public leaderboard for a specific quiz (no authentication required)
export const getPublicLeaderboard = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
      select: { id: true, title: true },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    // Fetch quiz responses for the specified quiz and group by user
    const leaderboard = await prisma.quizResponse.groupBy({
      by: ['userId'],
      where: { quizId: normalizedQuizId },
      _max: {
        totalScore: true, // Get the maximum score for each user
      },
    });

    // Extract user IDs from the leaderboard
    const userIds = leaderboard.map(response => response.userId);

    // Fetch user details for the leaderboard
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Map the results to the desired format
    const formattedLeaderboard = leaderboard.map(response => {
      const user = users.find(u => u.id === response.userId);
      return {
        userId: user?.id,
        userName: user?.name,
        score: response._max.totalScore || 0, // Default to 0 if no score
      };
    });

    // Sort by score in descending order
    formattedLeaderboard.sort((a, b) => (b.score || 0) - (a.score || 0));

    res.status(200).json({
      success: true,
      data: {
        quizId: quiz.id,
        quizTitle: quiz.title,
        leaderboard: formattedLeaderboard,
      },
    });
  } catch (error) {
    logger.error('Error retrieving public leaderboard:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get global leaderboard across all quizzes (no authentication required)
export const getGlobalLeaderboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get top performers across all quizzes
    const leaderboard = await prisma.quizResponse.groupBy({
      by: ['userId'],
      _sum: {
        totalScore: true, // Sum up scores across all quizzes
      },
      orderBy: {
        _sum: {
          totalScore: 'desc',
        },
      },
      take: 50, // Limit to top 50 performers
    });

    // Extract user IDs from the leaderboard
    const userIds = leaderboard.map(response => response.userId);

    // Fetch user details for the leaderboard
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Map the results to the desired format
    const formattedLeaderboard = leaderboard.map(response => {
      const user = users.find(u => u.id === response.userId);
      return {
        userId: user?.id,
        userName: user?.name,
        totalScore: response._sum.totalScore || 0, // Default to 0 if no score
      };
    });

    res.status(200).json({
      success: true,
      data: {
        leaderboard: formattedLeaderboard,
      },
    });
  } catch (error) {
    logger.error('Error retrieving global leaderboard:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Check quiz access status for a user
export const checkQuizAccess = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
  const userId = req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';

  try {
    // Fetch the quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
      select: {
        id: true,
        title: true,
        retryQuiz: true,
        sessionId: true,
        timeLimitSeconds: true,
        pointsPerQuestion: true,
        passingScore: true,
        totalMarks: true,
      },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    // Admin users can always access
    if (isAdmin) {
      res.status(200).json({
        success: true,
        data: {
          canAccess: true,
          userStatus: 'ADMIN_ACCESS',
          message: 'Admin access granted.',
          quiz: quiz,
        },
      });
      return;
    }

    // Check if user is a participant in the session
    const sessionParticipation = await prisma.session.findFirst({
      where: {
        id: quiz.sessionId,
        participants: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!sessionParticipation) {
      res.status(403).json({
        success: false,
        message: 'You must be a participant in the session to access this quiz.',
      });
      return;
    }

    // Check if user has already submitted a response to this quiz
    const existingResponse = await prisma.quizResponse.findFirst({
      where: {
        quizId: normalizedQuizId,
        userId: userId,
      },
      select: {
        id: true,
        completedAt: true,
        totalScore: true,
        createdAt: true,
      },
    });

    // If user has already submitted and retryQuiz is false, deny access
    if (existingResponse && !quiz.retryQuiz) {
      res.status(403).json({
        success: false,
        data: {
          canAccess: false,
          userStatus: 'COMPLETED',
          message: 'You have already completed this quiz and retries are not allowed.',
          quiz: quiz,
          userResponse: {
            completedAt: existingResponse.completedAt,
            totalScore: existingResponse.totalScore,
          },
        },
      });
      return;
    }

    // If user has submitted but retries are allowed
    if (existingResponse && quiz.retryQuiz) {
      res.status(200).json({
        success: true,
        data: {
          canAccess: true,
          userStatus: 'CAN_RETRY',
          message: 'You can retake this quiz.',
          quiz: quiz,
          userResponse: {
            completedAt: existingResponse.completedAt,
            totalScore: existingResponse.totalScore,
          },
        },
      });
      return;
    }

    // User can access the quiz for the first time
    res.status(200).json({
      success: true,
      data: {
        canAccess: true,
        userStatus: 'AVAILABLE',
        message: 'Quiz is available to take.',
        quiz: quiz,
      },
    });
  } catch (error) {
    logger.error('Error checking quiz access:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const uploadQuestionImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const file = req.file;

    if (!file) {
      throw new HttpException(400, 'No image file uploaded');
    }

    // Check if quiz exists and user has permission
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
      include: { session: true },
    });

    if (!quiz) {
      throw new HttpException(404, 'Quiz not found');
    }

    // Upload image to MinIO
    const key = `quizzes/${normalizedQuizId}/images/${file.originalname}`;
    const uploadResult = await uploadToMinIO(file.buffer, key, 'image/jpeg');

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: uploadResult.url,
        key: uploadResult.key,
      },
    });
  } catch (error) {
    logger.error('Error uploading question image:', error);

    if (error instanceof HttpException) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
  }
};

export const uploadQuestionImageAndAttach = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quizId, questionId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
    const normalizedQuestionId = Array.isArray(questionId) ? questionId[0] : questionId;
    const file = req.file;

    if (!file) {
      throw new HttpException(400, 'No image file uploaded');
    }

    // Check if quiz and question exist
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
      include: {
        session: true,
        questions: {
          where: { id: normalizedQuestionId },
        },
      },
    });

    if (!quiz) {
      throw new HttpException(404, 'Quiz not found');
    }

    if (quiz.questions.length === 0) {
      throw new HttpException(404, 'Question not found in this quiz');
    }

    // Upload image to MinIO
    const key = `quizzes/${normalizedQuizId}/questions/${normalizedQuestionId}/${file.originalname}`;
    const uploadResult = await uploadToMinIO(file.buffer, key, 'image/jpeg');

    // Update the question with the new image URL
    const updatedQuestion = await prisma.question.update({
      where: { id: normalizedQuestionId },
      data: {
        imageUrl: uploadResult.url,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded and attached to question successfully',
      data: {
        question: {
          id: updatedQuestion.id,
          text: updatedQuestion.text,
          type: updatedQuestion.type,
          imageUrl: updatedQuestion.imageUrl,
          options: updatedQuestion.options,
          correctAnswer: updatedQuestion.correctAnswer,
          order: updatedQuestion.order,
          marks: updatedQuestion.marks,
        },
        uploadInfo: {
          url: uploadResult.url,
          key: uploadResult.key,
        },
      },
    });
  } catch (error) {
    logger.error('Error uploading and attaching question image:', error);

    if (error instanceof HttpException) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Failed to upload and attach image' });
    }
  }
};

export const createQuizWithImages = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse quiz data from form field
    const quizDataString = req.body.quizData;
    if (!quizDataString) {
      throw new HttpException(400, 'Quiz data is required');
    }

    let quizData;
    try {
      quizData = JSON.parse(quizDataString);
    } catch (error) {
      throw new HttpException(400, 'Invalid JSON in quizData field');
    }

    const {
      title,
      sessionId,
      timeLimitSeconds,
      pointsPerQuestion,
      passingPercentage,
      totalMarks,
      questions,
    } = quizData;

    // Validate required fields
    if (!title || !sessionId || !questions || !Array.isArray(questions)) {
      throw new HttpException(400, 'Title, sessionId, and questions array are required');
    }

    // Check if the session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Check if a quiz with the same title already exists in the session
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        title: title,
        sessionId: sessionId,
      },
    });

    if (existingQuiz) {
      throw new HttpException(409, 'A quiz with this title already exists in the session');
    }

    // Create the quiz first
    const quiz = await prisma.quiz.create({
      data: {
        title,
        session: { connect: { id: sessionId } },
        timeLimitSeconds,
        pointsPerQuestion,
        passingScore: passingPercentage ? (passingPercentage / 100) * totalMarks : null,
        totalMarks,
        retryQuiz: quizData.retryQuiz || false,
      },
    });

    // Process questions with images
    const createdQuestions = [];
    const files = req.files as Express.Multer.File[];

    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      let imageUrl = null;

      // Check if there's an image for this question
      const imageFieldName = `question_${index}_image`;
      const imageFile = files?.find(file => file.fieldname === imageFieldName);

      if (imageFile) {
        // Upload image to MinIO
        const key = `quizzes/${quiz.id}/questions/question_${index}/${imageFile.originalname}`;
        try {
          const uploadResult = await uploadToMinIO(imageFile.buffer, key, 'image/jpeg');
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          logger.error(`Error uploading image for question ${index}:`, uploadError);
          // Continue without image if upload fails
        }
      }

      // Create question with or without image
      const createdQuestion = await prisma.question.create({
        data: {
          text: question.text,
          type: question.type,
          options: question.options ? JSON.stringify(question.options) : null,
          correctAnswer: question.correctAnswer,
          order: index + 1,
          quiz: { connect: { id: quiz.id } },
          marks: question.marks || pointsPerQuestion,
          imageUrl: imageUrl,
          timeTaken: question.timeTaken,
        },
      });

      createdQuestions.push(createdQuestion);
    }

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully with images',
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          sessionId: quiz.sessionId,
          timeLimitSeconds: quiz.timeLimitSeconds,
          pointsPerQuestion: quiz.pointsPerQuestion,
          passingScore: quiz.passingScore,
          totalMarks: quiz.totalMarks,
          retryQuiz: quiz.retryQuiz,
          createdAt: quiz.createdAt,
          updatedAt: quiz.updatedAt,
        },
        questions: createdQuestions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          order: q.order,
          marks: q.marks,
          imageUrl: q.imageUrl,
          hasImage: !!q.imageUrl,
        })),
        summary: {
          totalQuestions: createdQuestions.length,
          questionsWithImages: createdQuestions.filter(q => q.imageUrl).length,
        },
      },
    });
  } catch (error) {
    logger.error('Error creating quiz with images:', error);

    if (error instanceof HttpException) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unexpected error occurred' });
    }
  }
};

// Download quiz results in Excel format (Admin only)
export const downloadQuizResultsExcel = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params;
  const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        session: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }
    // Get all responses for this quiz
    const responses = await prisma.quizResponse.findMany({
      where: { quizId: normalizedQuizId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            companyPosition: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    if (responses.length === 0) {
      res.status(404).json({ success: false, message: 'No quiz responses found' });
      return;
    }

    // Prepare data for Excel export
    const excelData: any[] = [];

    responses.forEach(response => {
      // Parse the answers JSON string
      const answers = response.answers ? JSON.parse(response.answers) : {};

      // Base user information
      const rowData: any = {
        'User Name': response.user.name,
        Email: response.user.email,
        Department: response.user.department || 'N/A',
        Position: response.user.companyPosition || 'N/A',
        'Total Score': response.totalScore || 0,
        'Total Marks': quiz.totalMarks || 0,
        Percentage: quiz.totalMarks
          ? (((response.totalScore || 0) / quiz.totalMarks) * 100).toFixed(2) + '%'
          : 'N/A',
        'Passing Score': quiz.passingScore || 0,
        Status: (response.totalScore || 0) >= (quiz.passingScore || 0) ? 'PASSED' : 'FAILED',
        'Completed At': response.completedAt
          ? new Date(response.completedAt).toLocaleDateString() +
            ' ' +
            new Date(response.completedAt).toLocaleTimeString()
          : 'N/A',
        'Time Taken (seconds)': response.timeTaken || 'N/A',
      };

      // Add individual question answers
      quiz.questions.forEach((question, index) => {
        const userAnswer = answers[question.id] || '';
        const questionMark = question.marks || quiz.pointsPerQuestion || 0;
        const isCorrect = userAnswer.toLowerCase() === (question.correctAnswer || '').toLowerCase();

        rowData[`Q${index + 1} - ${question.text.substring(0, 50)}...`] = userAnswer;
        rowData[`Q${index + 1} - Correct Answer`] = question.correctAnswer || 'N/A';
        rowData[`Q${index + 1} - Is Correct`] = isCorrect ? 'YES' : 'NO';
        rowData[`Q${index + 1} - Marks Obtained`] = isCorrect ? questionMark : 0;
        rowData[`Q${index + 1} - Total Marks`] = questionMark;
      });

      excelData.push(rowData);
    });

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 20 }, // User Name
      { wch: 25 }, // Email
      { wch: 15 }, // Department
      { wch: 20 }, // Position
      { wch: 12 }, // Total Score
      { wch: 12 }, // Total Marks
      { wch: 12 }, // Percentage
      { wch: 12 }, // Passing Score
      { wch: 10 }, // Status
      { wch: 20 }, // Completed At
      { wch: 15 }, // Time Taken
    ];

    // Add widths for question columns
    quiz.questions.forEach(() => {
      columnWidths.push(
        { wch: 30 }, // Question answer
        { wch: 25 }, // Correct answer
        { wch: 12 }, // Is correct
        { wch: 15 }, // Marks obtained
        { wch: 12 }, // Total marks
      );
    });

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Quiz Results');

    // Create summary sheet
    const summaryData = [
      { Metric: 'Quiz Title', Value: quiz.title },
      { Metric: 'Session', Value: quiz.session?.title || 'N/A' },
      { Metric: 'Total Questions', Value: quiz.questions.length },
      { Metric: 'Total Participants', Value: responses.length },
      { Metric: 'Total Marks', Value: quiz.totalMarks || 0 },
      { Metric: 'Passing Score', Value: quiz.passingScore || 0 },
      {
        Metric: 'Average Score',
        Value:
          responses.length > 0
            ? (
                responses.reduce((sum, r) => sum + (r.totalScore || 0), 0) / responses.length
              ).toFixed(2)
            : 0,
      },
      {
        Metric: 'Pass Rate',
        Value:
          responses.length > 0
            ? (
                (responses.filter(r => (r.totalScore || 0) >= (quiz.passingScore || 0)).length /
                  responses.length) *
                100
              ).toFixed(2) + '%'
            : '0%',
      },
      {
        Metric: 'Export Date',
        Value: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      },
    ];

    const summaryWorksheet = xlsx.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
    xlsx.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

    // Generate Excel buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    const fileName = `Quiz_Results_${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);

    logger.info(`Quiz results Excel exported: ${quiz.title} by admin`);
  } catch (error) {
    logger.error('Error downloading quiz results Excel:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateQuizWithImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quizId } = req.params;
    const normalizedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;

    // Parse quiz data from form field
    const quizDataString = req.body.quizData;
    if (!quizDataString) {
      throw new HttpException(400, 'Quiz data is required');
    }

    let quizData;
    try {
      quizData = JSON.parse(quizDataString);
    } catch (error) {
      throw new HttpException(400, 'Invalid JSON in quizData field');
    }

    const { title, timeLimitSeconds, pointsPerQuestion, passingPercentage, totalMarks, questions } =
      quizData;

    // Check if the quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: normalizedQuizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!existingQuiz) {
      throw new HttpException(404, 'Quiz not found');
    }

    // Update the quiz's basic details
    const updatedQuiz = await prisma.quiz.update({
      where: { id: normalizedQuizId },
      data: {
        title,
        timeLimitSeconds,
        pointsPerQuestion,
        passingScore: passingPercentage ? (passingPercentage / 100) * totalMarks : null,
        totalMarks,
        retryQuiz: quizData.retryQuiz,
      },
    });

    // Process questions with images
    const processedQuestions = [];
    const files = req.files as Express.Multer.File[];

    if (questions && Array.isArray(questions)) {
      // Get existing question IDs to track which ones to keep
      const existingQuestionIds = existingQuiz.questions.map(q => q.id);
      const updatedQuestionIds: string[] = [];

      for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        let imageUrl = question.imageUrl || null; // Keep existing image URL if provided

        // Check if there's a new image for this question
        const imageFieldName = `question_${index}_image`;
        const imageFile = files?.find(file => file.fieldname === imageFieldName);

        if (imageFile) {
          // Upload new image to MinIO
          const key = `quizzes/${quizId}/questions/question_${index}/${imageFile.originalname}`;
          try {
            const uploadResult = await uploadToMinIO(imageFile.buffer, key, 'image/jpeg');
            imageUrl = uploadResult.url;
          } catch (uploadError) {
            logger.error(`Error uploading image for question ${index}:`, uploadError);
            // Keep existing image URL if new upload fails
          }
        }

        if (question.id && existingQuestionIds.includes(question.id)) {
          // Update existing question
          const updatedQuestion = await prisma.question.update({
            where: { id: question.id },
            data: {
              text: question.text,
              type: question.type,
              options: question.options ? JSON.stringify(question.options) : null,
              correctAnswer: question.correctAnswer,
              order: index + 1,
              marks: question.marks || pointsPerQuestion,
              imageUrl: imageUrl,
              timeTaken: question.timeTaken,
            },
          });
          processedQuestions.push(updatedQuestion);
          updatedQuestionIds.push(question.id);
        } else {
          // Create new question
          const newQuestion = await prisma.question.create({
            data: {
              text: question.text,
              type: question.type,
              options: question.options ? JSON.stringify(question.options) : null,
              correctAnswer: question.correctAnswer,
              order: index + 1,
              quiz: { connect: { id: normalizedQuizId } },
              marks: question.marks || pointsPerQuestion,
              imageUrl: imageUrl,
              timeTaken: question.timeTaken,
            },
          });
          processedQuestions.push(newQuestion);
          if (question.id) updatedQuestionIds.push(question.id);
        }
      }

      // Delete questions that are no longer in the updated list
      const questionsToDelete = existingQuestionIds.filter(id => !updatedQuestionIds.includes(id));
      if (questionsToDelete.length > 0) {
        await prisma.question.deleteMany({
          where: {
            id: { in: questionsToDelete },
            quizId: normalizedQuizId,
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully with images',
      data: {
        quiz: {
          id: updatedQuiz.id,
          title: updatedQuiz.title,
          sessionId: updatedQuiz.sessionId,
          timeLimitSeconds: updatedQuiz.timeLimitSeconds,
          pointsPerQuestion: updatedQuiz.pointsPerQuestion,
          passingScore: updatedQuiz.passingScore,
          totalMarks: updatedQuiz.totalMarks,
          retryQuiz: updatedQuiz.retryQuiz,
          updatedAt: updatedQuiz.updatedAt,
        },
        questions: processedQuestions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          order: q.order,
          marks: q.marks,
          imageUrl: q.imageUrl,
          hasImage: !!q.imageUrl,
        })),
        summary: {
          totalQuestions: processedQuestions.length,
          questionsWithImages: processedQuestions.filter(q => q.imageUrl).length,
        },
      },
    });
  } catch (error) {
    logger.error('Error updating quiz with images:', error);

    if (error instanceof HttpException) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unexpected error occurred' });
    }
  }
};
