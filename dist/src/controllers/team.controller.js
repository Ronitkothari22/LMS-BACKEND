"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionIndividualPointAwards = exports.getIndividualPointAwards = exports.awardIndividualPoints = exports.getTeamPointAwards = exports.awardTeamPoints = exports.getTeamLeaderboard = exports.autoAssignTeams = exports.deleteTeam = exports.bulkAssignMembers = exports.updateTeamMemberRole = exports.removeTeamMember = exports.addTeamMember = exports.getTeamById = exports.getTeams = exports.updateTeam = exports.createTeam = void 0;
const http_exception_1 = __importDefault(require("../utils/http-exception"));
const logger_config_1 = __importDefault(require("../config/logger.config"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const param_parser_1 = require("../utils/param-parser");
const createTeam = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const { name, description, color, maxMembers } = req.body;
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: { id: true, title: true },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const existingTeam = await prisma_1.default.team.findFirst({
            where: {
                sessionId,
                name,
            },
        });
        if (existingTeam) {
            throw new http_exception_1.default(400, 'Team name already exists in this session');
        }
        const team = await prisma_1.default.team.create({
            data: {
                name,
                description,
                color,
                maxMembers,
                sessionId,
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profilePhoto: true,
                            },
                        },
                    },
                },
                session: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        logger_config_1.default.info(`Team "${name}" created in session "${session.title}"`);
        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            data: {
                team: {
                    id: team.id,
                    name: team.name,
                    description: team.description,
                    color: team.color,
                    maxMembers: team.maxMembers,
                    isActive: team.isActive,
                    memberCount: team.members.length,
                    members: team.members.map(member => ({
                        id: member.id,
                        user: member.user,
                        role: member.role,
                        joinedAt: member.joinedAt,
                    })),
                    session: team.session,
                    createdAt: team.createdAt,
                    updatedAt: team.updatedAt,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTeam = createTeam;
const updateTeam = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const teamId = (0, param_parser_1.getParamString)(req.params.teamId);
        const updateData = req.body;
        const existingTeam = await prisma_1.default.team.findFirst({
            where: {
                id: teamId,
                sessionId,
            },
        });
        if (!existingTeam) {
            throw new http_exception_1.default(404, 'Team not found in this session');
        }
        if (updateData.name && updateData.name !== existingTeam.name) {
            const duplicateTeam = await prisma_1.default.team.findFirst({
                where: {
                    sessionId,
                    name: updateData.name,
                    id: { not: teamId },
                },
            });
            if (duplicateTeam) {
                throw new http_exception_1.default(400, 'Team name already exists in this session');
            }
        }
        const updatedTeam = await prisma_1.default.team.update({
            where: { id: teamId },
            data: updateData,
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profilePhoto: true,
                            },
                        },
                    },
                },
                session: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        logger_config_1.default.info(`Team "${updatedTeam.name}" updated in session "${updatedTeam.session.title}"`);
        res.json({
            success: true,
            message: 'Team updated successfully',
            data: {
                team: {
                    id: updatedTeam.id,
                    name: updatedTeam.name,
                    description: updatedTeam.description,
                    color: updatedTeam.color,
                    maxMembers: updatedTeam.maxMembers,
                    isActive: updatedTeam.isActive,
                    memberCount: updatedTeam.members.length,
                    members: updatedTeam.members.map(member => ({
                        id: member.id,
                        user: member.user,
                        role: member.role,
                        joinedAt: member.joinedAt,
                    })),
                    session: updatedTeam.session,
                    createdAt: updatedTeam.createdAt,
                    updatedAt: updatedTeam.updatedAt,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTeam = updateTeam;
const getTeams = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const { includeInactive } = req.query;
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: { id: true, title: true },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const whereClause = { sessionId };
        if (!includeInactive) {
            whereClause.isActive = true;
        }
        const teams = await prisma_1.default.team.findMany({
            where: whereClause,
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profilePhoto: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        res.json({
            success: true,
            message: 'Teams retrieved successfully',
            data: {
                session: {
                    id: session.id,
                    title: session.title,
                },
                teams: teams.map(team => ({
                    id: team.id,
                    name: team.name,
                    description: team.description,
                    color: team.color,
                    maxMembers: team.maxMembers,
                    isActive: team.isActive,
                    memberCount: team.members.length,
                    members: team.members.map(member => ({
                        id: member.id,
                        user: member.user,
                        role: member.role,
                        joinedAt: member.joinedAt,
                    })),
                    createdAt: team.createdAt,
                    updatedAt: team.updatedAt,
                })),
                totalTeams: teams.length,
                activeTeams: teams.filter(team => team.isActive).length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTeams = getTeams;
const getTeamById = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const teamId = (0, param_parser_1.getParamString)(req.params.teamId);
        const team = await prisma_1.default.team.findFirst({
            where: {
                id: teamId,
                sessionId,
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profilePhoto: true,
                                companyPosition: true,
                                department: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
                session: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        if (!team) {
            throw new http_exception_1.default(404, 'Team not found in this session');
        }
        res.json({
            success: true,
            message: 'Team retrieved successfully',
            data: {
                team: {
                    id: team.id,
                    name: team.name,
                    description: team.description,
                    color: team.color,
                    maxMembers: team.maxMembers,
                    isActive: team.isActive,
                    memberCount: team.members.length,
                    members: team.members.map(member => ({
                        id: member.id,
                        user: member.user,
                        role: member.role,
                        joinedAt: member.joinedAt,
                    })),
                    session: team.session,
                    createdAt: team.createdAt,
                    updatedAt: team.updatedAt,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTeamById = getTeamById;
const addTeamMember = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const teamId = (0, param_parser_1.getParamString)(req.params.teamId);
        const { userId, role } = req.body;
        const team = await prisma_1.default.team.findFirst({
            where: {
                id: teamId,
                sessionId,
                isActive: true,
            },
            include: {
                members: true,
            },
        });
        if (!team) {
            throw new http_exception_1.default(404, 'Active team not found in this session');
        }
        const user = await prisma_1.default.user.findFirst({
            where: {
                id: userId,
                OR: [
                    {
                        sessionsParticipated: {
                            some: { id: sessionId },
                        },
                    },
                    {
                        sessionsInvited: {
                            some: { id: sessionId },
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
            },
        });
        if (!user) {
            throw new http_exception_1.default(404, 'User not found or not associated with this session');
        }
        const existingMembership = await prisma_1.default.teamMember.findFirst({
            where: {
                teamId,
                userId,
            },
        });
        if (existingMembership) {
            throw new http_exception_1.default(400, 'User is already a member of this team');
        }
        if (team.maxMembers && team.members.length >= team.maxMembers) {
            throw new http_exception_1.default(400, 'Team has reached maximum capacity');
        }
        const existingTeamMembership = await prisma_1.default.teamMember.findFirst({
            where: {
                userId,
                team: {
                    sessionId,
                    isActive: true,
                },
            },
            include: {
                team: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (existingTeamMembership) {
            throw new http_exception_1.default(400, `User is already a member of team "${existingTeamMembership.team.name}" in this session`);
        }
        const teamMember = await prisma_1.default.teamMember.create({
            data: {
                teamId,
                userId,
                role: role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePhoto: true,
                    },
                },
            },
        });
        logger_config_1.default.info(`User "${user.name}" added to team "${team.name}"`);
        res.status(201).json({
            success: true,
            message: 'Team member added successfully',
            data: {
                teamMember: {
                    id: teamMember.id,
                    user: teamMember.user,
                    role: teamMember.role,
                    joinedAt: teamMember.joinedAt,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addTeamMember = addTeamMember;
const removeTeamMember = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const teamId = (0, param_parser_1.getParamString)(req.params.teamId);
        const userId = (0, param_parser_1.getParamString)(req.params.userId);
        const team = await prisma_1.default.team.findFirst({
            where: {
                id: teamId,
                sessionId,
            },
            select: {
                id: true,
                name: true,
            },
        });
        if (!team) {
            throw new http_exception_1.default(404, 'Team not found in this session');
        }
        const teamMember = await prisma_1.default.teamMember.findFirst({
            where: {
                teamId,
                userId,
            },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!teamMember) {
            throw new http_exception_1.default(404, 'Team member not found');
        }
        await prisma_1.default.teamMember.delete({
            where: {
                id: teamMember.id,
            },
        });
        logger_config_1.default.info(`User "${teamMember.user.name}" removed from team "${team.name}"`);
        res.json({
            success: true,
            message: 'Team member removed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeTeamMember = removeTeamMember;
const updateTeamMemberRole = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const teamId = (0, param_parser_1.getParamString)(req.params.teamId);
        const userId = (0, param_parser_1.getParamString)(req.params.userId);
        const { role } = req.body;
        const team = await prisma_1.default.team.findFirst({
            where: {
                id: teamId,
                sessionId,
            },
            select: {
                id: true,
                name: true,
            },
        });
        if (!team) {
            throw new http_exception_1.default(404, 'Team not found in this session');
        }
        const teamMember = await prisma_1.default.teamMember.findFirst({
            where: {
                teamId,
                userId,
            },
        });
        if (!teamMember) {
            throw new http_exception_1.default(404, 'Team member not found');
        }
        const updatedTeamMember = await prisma_1.default.teamMember.update({
            where: {
                id: teamMember.id,
            },
            data: {
                role: role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePhoto: true,
                    },
                },
            },
        });
        logger_config_1.default.info(`Updated role of "${updatedTeamMember.user.name}" in team "${team.name}" to ${role}`);
        res.json({
            success: true,
            message: 'Team member role updated successfully',
            data: {
                teamMember: {
                    id: updatedTeamMember.id,
                    user: updatedTeamMember.user,
                    role: updatedTeamMember.role,
                    joinedAt: updatedTeamMember.joinedAt,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTeamMemberRole = updateTeamMemberRole;
const bulkAssignMembers = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const { assignments } = req.body;
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: { id: true, title: true },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const results = [];
        const errors = [];
        for (const assignment of assignments) {
            try {
                const { userId, teamId, role } = assignment;
                const team = await prisma_1.default.team.findFirst({
                    where: {
                        id: teamId,
                        sessionId,
                        isActive: true,
                    },
                    include: {
                        members: true,
                    },
                });
                if (!team) {
                    errors.push({
                        userId,
                        teamId,
                        error: 'Team not found or inactive',
                    });
                    continue;
                }
                const user = await prisma_1.default.user.findFirst({
                    where: {
                        id: userId,
                        OR: [
                            {
                                sessionsParticipated: {
                                    some: { id: sessionId },
                                },
                            },
                            {
                                sessionsInvited: {
                                    some: { id: sessionId },
                                },
                            },
                        ],
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                });
                if (!user) {
                    errors.push({
                        userId,
                        teamId,
                        error: 'User not found or not associated with session',
                    });
                    continue;
                }
                const existingMembership = await prisma_1.default.teamMember.findFirst({
                    where: {
                        userId,
                        team: {
                            sessionId,
                            isActive: true,
                        },
                    },
                });
                if (existingMembership) {
                    await prisma_1.default.teamMember.delete({
                        where: {
                            id: existingMembership.id,
                        },
                    });
                }
                if (team.maxMembers && team.members.length >= team.maxMembers) {
                    errors.push({
                        userId,
                        teamId,
                        error: 'Team has reached maximum capacity',
                    });
                    continue;
                }
                const teamMember = await prisma_1.default.teamMember.create({
                    data: {
                        teamId,
                        userId,
                        role: role,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        team: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                });
                results.push({
                    userId,
                    teamId,
                    teamName: teamMember.team.name,
                    userName: teamMember.user.name,
                    role: teamMember.role,
                    status: 'success',
                });
            }
            catch (error) {
                errors.push({
                    userId: assignment.userId,
                    teamId: assignment.teamId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        logger_config_1.default.info(`Bulk assignment completed: ${results.length} successful, ${errors.length} errors`);
        res.json({
            success: true,
            message: 'Bulk assignment completed',
            data: {
                successful: results,
                errors,
                summary: {
                    total: assignments.length,
                    successful: results.length,
                    failed: errors.length,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkAssignMembers = bulkAssignMembers;
const deleteTeam = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const teamId = (0, param_parser_1.getParamString)(req.params.teamId);
        const team = await prisma_1.default.team.findFirst({
            where: {
                id: teamId,
                sessionId,
            },
            include: {
                members: true,
            },
        });
        if (!team) {
            throw new http_exception_1.default(404, 'Team not found in this session');
        }
        await prisma_1.default.team.delete({
            where: {
                id: teamId,
            },
        });
        logger_config_1.default.info(`Team "${team.name}" deleted with ${team.members.length} members`);
        res.json({
            success: true,
            message: 'Team deleted successfully',
            data: {
                deletedTeam: {
                    name: team.name,
                    memberCount: team.members.length,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTeam = deleteTeam;
const autoAssignTeams = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const { strategy, teamsCount, maxMembersPerTeam } = req.body;
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            include: {
                participants: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        if (session.participants.length === 0) {
            throw new http_exception_1.default(400, 'No participants in session to assign to teams');
        }
        const existingTeams = await prisma_1.default.team.findMany({
            where: {
                sessionId,
                isActive: true,
            },
        });
        const participants = [...session.participants];
        let teams = [...existingTeams];
        let targetTeamCount = teamsCount;
        if (!targetTeamCount) {
            const maxMembers = maxMembersPerTeam || 5;
            targetTeamCount = Math.ceil(participants.length / maxMembers);
        }
        while (teams.length < targetTeamCount) {
            const teamNumber = teams.length + 1;
            const newTeam = await prisma_1.default.team.create({
                data: {
                    name: `Team ${teamNumber}`,
                    sessionId,
                    maxMembers: maxMembersPerTeam,
                },
            });
            teams.push(newTeam);
        }
        await prisma_1.default.teamMember.deleteMany({
            where: {
                team: {
                    sessionId,
                },
            },
        });
        if (strategy === 'RANDOM') {
            for (let i = participants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [participants[i], participants[j]] = [participants[j], participants[i]];
            }
        }
        const assignments = [];
        for (let i = 0; i < participants.length; i++) {
            const teamIndex = strategy === 'BALANCED' ? i % teams.length : i % teams.length;
            const participant = participants[i];
            const team = teams[teamIndex];
            await prisma_1.default.teamMember.create({
                data: {
                    teamId: team.id,
                    userId: participant.id,
                    role: 'MEMBER',
                },
            });
            assignments.push({
                userId: participant.id,
                userName: participant.name,
                teamId: team.id,
                teamName: team.name,
            });
        }
        logger_config_1.default.info(`Auto-assigned ${participants.length} participants to ${teams.length} teams`);
        res.json({
            success: true,
            message: 'Participants auto-assigned to teams successfully',
            data: {
                strategy,
                assignments,
                summary: {
                    totalParticipants: participants.length,
                    totalTeams: teams.length,
                    averageMembersPerTeam: Math.round(participants.length / teams.length),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.autoAssignTeams = autoAssignTeams;
const getTeamLeaderboard = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const { sortBy, order, includeInactive } = req.query;
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                title: true,
                state: true,
            },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const whereClause = { sessionId };
        if (!includeInactive) {
            whereClause.isActive = true;
        }
        const teams = await prisma_1.default.team.findMany({
            where: whereClause,
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profilePhoto: true,
                                xpPoints: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });
        const sessionQuizzes = await prisma_1.default.quiz.findMany({
            where: { sessionId },
            include: {
                responses: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        const manualPointsQuery = (await prisma_1.default.$queryRaw `
      SELECT 
        t.id as "teamId",
        COALESCE(SUM(tpa.points), 0) as "totalPoints",
        COUNT(tpa.id) as "totalAwards"
      FROM "Team" t
      LEFT JOIN "TeamPointAward" tpa ON t.id = tpa."teamId"
      WHERE t."sessionId" = ${sessionId}
      GROUP BY t.id
    `);
        const manualPointsMap = new Map(manualPointsQuery.map((item) => [
            item.teamId,
            {
                totalPoints: Number(item.totalPoints),
                totalAwards: Number(item.totalAwards),
            },
        ]));
        const individualPointsQuery = (await prisma_1.default.$queryRaw `
      SELECT 
        tm."teamId" as "teamId",
        u.id as "userId",
        u.name as "userName",
        COALESCE(SUM(ipa.points), 0) as "totalIndividualPoints",
        COUNT(ipa.id) as "totalIndividualAwards"
      FROM "User" u
      INNER JOIN "TeamMember" tm ON u.id = tm."userId"
      INNER JOIN "Team" t ON tm."teamId" = t.id AND t."sessionId" = ${sessionId}
      LEFT JOIN "IndividualPointAward" ipa ON u.id = ipa."userId" AND ipa."sessionId" = ${sessionId}
      GROUP BY tm."teamId", u.id, u.name
    `);
        const individualPointsMap = new Map();
        individualPointsQuery.forEach((item) => {
            const teamId = item.teamId;
            if (!individualPointsMap.has(teamId)) {
                individualPointsMap.set(teamId, []);
            }
            individualPointsMap.get(teamId).push({
                userId: item.userId,
                userName: item.userName,
                totalIndividualPoints: Number(item.totalIndividualPoints),
                totalIndividualAwards: Number(item.totalIndividualAwards),
            });
        });
        const leaderboardData = teams.map(team => {
            const memberContributions = team.members.map(member => {
                const memberQuizResponses = sessionQuizzes.flatMap(quiz => quiz.responses.filter(response => response.user.id === member.user.id));
                const memberQuizScore = memberQuizResponses.reduce((sum, response) => sum + (response.totalScore || response.score || 0), 0);
                const memberQuizCount = memberQuizResponses.length;
                const memberAverageScore = memberQuizCount > 0 ? Math.round((memberQuizScore / memberQuizCount) * 100) / 100 : 0;
                const memberParticipationRate = sessionQuizzes.length > 0
                    ? Math.round((memberQuizCount / sessionQuizzes.length) * 100)
                    : 0;
                return {
                    id: member.id,
                    user: {
                        id: member.user.id,
                        name: member.user.name,
                        email: member.user.email,
                        profilePhoto: member.user.profilePhoto,
                        xpPoints: member.user.xpPoints,
                    },
                    role: member.role,
                    joinedAt: member.joinedAt,
                    quizContribution: {
                        totalQuizScore: Math.round(memberQuizScore * 100) / 100,
                        averageQuizScore: memberAverageScore,
                        quizzesCompleted: memberQuizCount,
                        participationRate: memberParticipationRate,
                    },
                };
            });
            const teamTotalQuizScore = memberContributions.reduce((sum, member) => sum + member.quizContribution.totalQuizScore, 0);
            const teamManualPoints = manualPointsMap.get(team.id) || { totalPoints: 0, totalAwards: 0 };
            const manualPointsAwarded = teamManualPoints.totalPoints;
            const teamIndividualPoints = individualPointsMap.get(team.id) || [];
            const totalIndividualPoints = teamIndividualPoints.reduce((sum, member) => sum + member.totalIndividualPoints, 0);
            const totalIndividualAwards = teamIndividualPoints.reduce((sum, member) => sum + member.totalIndividualAwards, 0);
            const enhancedMemberContributions = memberContributions.map(member => {
                const memberIndividualData = teamIndividualPoints.find((indiv) => indiv.userId === member.user.id);
                return {
                    ...member,
                    individualPoints: {
                        totalPoints: (memberIndividualData === null || memberIndividualData === void 0 ? void 0 : memberIndividualData.totalIndividualPoints) || 0,
                        totalAwards: (memberIndividualData === null || memberIndividualData === void 0 ? void 0 : memberIndividualData.totalIndividualAwards) || 0,
                    },
                };
            });
            const teamTotalQuizzesCompleted = memberContributions.reduce((sum, member) => sum + member.quizContribution.quizzesCompleted, 0);
            const teamAverageQuizScore = teamTotalQuizzesCompleted > 0
                ? Math.round((teamTotalQuizScore / teamTotalQuizzesCompleted) * 100) / 100
                : 0;
            const teamQuizParticipationRate = sessionQuizzes.length > 0 && team.members.length > 0
                ? Math.round((teamTotalQuizzesCompleted / (sessionQuizzes.length * team.members.length)) * 100)
                : 0;
            const sortedMembers = enhancedMemberContributions.sort((a, b) => b.quizContribution.totalQuizScore +
                b.individualPoints.totalPoints -
                (a.quizContribution.totalQuizScore + a.individualPoints.totalPoints));
            const totalTeamScore = Math.round((teamTotalQuizScore + manualPointsAwarded + totalIndividualPoints) * 100) / 100;
            return {
                id: team.id,
                name: team.name,
                description: team.description,
                color: team.color,
                isActive: team.isActive,
                memberCount: team.members.length,
                maxMembers: team.maxMembers,
                members: sortedMembers,
                quizMetrics: {
                    totalQuizScore: Math.round(teamTotalQuizScore * 100) / 100,
                    averageQuizScore: teamAverageQuizScore,
                    totalQuizzesCompleted: teamTotalQuizzesCompleted,
                    participationRate: teamQuizParticipationRate,
                    topContributor: sortedMembers.length > 0 ? sortedMembers[0].user.name : null,
                    topContribution: sortedMembers.length > 0 ? sortedMembers[0].quizContribution.totalQuizScore : 0,
                },
                pointAwards: {
                    manualPointsAwarded: manualPointsAwarded,
                    totalAwardsCount: teamManualPoints.totalAwards,
                    recentAwards: [],
                },
                individualPointAwards: {
                    totalIndividualPoints: totalIndividualPoints,
                    totalIndividualAwards: totalIndividualAwards,
                    topIndividualContributor: teamIndividualPoints.length > 0
                        ? teamIndividualPoints.reduce((max, member) => member.totalIndividualPoints > max.totalIndividualPoints ? member : max)
                        : null,
                },
                totalScore: totalTeamScore,
                createdAt: team.createdAt,
                updatedAt: team.updatedAt,
            };
        });
        const sortedTeams = leaderboardData.sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case 'totalXP':
                    aValue = a.members.reduce((sum, member) => sum + member.user.xpPoints, 0);
                    bValue = b.members.reduce((sum, member) => sum + member.user.xpPoints, 0);
                    break;
                case 'averageXP':
                    aValue =
                        a.members.length > 0
                            ? Math.round(a.members.reduce((sum, member) => sum + member.user.xpPoints, 0) /
                                a.members.length)
                            : 0;
                    bValue =
                        b.members.length > 0
                            ? Math.round(b.members.reduce((sum, member) => sum + member.user.xpPoints, 0) /
                                b.members.length)
                            : 0;
                    break;
                case 'quizScore':
                    aValue = a.quizMetrics.totalQuizScore;
                    bValue = b.quizMetrics.totalQuizScore;
                    break;
                case 'totalScore':
                    aValue = a.totalScore;
                    bValue = b.totalScore;
                    break;
                case 'participationRate':
                    aValue = a.quizMetrics.participationRate;
                    bValue = b.quizMetrics.participationRate;
                    break;
                case 'memberCount':
                    aValue = a.memberCount;
                    bValue = b.memberCount;
                    break;
                default:
                    aValue = a.totalScore;
                    bValue = b.totalScore;
            }
            return order === 'desc' ? bValue - aValue : aValue - bValue;
        });
        const rankedTeams = sortedTeams.map((team, index) => ({
            ...team,
            rank: index + 1,
        }));
        const sessionSummary = {
            totalTeams: teams.length,
            activeTeams: teams.filter(team => team.isActive).length,
            totalParticipants: teams.reduce((sum, team) => sum + team.members.length, 0),
            totalQuizzes: sessionQuizzes.length,
            highestTeamScore: rankedTeams.length > 0 ? rankedTeams[0].totalScore : 0,
            totalQuizPoints: rankedTeams.reduce((sum, team) => sum + team.quizMetrics.totalQuizScore, 0),
            totalManualPoints: rankedTeams.reduce((sum, team) => sum + team.pointAwards.manualPointsAwarded, 0),
            sortedBy: sortBy,
            sortOrder: order,
        };
        logger_config_1.default.info(`Team leaderboard retrieved for session "${session.title}" - ${teams.length} teams`);
        res.json({
            success: true,
            message: 'Team leaderboard retrieved successfully',
            data: {
                session: {
                    id: session.id,
                    title: session.title,
                    state: session.state,
                },
                leaderboard: rankedTeams,
                summary: sessionSummary,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTeamLeaderboard = getTeamLeaderboard;
const awardTeamPoints = async (req, res, next) => {
    var _a;
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const teamId = (0, param_parser_1.getParamString)(req.params.teamId);
        const { points, reason, category } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            throw new http_exception_1.default(401, 'Authentication required');
        }
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: { id: true, title: true },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const team = await prisma_1.default.team.findFirst({
            where: {
                id: teamId,
                sessionId,
            },
            select: {
                id: true,
                name: true,
            },
        });
        if (!team) {
            throw new http_exception_1.default(404, 'Team not found in this session');
        }
        const pointAward = (await prisma_1.default.$queryRaw `
      INSERT INTO "TeamPointAward" (id, "teamId", "awardedById", points, reason, category, "createdAt")
      VALUES (gen_random_uuid(), ${teamId}, ${adminId}, ${points}, ${reason}, ${category || null}, NOW())
      RETURNING id, "teamId", "awardedById", points, reason, category, "createdAt"
    `);
        const admin = await prisma_1.default.user.findUnique({
            where: { id: adminId },
            select: { id: true, name: true, email: true },
        });
        const totalPointsResult = (await prisma_1.default.$queryRaw `
      SELECT COALESCE(SUM(points), 0) as total_points, COUNT(*) as total_awards
      FROM "TeamPointAward"
      WHERE "teamId" = ${teamId}
    `);
        const { total_points: totalManualPoints, total_awards: totalAwards } = totalPointsResult[0];
        logger_config_1.default.info(`${points} points awarded to team "${team.name}" by admin "${admin === null || admin === void 0 ? void 0 : admin.name}" in session "${session.title}"`);
        res.status(201).json({
            success: true,
            message: 'Points awarded to team successfully',
            data: {
                award: {
                    id: pointAward[0].id,
                    points: pointAward[0].points,
                    reason: pointAward[0].reason,
                    category: pointAward[0].category,
                    team: {
                        id: team.id,
                        name: team.name,
                    },
                    awardedBy: {
                        id: admin === null || admin === void 0 ? void 0 : admin.id,
                        name: admin === null || admin === void 0 ? void 0 : admin.name,
                    },
                    createdAt: pointAward[0].createdAt,
                },
                teamSummary: {
                    id: team.id,
                    name: team.name,
                    totalManualPoints: Number(totalManualPoints),
                    totalAwards: Number(totalAwards),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.awardTeamPoints = awardTeamPoints;
const getTeamPointAwards = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const teamId = (0, param_parser_1.getParamString)(req.params.teamId);
        const { limit, offset } = req.query;
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: { id: true, title: true },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const team = await prisma_1.default.team.findFirst({
            where: {
                id: teamId,
                sessionId,
            },
            select: {
                id: true,
                name: true,
                description: true,
            },
        });
        if (!team) {
            throw new http_exception_1.default(404, 'Team not found in this session');
        }
        const countResult = (await prisma_1.default.$queryRaw `
      SELECT COUNT(*) as total_count
      FROM "TeamPointAward"
      WHERE "teamId" = ${teamId}
    `);
        const totalCount = Number(countResult[0].total_count);
        const pointAwards = (await prisma_1.default.$queryRaw `
      SELECT 
        tpa.id,
        tpa.points,
        tpa.reason,
        tpa.category,
        tpa."createdAt",
        u.id as "awardedById",
        u.name as "awardedByName",
        u.email as "awardedByEmail"
      FROM "TeamPointAward" tpa
      JOIN "User" u ON tpa."awardedById" = u.id
      WHERE tpa."teamId" = ${teamId}
      ORDER BY tpa."createdAt" DESC
      LIMIT ${Number(limit)}
      OFFSET ${Number(offset)}
    `);
        const summaryResult = (await prisma_1.default.$queryRaw `
      SELECT 
        COALESCE(SUM(points), 0) as total_points,
        COUNT(*) as total_awards,
        COUNT(CASE WHEN points > 0 THEN 1 END) as positive_awards,
        COUNT(CASE WHEN points < 0 THEN 1 END) as negative_awards
      FROM "TeamPointAward"
      WHERE "teamId" = ${teamId}
    `);
        const summary = {
            totalPoints: Number(summaryResult[0].total_points),
            totalAwards: Number(summaryResult[0].total_awards),
            positiveAwards: Number(summaryResult[0].positive_awards),
            negativeAwards: Number(summaryResult[0].negative_awards),
        };
        logger_config_1.default.info(`Point awards history retrieved for team "${team.name}" - ${pointAwards.length} awards`);
        res.json({
            success: true,
            message: 'Team point awards retrieved successfully',
            data: {
                team: {
                    id: team.id,
                    name: team.name,
                    description: team.description,
                },
                awards: pointAwards.map((award) => ({
                    id: award.id,
                    points: award.points,
                    reason: award.reason,
                    category: award.category,
                    awardedBy: {
                        id: award.awardedById,
                        name: award.awardedByName,
                    },
                    createdAt: award.createdAt,
                })),
                pagination: {
                    total: totalCount,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + Number(limit) < totalCount,
                },
                summary,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTeamPointAwards = getTeamPointAwards;
const awardIndividualPoints = async (req, res, next) => {
    var _a;
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const userId = (0, param_parser_1.getParamString)(req.params.userId);
        const { points, reason, category } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            throw new http_exception_1.default(401, 'Authentication required');
        }
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: { id: true, title: true },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                sessionsParticipated: {
                    where: { id: sessionId },
                    select: { id: true },
                },
                teamMemberships: {
                    where: {
                        team: { sessionId },
                    },
                    select: {
                        teamId: true,
                        team: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new http_exception_1.default(404, 'User not found');
        }
        if (user.sessionsParticipated.length === 0) {
            throw new http_exception_1.default(400, 'User is not a participant in this session');
        }
        const teamInfo = user.teamMemberships.length > 0 ? user.teamMemberships[0] : null;
        const pointAward = await prisma_1.default.individualPointAward.create({
            data: {
                userId,
                sessionId,
                teamId: (teamInfo === null || teamInfo === void 0 ? void 0 : teamInfo.teamId) || null,
                awardedById: adminId,
                points,
                reason,
                category: category || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                awardedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const userTotalPoints = await prisma_1.default.individualPointAward.aggregate({
            where: {
                userId,
                sessionId,
            },
            _sum: {
                points: true,
            },
            _count: true,
        });
        logger_config_1.default.info(`${points} points awarded to user "${user.name}" by admin "${pointAward.awardedBy.name}" in session "${session.title}"`);
        res.status(201).json({
            success: true,
            message: 'Points awarded to user successfully',
            data: {
                award: {
                    id: pointAward.id,
                    points: pointAward.points,
                    reason: pointAward.reason,
                    category: pointAward.category,
                    user: pointAward.user,
                    team: pointAward.team,
                    awardedBy: {
                        id: pointAward.awardedBy.id,
                        name: pointAward.awardedBy.name,
                    },
                    createdAt: pointAward.createdAt,
                },
                userSummary: {
                    id: user.id,
                    name: user.name,
                    totalIndividualPoints: userTotalPoints._sum.points || 0,
                    totalAwards: userTotalPoints._count,
                    team: teamInfo === null || teamInfo === void 0 ? void 0 : teamInfo.team,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.awardIndividualPoints = awardIndividualPoints;
const getIndividualPointAwards = async (req, res, next) => {
    var _a;
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const userId = (0, param_parser_1.getParamString)(req.params.userId);
        const { limit, offset } = req.query;
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: { id: true, title: true },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                sessionsParticipated: {
                    where: { id: sessionId },
                    select: { id: true },
                },
                teamMemberships: {
                    where: {
                        team: { sessionId },
                    },
                    select: {
                        team: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new http_exception_1.default(404, 'User not found');
        }
        if (user.sessionsParticipated.length === 0) {
            throw new http_exception_1.default(400, 'User is not a participant in this session');
        }
        const totalCount = await prisma_1.default.individualPointAward.count({
            where: {
                userId,
                sessionId,
            },
        });
        const pointAwards = await prisma_1.default.individualPointAward.findMany({
            where: {
                userId,
                sessionId,
            },
            include: {
                awardedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: Number(limit),
            skip: Number(offset),
        });
        const summary = await prisma_1.default.individualPointAward.aggregate({
            where: {
                userId,
                sessionId,
            },
            _sum: {
                points: true,
            },
            _count: {
                id: true,
            },
        });
        const positiveAwards = await prisma_1.default.individualPointAward.count({
            where: {
                userId,
                sessionId,
                points: {
                    gt: 0,
                },
            },
        });
        const negativeAwards = await prisma_1.default.individualPointAward.count({
            where: {
                userId,
                sessionId,
                points: {
                    lt: 0,
                },
            },
        });
        logger_config_1.default.info(`Individual point awards history retrieved for user "${user.name}" - ${pointAwards.length} awards`);
        res.json({
            success: true,
            message: 'Individual point awards retrieved successfully',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    team: ((_a = user.teamMemberships[0]) === null || _a === void 0 ? void 0 : _a.team) || null,
                },
                awards: pointAwards.map((award) => ({
                    id: award.id,
                    points: award.points,
                    reason: award.reason,
                    category: award.category,
                    awardedBy: {
                        id: award.awardedBy.id,
                        name: award.awardedBy.name,
                    },
                    team: award.team,
                    createdAt: award.createdAt,
                })),
                pagination: {
                    total: totalCount,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + Number(limit) < totalCount,
                },
                summary: {
                    totalPoints: summary._sum.points || 0,
                    totalAwards: summary._count,
                    positiveAwards,
                    negativeAwards,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getIndividualPointAwards = getIndividualPointAwards;
const getSessionIndividualPointAwards = async (req, res, next) => {
    try {
        const sessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
        const { limit, offset, teamId, category, sortBy, order } = req.query;
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: { id: true, title: true },
        });
        if (!session) {
            throw new http_exception_1.default(404, 'Session not found');
        }
        const whereConditions = {
            sessionId,
        };
        if (teamId) {
            whereConditions.teamId = teamId;
        }
        if (category) {
            whereConditions.category = category;
        }
        const totalCount = await prisma_1.default.individualPointAward.count({
            where: whereConditions,
        });
        let orderBy = {};
        if (sortBy === 'userName') {
            orderBy = {
                user: {
                    name: order,
                },
            };
        }
        else {
            orderBy = {
                [sortBy]: order,
            };
        }
        const pointAwards = await prisma_1.default.individualPointAward.findMany({
            where: whereConditions,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                awardedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy,
            take: Number(limit),
            skip: Number(offset),
        });
        const summary = await prisma_1.default.individualPointAward.aggregate({
            where: whereConditions,
            _sum: {
                points: true,
            },
            _count: {
                id: true,
            },
        });
        const categoryBreakdown = await prisma_1.default.individualPointAward.groupBy({
            by: ['category'],
            where: whereConditions,
            _sum: {
                points: true,
            },
            _count: {
                id: true,
            },
        });
        logger_config_1.default.info(`Session individual point awards retrieved for session "${session.title}" - ${pointAwards.length} awards`);
        res.json({
            success: true,
            message: 'Session individual point awards retrieved successfully',
            data: {
                session: {
                    id: session.id,
                    title: session.title,
                },
                awards: pointAwards.map((award) => ({
                    id: award.id,
                    points: award.points,
                    reason: award.reason,
                    category: award.category,
                    user: award.user,
                    team: award.team,
                    awardedBy: {
                        id: award.awardedBy.id,
                        name: award.awardedBy.name,
                    },
                    createdAt: award.createdAt,
                })),
                pagination: {
                    total: totalCount,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + Number(limit) < totalCount,
                },
                summary: {
                    totalPoints: summary._sum.points || 0,
                    totalAwards: summary._count,
                },
                categoryBreakdown: categoryBreakdown.map((cat) => ({
                    category: cat.category || 'Uncategorized',
                    totalPoints: cat._sum.points || 0,
                    totalAwards: cat._count,
                })),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionIndividualPointAwards = getSessionIndividualPointAwards;
//# sourceMappingURL=team.controller.js.map