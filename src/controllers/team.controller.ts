import { Request, Response, NextFunction, RequestHandler } from 'express';
import HttpException from '../utils/http-exception';
import logger from '../config/logger.config';
import prisma from '../lib/prisma';
import { TeamRole } from '@prisma/client';
import { getParamString } from '../utils/param-parser';

// Create a new team in a session
export const createTeam: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const { name, description, color, maxMembers } = req.body;

    // Check if session exists and user is admin
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Check if team name already exists in this session
    const existingTeam = await prisma.team.findFirst({
      where: {
        sessionId,
        name,
      },
    });

    if (existingTeam) {
      throw new HttpException(400, 'Team name already exists in this session');
    }

    // Create the team
    const team = await prisma.team.create({
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

    logger.info(`Team "${name}" created in session "${session.title}"`);

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
  } catch (error) {
    next(error);
  }
};

// Update team details
export const updateTeam: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const teamId = getParamString(req.params.teamId);
    const updateData = req.body;

    // Check if team exists in the session
    const existingTeam = await prisma.team.findFirst({
      where: {
        id: teamId,
        sessionId,
      },
    });

    if (!existingTeam) {
      throw new HttpException(404, 'Team not found in this session');
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name !== existingTeam.name) {
      const duplicateTeam = await prisma.team.findFirst({
        where: {
          sessionId,
          name: updateData.name,
          id: { not: teamId },
        },
      });

      if (duplicateTeam) {
        throw new HttpException(400, 'Team name already exists in this session');
      }
    }

    // Update the team
    const updatedTeam = await prisma.team.update({
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

    logger.info(`Team "${updatedTeam.name}" updated in session "${updatedTeam.session.title}"`);

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
  } catch (error) {
    next(error);
  }
};

// Get all teams in a session
export const getTeams: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const { includeInactive } = req.query;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: Record<string, any> = { sessionId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Get teams with members
    const teams = await prisma.team.findMany({
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
  } catch (error) {
    next(error);
  }
};

// Get team by ID
export const getTeamById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const teamId = getParamString(req.params.teamId);

    // Get team with members
    const team = await prisma.team.findFirst({
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
      throw new HttpException(404, 'Team not found in this session');
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
  } catch (error) {
    next(error);
  }
};

// Add a member to a team
export const addTeamMember: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const teamId = getParamString(req.params.teamId);
    const { userId, role } = req.body;

    // Check if team exists in the session
    const team = await prisma.team.findFirst({
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
      throw new HttpException(404, 'Active team not found in this session');
    }

    // Check if user exists and is a participant in the session
    const user = await prisma.user.findFirst({
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
      throw new HttpException(404, 'User not found or not associated with this session');
    }

    // Check if user is already in this team
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (existingMembership) {
      throw new HttpException(400, 'User is already a member of this team');
    }

    // Check if team has reached maximum capacity
    if (team.maxMembers && team.members.length >= team.maxMembers) {
      throw new HttpException(400, 'Team has reached maximum capacity');
    }

    // Check if user is already in another team in this session
    const existingTeamMembership = await prisma.teamMember.findFirst({
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
      throw new HttpException(
        400,
        `User is already a member of team "${existingTeamMembership.team.name}" in this session`,
      );
    }

    // Add member to team
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role: role as TeamRole,
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

    logger.info(`User "${user.name}" added to team "${team.name}"`);

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
  } catch (error) {
    next(error);
  }
};

// Remove a member from a team
export const removeTeamMember: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const teamId = getParamString(req.params.teamId);
    const userId = getParamString(req.params.userId);

    // Check if team exists in the session
    const team = await prisma.team.findFirst({
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
      throw new HttpException(404, 'Team not found in this session');
    }

    // Check if team member exists
    const teamMember = await prisma.teamMember.findFirst({
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
      throw new HttpException(404, 'Team member not found');
    }

    // Remove team member
    await prisma.teamMember.delete({
      where: {
        id: teamMember.id,
      },
    });

    logger.info(`User "${teamMember.user.name}" removed from team "${team.name}"`);

    res.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update team member role
export const updateTeamMemberRole: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const teamId = getParamString(req.params.teamId);
    const userId = getParamString(req.params.userId);
    const { role } = req.body;

    // Check if team exists in the session
    const team = await prisma.team.findFirst({
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
      throw new HttpException(404, 'Team not found in this session');
    }

    // Check if team member exists
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new HttpException(404, 'Team member not found');
    }

    // Update team member role
    const updatedTeamMember = await prisma.teamMember.update({
      where: {
        id: teamMember.id,
      },
      data: {
        role: role as TeamRole,
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

    logger.info(
      `Updated role of "${updatedTeamMember.user.name}" in team "${team.name}" to ${role}`,
    );

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
  } catch (error) {
    next(error);
  }
};

// Bulk assign members to teams
export const bulkAssignMembers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const { assignments } = req.body;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors: any[] = [];

    // Process each assignment
    for (const assignment of assignments) {
      try {
        const { userId, teamId, role } = assignment;

        // Validate team exists in session
        const team = await prisma.team.findFirst({
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

        // Validate user exists and is associated with session
        const user = await prisma.user.findFirst({
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

        // Check if user is already in any team in this session
        const existingMembership = await prisma.teamMember.findFirst({
          where: {
            userId,
            team: {
              sessionId,
              isActive: true,
            },
          },
        });

        if (existingMembership) {
          // Remove from existing team first
          await prisma.teamMember.delete({
            where: {
              id: existingMembership.id,
            },
          });
        }

        // Check team capacity
        if (team.maxMembers && team.members.length >= team.maxMembers) {
          errors.push({
            userId,
            teamId,
            error: 'Team has reached maximum capacity',
          });
          continue;
        }

        // Add to new team
        const teamMember = await prisma.teamMember.create({
          data: {
            teamId,
            userId,
            role: role as TeamRole,
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
      } catch (error) {
        errors.push({
          userId: assignment.userId,
          teamId: assignment.teamId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info(`Bulk assignment completed: ${results.length} successful, ${errors.length} errors`);

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
  } catch (error) {
    next(error);
  }
};

// Delete a team
export const deleteTeam: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const teamId = getParamString(req.params.teamId);

    // Check if team exists in the session
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        sessionId,
      },
      include: {
        members: true,
      },
    });

    if (!team) {
      throw new HttpException(404, 'Team not found in this session');
    }

    // Delete the team (members will be cascaded)
    await prisma.team.delete({
      where: {
        id: teamId,
      },
    });

    logger.info(`Team "${team.name}" deleted with ${team.members.length} members`);

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
  } catch (error) {
    next(error);
  }
};

// Auto-assign participants to teams
export const autoAssignTeams: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const { strategy, teamsCount, maxMembersPerTeam } = req.body;

    // Check if session exists
    const session = await prisma.session.findUnique({
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
      throw new HttpException(404, 'Session not found');
    }

    if (session.participants.length === 0) {
      throw new HttpException(400, 'No participants in session to assign to teams');
    }

    // Get existing teams in session
    const existingTeams = await prisma.team.findMany({
      where: {
        sessionId,
        isActive: true,
      },
    });

    const participants = [...session.participants];
    let teams = [...existingTeams];

    // Determine number of teams needed
    let targetTeamCount = teamsCount;
    if (!targetTeamCount) {
      const maxMembers = maxMembersPerTeam || 5;
      targetTeamCount = Math.ceil(participants.length / maxMembers);
    }

    // Create additional teams if needed
    while (teams.length < targetTeamCount) {
      const teamNumber = teams.length + 1;
      const newTeam = await prisma.team.create({
        data: {
          name: `Team ${teamNumber}`,
          sessionId,
          maxMembers: maxMembersPerTeam,
        },
      });
      teams.push(newTeam);
    }

    // Clear existing team memberships for this session
    await prisma.teamMember.deleteMany({
      where: {
        team: {
          sessionId,
        },
      },
    });

    // Shuffle participants for random assignment
    if (strategy === 'RANDOM') {
      for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
      }
    }

    // Assign participants to teams
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignments: any[] = [];
    for (let i = 0; i < participants.length; i++) {
      const teamIndex = strategy === 'BALANCED' ? i % teams.length : i % teams.length;
      const participant = participants[i];
      const team = teams[teamIndex];

      await prisma.teamMember.create({
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

    logger.info(`Auto-assigned ${participants.length} participants to ${teams.length} teams`);

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
  } catch (error) {
    next(error);
  }
};

// Get team leaderboard for a session
export const getTeamLeaderboard: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const { sortBy, order, includeInactive } = req.query;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        title: true,
        state: true,
      },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Build where clause for teams
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: Record<string, any> = { sessionId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Get teams with comprehensive data for leaderboard
    const teams = await prisma.team.findMany({
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

    // Get quiz data for the session
    const sessionQuizzes = await prisma.quiz.findMany({
      where: { sessionId },
      include: {
        responses: {
          include: {
            user: true,
          },
        },
      },
    });

    // Get manual point awards for all teams in the session
    const manualPointsQuery = (await prisma.$queryRaw`
      SELECT 
        t.id as "teamId",
        COALESCE(SUM(tpa.points), 0) as "totalPoints",
        COUNT(tpa.id) as "totalAwards"
      FROM "Team" t
      LEFT JOIN "TeamPointAward" tpa ON t.id = tpa."teamId"
      WHERE t."sessionId" = ${sessionId}
      GROUP BY t.id
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    const manualPointsMap = new Map(
      manualPointsQuery.map((item: any) => [
        item.teamId,
        {
          totalPoints: Number(item.totalPoints),
          totalAwards: Number(item.totalAwards),
        },
      ]),
    );

    // Get individual point awards for all teams in the session
    const individualPointsQuery = (await prisma.$queryRaw`
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
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Create a map for individual points by team
    const individualPointsMap = new Map();
    individualPointsQuery.forEach((item: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
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

    // Calculate leaderboard metrics for each team focused on quiz points
    const leaderboardData = teams.map(team => {
      // Calculate individual member quiz contributions
      const memberContributions = team.members.map(member => {
        const memberQuizResponses = sessionQuizzes.flatMap(quiz =>
          quiz.responses.filter(response => response.user.id === member.user.id),
        );

        const memberQuizScore = memberQuizResponses.reduce(
          (sum, response) => sum + (response.totalScore || response.score || 0),
          0,
        );

        const memberQuizCount = memberQuizResponses.length;
        const memberAverageScore =
          memberQuizCount > 0 ? Math.round((memberQuizScore / memberQuizCount) * 100) / 100 : 0;

        const memberParticipationRate =
          sessionQuizzes.length > 0
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

      // Calculate team totals from member contributions
      const teamTotalQuizScore = memberContributions.reduce(
        (sum, member) => sum + member.quizContribution.totalQuizScore,
        0,
      );

      // Get manual points from the map
      const teamManualPoints = manualPointsMap.get(team.id) || { totalPoints: 0, totalAwards: 0 };
      const manualPointsAwarded = teamManualPoints.totalPoints;

      // Get individual points for team members
      const teamIndividualPoints = individualPointsMap.get(team.id) || [];
      const totalIndividualPoints = teamIndividualPoints.reduce(
        (sum: number, member: any) => sum + member.totalIndividualPoints,
        0,
      );
      const totalIndividualAwards = teamIndividualPoints.reduce(
        (sum: number, member: any) => sum + member.totalIndividualAwards,
        0,
      );

      // Add individual points to member contributions
      const enhancedMemberContributions = memberContributions.map(member => {
        const memberIndividualData = teamIndividualPoints.find(
          (indiv: any) => indiv.userId === member.user.id,
        );
        return {
          ...member,
          individualPoints: {
            totalPoints: memberIndividualData?.totalIndividualPoints || 0,
            totalAwards: memberIndividualData?.totalIndividualAwards || 0,
          },
        };
      });

      const teamTotalQuizzesCompleted = memberContributions.reduce(
        (sum, member) => sum + member.quizContribution.quizzesCompleted,
        0,
      );

      const teamAverageQuizScore =
        teamTotalQuizzesCompleted > 0
          ? Math.round((teamTotalQuizScore / teamTotalQuizzesCompleted) * 100) / 100
          : 0;

      const teamQuizParticipationRate =
        sessionQuizzes.length > 0 && team.members.length > 0
          ? Math.round(
              (teamTotalQuizzesCompleted / (sessionQuizzes.length * team.members.length)) * 100,
            )
          : 0;

      // Sort members by their total contribution (quiz + individual points)
      const sortedMembers = enhancedMemberContributions.sort(
        (a, b) =>
          b.quizContribution.totalQuizScore +
          b.individualPoints.totalPoints -
          (a.quizContribution.totalQuizScore + a.individualPoints.totalPoints),
      );

      // Calculate total team score including manual awards and individual points
      const totalTeamScore =
        Math.round((teamTotalQuizScore + manualPointsAwarded + totalIndividualPoints) * 100) / 100;

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
          topContribution:
            sortedMembers.length > 0 ? sortedMembers[0].quizContribution.totalQuizScore : 0,
        },
        pointAwards: {
          manualPointsAwarded: manualPointsAwarded,
          totalAwardsCount: teamManualPoints.totalAwards,
          recentAwards: [], // Could be populated with recent awards if needed
        },
        individualPointAwards: {
          totalIndividualPoints: totalIndividualPoints,
          totalIndividualAwards: totalIndividualAwards,
          topIndividualContributor:
            teamIndividualPoints.length > 0
              ? teamIndividualPoints.reduce((max: any, member: any) =>
                  member.totalIndividualPoints > max.totalIndividualPoints ? member : max,
                )
              : null,
        },
        totalScore: totalTeamScore, // Total score including quiz, manual, and individual points
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      };
    });

    // Sort teams based on the specified criteria (focused on total score by default)
    const sortedTeams = leaderboardData.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortBy) {
        case 'totalXP':
          // Calculate total XP from all team members
          aValue = a.members.reduce((sum, member) => sum + member.user.xpPoints, 0);
          bValue = b.members.reduce((sum, member) => sum + member.user.xpPoints, 0);
          break;
        case 'averageXP':
          // Calculate average XP per team member
          aValue =
            a.members.length > 0
              ? Math.round(
                  a.members.reduce((sum, member) => sum + member.user.xpPoints, 0) /
                    a.members.length,
                )
              : 0;
          bValue =
            b.members.length > 0
              ? Math.round(
                  b.members.reduce((sum, member) => sum + member.user.xpPoints, 0) /
                    b.members.length,
                )
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
          // Default to total score (quiz + manual points)
          aValue = a.totalScore;
          bValue = b.totalScore;
      }

      return order === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Add rank to each team
    const rankedTeams = sortedTeams.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    // Calculate session summary focused on quiz metrics
    const sessionSummary = {
      totalTeams: teams.length,
      activeTeams: teams.filter(team => team.isActive).length,
      totalParticipants: teams.reduce((sum, team) => sum + team.members.length, 0),
      totalQuizzes: sessionQuizzes.length,
      highestTeamScore: rankedTeams.length > 0 ? rankedTeams[0].totalScore : 0,
      totalQuizPoints: rankedTeams.reduce((sum, team) => sum + team.quizMetrics.totalQuizScore, 0),
      totalManualPoints: rankedTeams.reduce(
        (sum, team) => sum + team.pointAwards.manualPointsAwarded,
        0,
      ),
      sortedBy: sortBy,
      sortOrder: order,
    };

    logger.info(
      `Team leaderboard retrieved for session "${session.title}" - ${teams.length} teams`,
    );

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
  } catch (error) {
    next(error);
  }
};

// Award points to a team (admin only)
export const awardTeamPoints: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const teamId = getParamString(req.params.teamId);
    const { points, reason, category } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new HttpException(401, 'Authentication required');
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Check if team exists in the session
    const team = await prisma.team.findFirst({
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
      throw new HttpException(404, 'Team not found in this session');
    }

    // Create the point award record using raw query for now
    const pointAward = (await prisma.$queryRaw`
      INSERT INTO "TeamPointAward" (id, "teamId", "awardedById", points, reason, category, "createdAt")
      VALUES (gen_random_uuid(), ${teamId}, ${adminId}, ${points}, ${reason}, ${category || null}, NOW())
      RETURNING id, "teamId", "awardedById", points, reason, category, "createdAt"
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get admin info
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true },
    });

    // Get updated team total points
    const totalPointsResult = (await prisma.$queryRaw`
      SELECT COALESCE(SUM(points), 0) as total_points, COUNT(*) as total_awards
      FROM "TeamPointAward"
      WHERE "teamId" = ${teamId}
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    const { total_points: totalManualPoints, total_awards: totalAwards } = totalPointsResult[0];

    logger.info(
      `${points} points awarded to team "${team.name}" by admin "${admin?.name}" in session "${session.title}"`,
    );

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
            id: admin?.id,
            name: admin?.name,
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
  } catch (error) {
    next(error);
  }
};

// Get point awards history for a team
export const getTeamPointAwards: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const teamId = getParamString(req.params.teamId);
    const { limit, offset } = req.query;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Check if team exists in the session
    const team = await prisma.team.findFirst({
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
      throw new HttpException(404, 'Team not found in this session');
    }

    // Get total count for pagination using raw query
    const countResult = (await prisma.$queryRaw`
      SELECT COUNT(*) as total_count
      FROM "TeamPointAward"
      WHERE "teamId" = ${teamId}
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    const totalCount = Number(countResult[0].total_count);

    // Get point awards with pagination using raw query
    const pointAwards = (await prisma.$queryRaw`
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
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Calculate summary statistics using raw query
    const summaryResult = (await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(points), 0) as total_points,
        COUNT(*) as total_awards,
        COUNT(CASE WHEN points > 0 THEN 1 END) as positive_awards,
        COUNT(CASE WHEN points < 0 THEN 1 END) as negative_awards
      FROM "TeamPointAward"
      WHERE "teamId" = ${teamId}
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    const summary = {
      totalPoints: Number(summaryResult[0].total_points),
      totalAwards: Number(summaryResult[0].total_awards),
      positiveAwards: Number(summaryResult[0].positive_awards),
      negativeAwards: Number(summaryResult[0].negative_awards),
    };

    logger.info(
      `Point awards history retrieved for team "${team.name}" - ${pointAwards.length} awards`,
    );

    res.json({
      success: true,
      message: 'Team point awards retrieved successfully',
      data: {
        team: {
          id: team.id,
          name: team.name,
          description: team.description,
        },
        awards: pointAwards.map((award: any) => ({
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
  } catch (error) {
    next(error);
  }
};

// Award points to an individual candidate/user (admin only)
export const awardIndividualPoints: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const userId = getParamString(req.params.userId);
    const { points, reason, category } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new HttpException(401, 'Authentication required');
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Check if user exists and is a participant in the session
    const user = await prisma.user.findUnique({
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
      throw new HttpException(404, 'User not found');
    }

    if (user.sessionsParticipated.length === 0) {
      throw new HttpException(400, 'User is not a participant in this session');
    }

    // Get team information if user is in a team
    const teamInfo = user.teamMemberships.length > 0 ? user.teamMemberships[0] : null;

    // Create the individual point award record
    const pointAward = await prisma.individualPointAward.create({
      data: {
        userId,
        sessionId,
        teamId: teamInfo?.teamId || null,
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

    // Get updated user's total individual points in this session
    const userTotalPoints = await prisma.individualPointAward.aggregate({
      where: {
        userId,
        sessionId,
      },
      _sum: {
        points: true,
      },
      _count: true,
    });

    logger.info(
      `${points} points awarded to user "${user.name}" by admin "${pointAward.awardedBy.name}" in session "${session.title}"`,
    );

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
          team: teamInfo?.team,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get individual point awards history for a specific user
export const getIndividualPointAwards: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const userId = getParamString(req.params.userId);
    const { limit, offset } = req.query;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Check if user exists and is a participant in the session
    const user = await prisma.user.findUnique({
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
      throw new HttpException(404, 'User not found');
    }

    if (user.sessionsParticipated.length === 0) {
      throw new HttpException(400, 'User is not a participant in this session');
    }

    // Get total count for pagination
    const totalCount = await prisma.individualPointAward.count({
      where: {
        userId,
        sessionId,
      },
    });

    // Get point awards with pagination
    const pointAwards = await prisma.individualPointAward.findMany({
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

    // Calculate summary statistics
    const summary = await prisma.individualPointAward.aggregate({
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

    const positiveAwards = await prisma.individualPointAward.count({
      where: {
        userId,
        sessionId,
        points: {
          gt: 0,
        },
      },
    });

    const negativeAwards = await prisma.individualPointAward.count({
      where: {
        userId,
        sessionId,
        points: {
          lt: 0,
        },
      },
    });

    logger.info(
      `Individual point awards history retrieved for user "${user.name}" - ${pointAwards.length} awards`,
    );

    res.json({
      success: true,
      message: 'Individual point awards retrieved successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          team: user.teamMemberships[0]?.team || null,
        },
        awards: pointAwards.map((award: any) => ({
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
  } catch (error) {
    next(error);
  }
};

// Get all individual point awards in a session (admin view)
export const getSessionIndividualPointAwards: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = getParamString(req.params.sessionId);
    const { limit, offset, teamId, category, sortBy, order } = req.query;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true },
    });

    if (!session) {
      throw new HttpException(404, 'Session not found');
    }

    // Build filter conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: Record<string, any> = {
      sessionId,
    };

    if (teamId) {
      whereConditions.teamId = teamId as string;
    }

    if (category) {
      whereConditions.category = category as string;
    }

    // Get total count for pagination
    const totalCount = await prisma.individualPointAward.count({
      where: whereConditions,
    });

    // Build order by clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: Record<string, any> = {};
    if (sortBy === 'userName') {
      orderBy = {
        user: {
          name: order as 'asc' | 'desc',
        },
      };
    } else {
      orderBy = {
        [sortBy as string]: order as 'asc' | 'desc',
      };
    }

    // Get point awards with pagination and filters
    const pointAwards = await prisma.individualPointAward.findMany({
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

    // Calculate summary statistics
    const summary = await prisma.individualPointAward.aggregate({
      where: whereConditions,
      _sum: {
        points: true,
      },
      _count: {
        id: true,
      },
    });

    // Get category breakdown
    const categoryBreakdown = await prisma.individualPointAward.groupBy({
      by: ['category'],
      where: whereConditions,
      _sum: {
        points: true,
      },
      _count: {
        id: true,
      },
    });

    logger.info(
      `Session individual point awards retrieved for session "${session.title}" - ${pointAwards.length} awards`,
    );

    res.json({
      success: true,
      message: 'Session individual point awards retrieved successfully',
      data: {
        session: {
          id: session.id,
          title: session.title,
        },
        awards: pointAwards.map((award: any) => ({
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
        categoryBreakdown: categoryBreakdown.map((cat: any) => ({
          category: cat.category || 'Uncategorized',
          totalPoints: cat._sum.points || 0,
          totalAwards: cat._count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
