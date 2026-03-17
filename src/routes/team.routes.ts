import { Router } from 'express';
import * as teamController from '../controllers/team.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createTeamSchema,
  updateTeamSchema,
  getTeamsSchema,
  getTeamByIdSchema,
  addTeamMemberSchema,
  removeTeamMemberSchema,
  updateTeamMemberRoleSchema,
  bulkAssignMembersSchema,
  deleteTeamSchema,
  autoAssignTeamsSchema,
  getTeamLeaderboardSchema,
  awardTeamPointsSchema,
  getTeamPointAwardsSchema,
  awardIndividualPointsSchema,
  getIndividualPointAwardsSchema,
  getSessionIndividualPointAwardsSchema,
} from '../validations/team.validation';
import { RequestHandler } from 'express';

const router = Router();

// Create new team in a session (admin only)
router.post(
  '/:sessionId/teams',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(createTeamSchema),
  teamController.createTeam,
);

// Update team details (admin only)
router.put(
  '/:sessionId/teams/:teamId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateTeamSchema),
  teamController.updateTeam,
);

// Get all teams in a session (accessible to all authenticated users)
router.get(
  '/:sessionId/teams',
  authenticateToken as RequestHandler,
  validateRequest(getTeamsSchema),
  teamController.getTeams,
);

// Get team leaderboard for a session (accessible to all authenticated users)
router.get(
  '/:sessionId/teams/leaderboard',
  authenticateToken as RequestHandler,
  validateRequest(getTeamLeaderboardSchema),
  teamController.getTeamLeaderboard,
);

// Get team by ID (accessible to all authenticated users)
router.get(
  '/:sessionId/teams/:teamId',
  authenticateToken as RequestHandler,
  validateRequest(getTeamByIdSchema),
  teamController.getTeamById,
);

// Add member to team (admin only)
router.post(
  '/:sessionId/teams/:teamId/members',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(addTeamMemberSchema),
  teamController.addTeamMember,
);

// Remove member from team (admin only)
router.delete(
  '/:sessionId/teams/:teamId/members/:userId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(removeTeamMemberSchema),
  teamController.removeTeamMember,
);

// Update team member role (admin only)
router.patch(
  '/:sessionId/teams/:teamId/members/:userId/role',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(updateTeamMemberRoleSchema),
  teamController.updateTeamMemberRole,
);

// Bulk assign members to teams (admin only)
router.post(
  '/:sessionId/teams/bulk-assign',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(bulkAssignMembersSchema),
  teamController.bulkAssignMembers,
);

// Auto-assign participants to teams (admin only)
router.post(
  '/:sessionId/teams/auto-assign',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(autoAssignTeamsSchema),
  teamController.autoAssignTeams,
);

// Delete team (admin only)
router.delete(
  '/:sessionId/teams/:teamId',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(deleteTeamSchema),
  teamController.deleteTeam,
);

// Award points to a team (admin only)
router.post(
  '/:sessionId/teams/:teamId/award-points',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(awardTeamPointsSchema),
  teamController.awardTeamPoints,
);

// Get point awards history for a team (accessible to all authenticated users)
router.get(
  '/:sessionId/teams/:teamId/point-awards',
  authenticateToken as RequestHandler,
  validateRequest(getTeamPointAwardsSchema),
  teamController.getTeamPointAwards,
);

// Award points to an individual user/candidate (admin only)
router.post(
  '/:sessionId/users/:userId/award-points',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(awardIndividualPointsSchema),
  teamController.awardIndividualPoints,
);

// Get individual point awards history for a user (accessible to all authenticated users)
router.get(
  '/:sessionId/users/:userId/point-awards',
  authenticateToken as RequestHandler,
  validateRequest(getIndividualPointAwardsSchema),
  teamController.getIndividualPointAwards,
);

// Get all individual point awards in a session (admin only)
router.get(
  '/:sessionId/individual-point-awards',
  authenticateToken as RequestHandler,
  isAdmin as RequestHandler,
  validateRequest(getSessionIndividualPointAwardsSchema),
  teamController.getSessionIndividualPointAwards,
);

export default router;
