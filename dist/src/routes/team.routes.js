"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teamController = __importStar(require("../controllers/team.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const team_validation_1 = require("../validations/team.validation");
const router = (0, express_1.Router)();
router.post('/:sessionId/teams', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.createTeamSchema), teamController.createTeam);
router.put('/:sessionId/teams/:teamId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.updateTeamSchema), teamController.updateTeam);
router.get('/:sessionId/teams', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(team_validation_1.getTeamsSchema), teamController.getTeams);
router.get('/:sessionId/teams/leaderboard', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(team_validation_1.getTeamLeaderboardSchema), teamController.getTeamLeaderboard);
router.get('/:sessionId/teams/:teamId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(team_validation_1.getTeamByIdSchema), teamController.getTeamById);
router.post('/:sessionId/teams/:teamId/members', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.addTeamMemberSchema), teamController.addTeamMember);
router.delete('/:sessionId/teams/:teamId/members/:userId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.removeTeamMemberSchema), teamController.removeTeamMember);
router.patch('/:sessionId/teams/:teamId/members/:userId/role', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.updateTeamMemberRoleSchema), teamController.updateTeamMemberRole);
router.post('/:sessionId/teams/bulk-assign', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.bulkAssignMembersSchema), teamController.bulkAssignMembers);
router.post('/:sessionId/teams/auto-assign', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.autoAssignTeamsSchema), teamController.autoAssignTeams);
router.delete('/:sessionId/teams/:teamId', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.deleteTeamSchema), teamController.deleteTeam);
router.post('/:sessionId/teams/:teamId/award-points', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.awardTeamPointsSchema), teamController.awardTeamPoints);
router.get('/:sessionId/teams/:teamId/point-awards', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(team_validation_1.getTeamPointAwardsSchema), teamController.getTeamPointAwards);
router.post('/:sessionId/users/:userId/award-points', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.awardIndividualPointsSchema), teamController.awardIndividualPoints);
router.get('/:sessionId/users/:userId/point-awards', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(team_validation_1.getIndividualPointAwardsSchema), teamController.getIndividualPointAwards);
router.get('/:sessionId/individual-point-awards', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(team_validation_1.getSessionIndividualPointAwardsSchema), teamController.getSessionIndividualPointAwards);
exports.default = router;
//# sourceMappingURL=team.routes.js.map