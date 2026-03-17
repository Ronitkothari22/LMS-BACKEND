import { PrismaClient } from '@prisma/client';
import {
  CreateSurveyRequest,
  CreateSurveyQuestionRequest,
  CreateSurveyAssignmentRequest,
  SurveyResponseRequest,
} from '../types/survey.types';

const prisma = new PrismaClient();

export class SurveyService {
  // Helper function to convert empty date strings to null
  private formatDateForDB(date: Date | string | undefined): Date | null {
    if (!date || date === '') {
      return null;
    }

    if (typeof date === 'string') {
      // If it's a string, try to parse it as a Date
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    return date;
  }

  // Survey CRUD
  async createSurvey(data: CreateSurveyRequest, createdById: string) {
    return await prisma.survey.create({
      data: {
        sessionId: data.sessionId,
        title: data.title,
        description: data.description,
        createdById,
        startDate: this.formatDateForDB(data.startDate),
        endDate: this.formatDateForDB(data.endDate),
        isAnonymous: data.isAnonymous || false,
        allowMultipleResponses: data.allowMultipleResponses || false,
        isOptional: data.isOptional !== false, // Default to true
        settings: data.settings,
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        assignments: {
          include: {
            assignedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getSurveysBySession(sessionId: string) {
    return await prisma.survey.findMany({
      where: { sessionId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        assignments: {
          include: {
            assignedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSurveyById(id: string) {
    return await prisma.survey.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        assignments: {
          include: {
            assignedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            questionResponses: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });
  }

  async updateSurvey(id: string, data: Partial<CreateSurveyRequest>) {
    return await prisma.survey.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        startDate: this.formatDateForDB(data.startDate),
        endDate: this.formatDateForDB(data.endDate),
        isAnonymous: data.isAnonymous,
        allowMultipleResponses: data.allowMultipleResponses,
        isOptional: data.isOptional,
        settings: data.settings,
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        assignments: true,
      },
    });
  }

  async deleteSurvey(id: string) {
    return await prisma.survey.delete({
      where: { id },
    });
  }

  // Survey Questions
  async addQuestionToSurvey(data: CreateSurveyQuestionRequest) {
    return await prisma.surveyQuestion.create({
      data: {
        surveyId: data.surveyId,
        questionText: data.questionText,
        questionType: data.questionType,
        surveyType: data.surveyType,
        options: data.options,
        validationRules: data.validationRules,
        isRequired: data.isRequired !== false, // Default to true
        orderIndex: data.orderIndex,
      },
      include: {
        survey: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async updateSurveyQuestion(id: string, data: Partial<CreateSurveyQuestionRequest>) {
    return await prisma.surveyQuestion.update({
      where: { id },
      data: {
        questionText: data.questionText,
        questionType: data.questionType,
        surveyType: data.surveyType,
        options: data.options,
        validationRules: data.validationRules,
        isRequired: data.isRequired,
        orderIndex: data.orderIndex,
      },
    });
  }

  async deleteSurveyQuestion(id: string) {
    return await prisma.surveyQuestion.delete({
      where: { id },
    });
  }

  // Survey Assignments (Connect surveys to organizations, departments, teams, or individuals)
  async assignSurvey(data: CreateSurveyAssignmentRequest, assignedById: string) {
    // First, create the assignment
    const assignment = await prisma.surveyAssignment.create({
      data: {
        surveyId: data.surveyId,
        assignedToType: data.assignedToType,
        assignedToId: data.assignedToId,
        assignedById,
        deadline: this.formatDateForDB(data.deadline),
        reminderSchedule: data.reminderSchedule,
      },
      include: {
        survey: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Auto-activation logic: If survey is DRAFT and being assigned to a department/team with users, activate it
    if (assignment.survey.status === 'DRAFT' && data.assignedToType === 'DEPARTMENT') {
      // Check if the department has users
      const departmentWithUsers = await prisma.department.findUnique({
        where: { id: data.assignedToId },
        include: {
          userAssignments: {
            select: { id: true },
          },
        },
      });

      if (departmentWithUsers && departmentWithUsers.userAssignments.length > 0) {
        // Activate the survey
        await prisma.survey.update({
          where: { id: data.surveyId },
          data: { status: 'ACTIVE' },
        });

        // Update the returned assignment data to reflect the new status
        assignment.survey.status = 'ACTIVE';
      }
    } else if (assignment.survey.status === 'DRAFT' && data.assignedToType === 'TEAM') {
      // Check if the team has users
      const teamWithUsers = await prisma.surveyTeam.findUnique({
        where: { id: data.assignedToId },
        include: {
          userAssignments: {
            select: { id: true },
          },
        },
      });

      if (teamWithUsers && teamWithUsers.userAssignments.length > 0) {
        // Activate the survey
        await prisma.survey.update({
          where: { id: data.surveyId },
          data: { status: 'ACTIVE' },
        });

        // Update the returned assignment data to reflect the new status
        assignment.survey.status = 'ACTIVE';
      }
    }

    return assignment;
  }

  async getSurveyAssignments(surveyId: string) {
    return await prisma.surveyAssignment.findMany({
      where: { surveyId },
      include: {
        survey: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeAssignment(id: string) {
    return await prisma.surveyAssignment.delete({
      where: { id },
    });
  }

  // Survey Responses
  async submitSurveyResponse(data: SurveyResponseRequest, userId: string) {
    return await prisma.$transaction(async tx => {
      // Create the survey response
      const surveyResponse = await tx.surveyResponse.create({
        data: {
          surveyId: data.surveyId,
          userId,
          submittedAt: new Date(),
          completionStatus: 'COMPLETE',
        },
      });

      // Create question responses
      await Promise.all(
        data.responses.map(response =>
          tx.surveyQuestionResponse.create({
            data: {
              surveyResponseId: surveyResponse.id,
              questionId: response.questionId,
              responseValue: response.responseValue,
            },
          }),
        ),
      );

      return await tx.surveyResponse.findUnique({
        where: { id: surveyResponse.id },
        include: {
          survey: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          questionResponses: {
            include: {
              question: true,
            },
          },
        },
      });
    });
  }

  async getUserSurveyResponses(userId: string, sessionId?: string) {
    return await prisma.surveyResponse.findMany({
      where: {
        userId,
        ...(sessionId && {
          survey: {
            sessionId,
          },
        }),
      },
      include: {
        survey: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        questionResponses: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  // Analytics and Reports
  async getSurveyAnalytics(surveyId: string) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: true,
        responses: {
          include: {
            questionResponses: {
              include: {
                question: true,
              },
            },
          },
        },
        assignments: true,
      },
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    const totalAssigned = survey.assignments.length;
    const totalResponses = survey.responses.length;
    const completionRate = totalAssigned > 0 ? (totalResponses / totalAssigned) * 100 : 0;

    const averageResponseTime =
      survey.responses.reduce((acc, response) => {
        return acc + (response.responseTimeSeconds || 0);
      }, 0) / totalResponses;

    // NEW: build detailed analytics per question
    const questionAnalytics = survey.questions.map(question => {
      const questionResponses = survey.responses.flatMap(r =>
        r.questionResponses.filter(qr => qr.questionId === question.id),
      );

      // Build distribution counts for all question types
      const distribution: Record<string, number> = {};
      questionResponses.forEach(qr => {
        const key = String(qr.responseValue);
        distribution[key] = (distribution[key] || 0) + 1;
      });

      // Extra stats for rating scale / numeric answers
      let averageRating: number | null = null;
      let minRating: number | null = null;
      let maxRating: number | null = null;

      if (question.questionType === 'RATING_SCALE' || question.questionType === 'MATRIX') {
        const numeric = questionResponses
          .map(qr => Number(qr.responseValue))
          .filter(val => !isNaN(val));
        if (numeric.length > 0) {
          const total = numeric.reduce((a, b) => a + b, 0);
          averageRating = total / numeric.length;
          minRating = Math.min(...numeric);
          maxRating = Math.max(...numeric);
        }
      }

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        surveyType: question.surveyType,
        responseCount: questionResponses.length,
        distribution,
        averageRating,
        minRating,
        maxRating,
      };
    });

    // NEW: Aggregate analytics by surveyType (e.g., BEHAVIORAL, SATISFACTION)
    const surveyTypeAnalytics: Record<
      string,
      { responseCount: number; averageRating: number | null }
    > = {};
    questionAnalytics.forEach(qA => {
      if (!surveyTypeAnalytics[qA.surveyType]) {
        surveyTypeAnalytics[qA.surveyType] = { responseCount: 0, averageRating: null };
      }
      surveyTypeAnalytics[qA.surveyType].responseCount += qA.responseCount;

      if (qA.averageRating !== null) {
        const current = surveyTypeAnalytics[qA.surveyType];
        if (current.averageRating === null) {
          current.averageRating = qA.averageRating;
        } else {
          // Weighted average based on response counts
          current.averageRating =
            (current.averageRating * (current.responseCount - qA.responseCount) +
              qA.averageRating * qA.responseCount) /
            current.responseCount;
        }
      }
    });

    return {
      surveyInfo: {
        id: survey.id,
        title: survey.title,
        status: survey.status,
      },
      statistics: {
        totalAssigned,
        totalResponses,
        completionRate,
        averageResponseTime,
        responsesByStatus: {
          complete: survey.responses.filter(r => r.completionStatus === 'COMPLETE').length,
          incomplete: survey.responses.filter(r => r.completionStatus === 'INCOMPLETE').length,
          partial: survey.responses.filter(r => r.completionStatus === 'PARTIAL').length,
        },
      },
      questionAnalytics,
      surveyTypeAnalytics,
    };
  }

  // NEW: Department-wise analytics for a specific survey
  async getSurveyDepartmentBreakdown(surveyId: string) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        assignments: {
          where: {
            assignedToType: 'DEPARTMENT',
          },
        },
        responses: {
          include: {
            user: {
              include: {
                departmentAssignments: {
                  include: {
                    department: {
                      select: {
                        id: true,
                        name: true,
                        organizationId: true,
                      },
                    },
                    team: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            questionResponses: {
              include: {
                question: true,
              },
            },
          },
        },
        questions: true,
      },
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    // Get all departments assigned to this survey
    const assignedDepartmentIds = survey.assignments.map(a => a.assignedToId);

    // Get detailed department info
    const departments = await prisma.department.findMany({
      where: {
        id: {
          in: assignedDepartmentIds,
        },
      },
      include: {
        userAssignments: {
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
        teams: {
          include: {
            userAssignments: {
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
      },
    });

    // Calculate analytics for each department
    const departmentAnalytics = departments.map(dept => {
      const deptUsers = dept.userAssignments.map(ua => ua.user);
      const deptResponses = survey.responses.filter(response =>
        deptUsers.some(user => user.id === response.userId),
      );

      const teamAnalytics = dept.teams.map(team => {
        const teamUsers = team.userAssignments.map(ua => ua.user);
        const teamResponses = survey.responses.filter(response =>
          teamUsers.some(user => user.id === response.userId),
        );

        return {
          teamId: team.id,
          teamName: team.name,
          totalUsers: teamUsers.length,
          totalResponses: teamResponses.length,
          completionRate:
            teamUsers.length > 0 ? (teamResponses.length / teamUsers.length) * 100 : 0,
          responses: teamResponses.map(r => ({
            userId: r.userId,
            userName: deptUsers.find(u => u.id === r.userId)?.name || 'Unknown',
            submittedAt: r.submittedAt,
            completionStatus: r.completionStatus,
            responseTime: r.responseTimeSeconds,
          })),
        };
      });

      // NEW: Per-department question & surveyType analytics
      const departmentQuestionAnalytics = survey.questions.map(question => {
        const questionResponses = deptResponses.flatMap(r =>
          r.questionResponses.filter(qr => qr.questionId === question.id),
        );

        const distribution: Record<string, number> = {};
        questionResponses.forEach(qr => {
          const key = String(qr.responseValue);
          distribution[key] = (distribution[key] || 0) + 1;
        });

        let averageRating: number | null = null;
        if (question.questionType === 'RATING_SCALE' || question.questionType === 'MATRIX') {
          const numeric = questionResponses
            .map(qr => Number(qr.responseValue))
            .filter(val => !isNaN(val));
          if (numeric.length > 0) {
            averageRating = numeric.reduce((a, b) => a + b, 0) / numeric.length;
          }
        }

        return {
          questionId: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          surveyType: question.surveyType,
          responseCount: questionResponses.length,
          distribution,
          averageRating,
        };
      });

      const departmentSurveyTypeAnalytics: Record<
        string,
        { responseCount: number; averageRating: number | null }
      > = {};
      departmentQuestionAnalytics.forEach(qA => {
        if (!departmentSurveyTypeAnalytics[qA.surveyType]) {
          departmentSurveyTypeAnalytics[qA.surveyType] = { responseCount: 0, averageRating: null };
        }
        departmentSurveyTypeAnalytics[qA.surveyType].responseCount += qA.responseCount;

        if (qA.averageRating !== null) {
          const current = departmentSurveyTypeAnalytics[qA.surveyType];
          if (current.averageRating === null) current.averageRating = qA.averageRating;
          else {
            current.averageRating =
              (current.averageRating * (current.responseCount - qA.responseCount) +
                qA.averageRating * qA.responseCount) /
              current.responseCount;
          }
        }
      });

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalUsers: deptUsers.length,
        totalResponses: deptResponses.length,
        completionRate: deptUsers.length > 0 ? (deptResponses.length / deptUsers.length) * 100 : 0,
        averageResponseTime:
          deptResponses.length > 0
            ? deptResponses.reduce((acc, r) => acc + (r.responseTimeSeconds || 0), 0) /
              deptResponses.length
            : 0,
        teams: teamAnalytics,
        questionAnalytics: departmentQuestionAnalytics,
        surveyTypeAnalytics: departmentSurveyTypeAnalytics,
        responses: deptResponses.map(r => ({
          userId: r.userId,
          userName: deptUsers.find(u => u.id === r.userId)?.name || 'Unknown',
          submittedAt: r.submittedAt,
          completionStatus: r.completionStatus,
          responseTime: r.responseTimeSeconds,
          questionResponses: r.questionResponses.map(qr => ({
            questionId: qr.questionId,
            questionText: qr.question.questionText,
            responseValue: qr.responseValue,
            respondedAt: qr.respondedAt,
          })),
        })),
      };
    });

    return {
      surveyInfo: {
        id: survey.id,
        title: survey.title,
        status: survey.status,
      },
      departmentBreakdown: departmentAnalytics,
      overallStatistics: {
        totalDepartments: departments.length,
        totalUsers: departments.reduce((acc, dept) => acc + dept.userAssignments.length, 0),
        totalResponses: survey.responses.length,
        overallCompletionRate:
          departments.length > 0
            ? departmentAnalytics.reduce((acc, dept) => acc + dept.completionRate, 0) /
              departments.length
            : 0,
      },
    };
  }

  // NEW: Analytics for a specific department across all surveys
  async getDepartmentSurveyAnalytics(departmentId: string, sessionId?: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        organization: {
          include: {
            session: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        userAssignments: {
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
        teams: {
          include: {
            userAssignments: {
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
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // Get all surveys assigned to this department
    const surveyAssignments = await prisma.surveyAssignment.findMany({
      where: {
        assignedToType: 'DEPARTMENT',
        assignedToId: departmentId,
        ...(sessionId && {
          survey: {
            sessionId: sessionId,
          },
        }),
      },
      include: {
        survey: {
          include: {
            questions: true,
            responses: {
              where: {
                userId: {
                  in: department.userAssignments.map(ua => ua.userId),
                },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                questionResponses: {
                  include: {
                    question: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const deptUsers = department.userAssignments.map(ua => ua.user);

    const surveyAnalytics = surveyAssignments.map(assignment => {
      const survey = assignment.survey;
      const surveyResponses = survey.responses;

      return {
        surveyId: survey.id,
        surveyTitle: survey.title,
        surveyStatus: survey.status,
        assignedAt: assignment.assignedAt,
        deadline: assignment.deadline,
        totalUsers: deptUsers.length,
        totalResponses: surveyResponses.length,
        completionRate:
          deptUsers.length > 0 ? (surveyResponses.length / deptUsers.length) * 100 : 0,
        averageResponseTime:
          surveyResponses.length > 0
            ? surveyResponses.reduce((acc, r) => acc + (r.responseTimeSeconds || 0), 0) /
              surveyResponses.length
            : 0,
        responsesByStatus: {
          complete: surveyResponses.filter(r => r.completionStatus === 'COMPLETE').length,
          incomplete: surveyResponses.filter(r => r.completionStatus === 'INCOMPLETE').length,
          partial: surveyResponses.filter(r => r.completionStatus === 'PARTIAL').length,
        },
        responses: surveyResponses.map(r => ({
          userId: r.userId,
          userName: r.user.name,
          userEmail: r.user.email,
          submittedAt: r.submittedAt,
          completionStatus: r.completionStatus,
          responseTime: r.responseTimeSeconds,
        })),
      };
    });

    return {
      departmentInfo: {
        id: department.id,
        name: department.name,
        organizationId: department.organizationId,
        organizationName: department.organization.name,
        sessionId: department.organization.session?.id,
        sessionTitle: department.organization.session?.title,
      },
      departmentUsers: deptUsers,
      teamBreakdown: department.teams.map(team => ({
        teamId: team.id,
        teamName: team.name,
        totalUsers: team.userAssignments.length,
        users: team.userAssignments.map(ua => ua.user),
      })),
      surveyAnalytics: surveyAnalytics,
      overallStatistics: {
        totalSurveys: surveyAnalytics.length,
        averageCompletionRate:
          surveyAnalytics.length > 0
            ? surveyAnalytics.reduce((acc, survey) => acc + survey.completionRate, 0) /
              surveyAnalytics.length
            : 0,
        totalResponses: surveyAnalytics.reduce((acc, survey) => acc + survey.totalResponses, 0),
        mostEngagedUsers: deptUsers
          .map(user => {
            const userResponses = surveyAnalytics.reduce(
              (acc, survey) => acc + survey.responses.filter(r => r.userId === user.id).length,
              0,
            );
            return {
              userId: user.id,
              userName: user.name,
              responseCount: userResponses,
              engagementRate:
                surveyAnalytics.length > 0 ? (userResponses / surveyAnalytics.length) * 100 : 0,
            };
          })
          .sort((a, b) => b.engagementRate - a.engagementRate),
      },
    };
  }

  // NEW: Aggregated question analytics across all surveys for a department
  async getDepartmentQuestionAnalytics(departmentId: string, sessionId?: string) {
    // Fetch department and its users
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        userAssignments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    const deptUserIds = department.userAssignments.map(ua => ua.userId);

    // Fetch all surveys assigned to this department (optionally filter by session)
    const surveyAssignments = await prisma.surveyAssignment.findMany({
      where: {
        assignedToType: 'DEPARTMENT',
        assignedToId: departmentId,
        ...(sessionId && {
          survey: {
            sessionId: sessionId,
          },
        }),
      },
      include: {
        survey: {
          include: {
            questions: true,
            responses: {
              where: {
                userId: {
                  in: deptUserIds,
                },
              },
              include: {
                questionResponses: {
                  include: {
                    question: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Build per-question analytics
    interface QuestionAgg {
      questionId: string;
      surveyId: string;
      surveyTitle: string;
      questionText: string;
      questionType: string;
      surveyType: string;
      responseCount: number;
      distribution: Record<string, number>;
      numericValues: number[];
    }

    const questionMap = new Map<string, QuestionAgg>();

    surveyAssignments.forEach((assignment: any) => {
      const survey = assignment.survey;

      survey.questions.forEach((question: any) => {
        const key = `${question.id}`;
        if (!questionMap.has(key)) {
          questionMap.set(key, {
            questionId: question.id,
            surveyId: survey.id,
            surveyTitle: survey.title,
            questionText: question.questionText,
            questionType: question.questionType,
            surveyType: question.surveyType,
            responseCount: 0,
            distribution: {},
            numericValues: [],
          });
        }
      });

      // Iterate responses
      survey.responses.forEach((resp: any) => {
        resp.questionResponses.forEach((qr: any) => {
          const agg = questionMap.get(qr.questionId);
          if (!agg) return;
          agg.responseCount += 1;
          const key = String(qr.responseValue);
          agg.distribution[key] = (agg.distribution[key] || 0) + 1;

          if (
            agg.questionType === 'RATING_SCALE' ||
            agg.questionType === 'MATRIX' ||
            typeof qr.responseValue === 'number' ||
            !isNaN(Number(qr.responseValue))
          ) {
            const num = Number(qr.responseValue);
            if (!isNaN(num)) agg.numericValues.push(num);
          }
        });
      });
    });

    // Transform to final analytics list
    const questionAnalytics = Array.from(questionMap.values()).map(agg => {
      let averageRating: number | null = null;
      let minRating: number | null = null;
      let maxRating: number | null = null;

      if (agg.numericValues.length > 0) {
        const total = agg.numericValues.reduce((a, b) => a + b, 0);
        averageRating = total / agg.numericValues.length;
        minRating = Math.min(...agg.numericValues);
        maxRating = Math.max(...agg.numericValues);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { numericValues, ...rest } = agg;
      return { ...rest, averageRating, minRating, maxRating };
    });

    // Aggregate by question type
    const questionTypeAnalytics: Record<
      string,
      { questionCount: number; totalResponses: number; averageRating: number | null }
    > = {};

    questionAnalytics.forEach(q => {
      if (!questionTypeAnalytics[q.questionType]) {
        questionTypeAnalytics[q.questionType] = {
          questionCount: 0,
          totalResponses: 0,
          averageRating: null,
        };
      }
      const qtAgg = questionTypeAnalytics[q.questionType];
      qtAgg.questionCount += 1;
      qtAgg.totalResponses += q.responseCount;
      if (q.averageRating !== null) {
        if (qtAgg.averageRating === null) qtAgg.averageRating = q.averageRating;
        else {
          qtAgg.averageRating =
            (qtAgg.averageRating * (qtAgg.questionCount - 1) + q.averageRating) /
            qtAgg.questionCount;
        }
      }
    });

    return {
      departmentInfo: {
        id: department.id,
        name: department.name,
        organizationId: department.organizationId,
      },
      questionAnalytics,
      questionTypeAnalytics,
      overallStatistics: {
        totalQuestions: questionAnalytics.length,
        totalResponses: questionAnalytics.reduce((acc, q) => acc + q.responseCount, 0),
      },
    };
  }
}
