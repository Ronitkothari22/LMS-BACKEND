"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class SurveyService {
    formatDateForDB(date) {
        if (!date || date === '') {
            return null;
        }
        if (typeof date === 'string') {
            const parsedDate = new Date(date);
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        }
        return date;
    }
    async createSurvey(data, createdById) {
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
                isOptional: data.isOptional !== false,
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
    async getSurveysBySession(sessionId) {
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
    async getSurveyById(id) {
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
    async updateSurvey(id, data) {
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
    async deleteSurvey(id) {
        return await prisma.survey.delete({
            where: { id },
        });
    }
    async addQuestionToSurvey(data) {
        return await prisma.surveyQuestion.create({
            data: {
                surveyId: data.surveyId,
                questionText: data.questionText,
                questionType: data.questionType,
                surveyType: data.surveyType,
                options: data.options,
                validationRules: data.validationRules,
                isRequired: data.isRequired !== false,
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
    async updateSurveyQuestion(id, data) {
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
    async deleteSurveyQuestion(id) {
        return await prisma.surveyQuestion.delete({
            where: { id },
        });
    }
    async assignSurvey(data, assignedById) {
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
        if (assignment.survey.status === 'DRAFT' && data.assignedToType === 'DEPARTMENT') {
            const departmentWithUsers = await prisma.department.findUnique({
                where: { id: data.assignedToId },
                include: {
                    userAssignments: {
                        select: { id: true },
                    },
                },
            });
            if (departmentWithUsers && departmentWithUsers.userAssignments.length > 0) {
                await prisma.survey.update({
                    where: { id: data.surveyId },
                    data: { status: 'ACTIVE' },
                });
                assignment.survey.status = 'ACTIVE';
            }
        }
        else if (assignment.survey.status === 'DRAFT' && data.assignedToType === 'TEAM') {
            const teamWithUsers = await prisma.surveyTeam.findUnique({
                where: { id: data.assignedToId },
                include: {
                    userAssignments: {
                        select: { id: true },
                    },
                },
            });
            if (teamWithUsers && teamWithUsers.userAssignments.length > 0) {
                await prisma.survey.update({
                    where: { id: data.surveyId },
                    data: { status: 'ACTIVE' },
                });
                assignment.survey.status = 'ACTIVE';
            }
        }
        return assignment;
    }
    async getSurveyAssignments(surveyId) {
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
    async removeAssignment(id) {
        return await prisma.surveyAssignment.delete({
            where: { id },
        });
    }
    async submitSurveyResponse(data, userId) {
        return await prisma.$transaction(async (tx) => {
            const surveyResponse = await tx.surveyResponse.create({
                data: {
                    surveyId: data.surveyId,
                    userId,
                    submittedAt: new Date(),
                    completionStatus: 'COMPLETE',
                },
            });
            await Promise.all(data.responses.map(response => tx.surveyQuestionResponse.create({
                data: {
                    surveyResponseId: surveyResponse.id,
                    questionId: response.questionId,
                    responseValue: response.responseValue,
                },
            })));
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
    async getUserSurveyResponses(userId, sessionId) {
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
    async getSurveyAnalytics(surveyId) {
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
        const averageResponseTime = survey.responses.reduce((acc, response) => {
            return acc + (response.responseTimeSeconds || 0);
        }, 0) / totalResponses;
        const questionAnalytics = survey.questions.map(question => {
            const questionResponses = survey.responses.flatMap(r => r.questionResponses.filter(qr => qr.questionId === question.id));
            const distribution = {};
            questionResponses.forEach(qr => {
                const key = String(qr.responseValue);
                distribution[key] = (distribution[key] || 0) + 1;
            });
            let averageRating = null;
            let minRating = null;
            let maxRating = null;
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
        const surveyTypeAnalytics = {};
        questionAnalytics.forEach(qA => {
            if (!surveyTypeAnalytics[qA.surveyType]) {
                surveyTypeAnalytics[qA.surveyType] = { responseCount: 0, averageRating: null };
            }
            surveyTypeAnalytics[qA.surveyType].responseCount += qA.responseCount;
            if (qA.averageRating !== null) {
                const current = surveyTypeAnalytics[qA.surveyType];
                if (current.averageRating === null) {
                    current.averageRating = qA.averageRating;
                }
                else {
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
    async getSurveyDepartmentBreakdown(surveyId) {
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
        const assignedDepartmentIds = survey.assignments.map(a => a.assignedToId);
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
        const departmentAnalytics = departments.map(dept => {
            const deptUsers = dept.userAssignments.map(ua => ua.user);
            const deptResponses = survey.responses.filter(response => deptUsers.some(user => user.id === response.userId));
            const teamAnalytics = dept.teams.map(team => {
                const teamUsers = team.userAssignments.map(ua => ua.user);
                const teamResponses = survey.responses.filter(response => teamUsers.some(user => user.id === response.userId));
                return {
                    teamId: team.id,
                    teamName: team.name,
                    totalUsers: teamUsers.length,
                    totalResponses: teamResponses.length,
                    completionRate: teamUsers.length > 0 ? (teamResponses.length / teamUsers.length) * 100 : 0,
                    responses: teamResponses.map(r => {
                        var _a;
                        return ({
                            userId: r.userId,
                            userName: ((_a = deptUsers.find(u => u.id === r.userId)) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                            submittedAt: r.submittedAt,
                            completionStatus: r.completionStatus,
                            responseTime: r.responseTimeSeconds,
                        });
                    }),
                };
            });
            const departmentQuestionAnalytics = survey.questions.map(question => {
                const questionResponses = deptResponses.flatMap(r => r.questionResponses.filter(qr => qr.questionId === question.id));
                const distribution = {};
                questionResponses.forEach(qr => {
                    const key = String(qr.responseValue);
                    distribution[key] = (distribution[key] || 0) + 1;
                });
                let averageRating = null;
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
            const departmentSurveyTypeAnalytics = {};
            departmentQuestionAnalytics.forEach(qA => {
                if (!departmentSurveyTypeAnalytics[qA.surveyType]) {
                    departmentSurveyTypeAnalytics[qA.surveyType] = { responseCount: 0, averageRating: null };
                }
                departmentSurveyTypeAnalytics[qA.surveyType].responseCount += qA.responseCount;
                if (qA.averageRating !== null) {
                    const current = departmentSurveyTypeAnalytics[qA.surveyType];
                    if (current.averageRating === null)
                        current.averageRating = qA.averageRating;
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
                averageResponseTime: deptResponses.length > 0
                    ? deptResponses.reduce((acc, r) => acc + (r.responseTimeSeconds || 0), 0) /
                        deptResponses.length
                    : 0,
                teams: teamAnalytics,
                questionAnalytics: departmentQuestionAnalytics,
                surveyTypeAnalytics: departmentSurveyTypeAnalytics,
                responses: deptResponses.map(r => {
                    var _a;
                    return ({
                        userId: r.userId,
                        userName: ((_a = deptUsers.find(u => u.id === r.userId)) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                        submittedAt: r.submittedAt,
                        completionStatus: r.completionStatus,
                        responseTime: r.responseTimeSeconds,
                        questionResponses: r.questionResponses.map(qr => ({
                            questionId: qr.questionId,
                            questionText: qr.question.questionText,
                            responseValue: qr.responseValue,
                            respondedAt: qr.respondedAt,
                        })),
                    });
                }),
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
                overallCompletionRate: departments.length > 0
                    ? departmentAnalytics.reduce((acc, dept) => acc + dept.completionRate, 0) /
                        departments.length
                    : 0,
            },
        };
    }
    async getDepartmentSurveyAnalytics(departmentId, sessionId) {
        var _a, _b;
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
                completionRate: deptUsers.length > 0 ? (surveyResponses.length / deptUsers.length) * 100 : 0,
                averageResponseTime: surveyResponses.length > 0
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
                sessionId: (_a = department.organization.session) === null || _a === void 0 ? void 0 : _a.id,
                sessionTitle: (_b = department.organization.session) === null || _b === void 0 ? void 0 : _b.title,
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
                averageCompletionRate: surveyAnalytics.length > 0
                    ? surveyAnalytics.reduce((acc, survey) => acc + survey.completionRate, 0) /
                        surveyAnalytics.length
                    : 0,
                totalResponses: surveyAnalytics.reduce((acc, survey) => acc + survey.totalResponses, 0),
                mostEngagedUsers: deptUsers
                    .map(user => {
                    const userResponses = surveyAnalytics.reduce((acc, survey) => acc + survey.responses.filter(r => r.userId === user.id).length, 0);
                    return {
                        userId: user.id,
                        userName: user.name,
                        responseCount: userResponses,
                        engagementRate: surveyAnalytics.length > 0 ? (userResponses / surveyAnalytics.length) * 100 : 0,
                    };
                })
                    .sort((a, b) => b.engagementRate - a.engagementRate),
            },
        };
    }
    async getDepartmentQuestionAnalytics(departmentId, sessionId) {
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
        const questionMap = new Map();
        surveyAssignments.forEach((assignment) => {
            const survey = assignment.survey;
            survey.questions.forEach((question) => {
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
            survey.responses.forEach((resp) => {
                resp.questionResponses.forEach((qr) => {
                    const agg = questionMap.get(qr.questionId);
                    if (!agg)
                        return;
                    agg.responseCount += 1;
                    const key = String(qr.responseValue);
                    agg.distribution[key] = (agg.distribution[key] || 0) + 1;
                    if (agg.questionType === 'RATING_SCALE' ||
                        agg.questionType === 'MATRIX' ||
                        typeof qr.responseValue === 'number' ||
                        !isNaN(Number(qr.responseValue))) {
                        const num = Number(qr.responseValue);
                        if (!isNaN(num))
                            agg.numericValues.push(num);
                    }
                });
            });
        });
        const questionAnalytics = Array.from(questionMap.values()).map(agg => {
            let averageRating = null;
            let minRating = null;
            let maxRating = null;
            if (agg.numericValues.length > 0) {
                const total = agg.numericValues.reduce((a, b) => a + b, 0);
                averageRating = total / agg.numericValues.length;
                minRating = Math.min(...agg.numericValues);
                maxRating = Math.max(...agg.numericValues);
            }
            const { numericValues, ...rest } = agg;
            return { ...rest, averageRating, minRating, maxRating };
        });
        const questionTypeAnalytics = {};
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
                if (qtAgg.averageRating === null)
                    qtAgg.averageRating = q.averageRating;
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
exports.SurveyService = SurveyService;
//# sourceMappingURL=survey.service.js.map