import { Router, RequestHandler } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
const organizationController = new OrganizationController();

// Organization routes (session-based)
router.post(
  '/organizations',
  authenticateToken,
  organizationController.createOrganization.bind(organizationController) as RequestHandler,
);
router.get(
  '/sessions/:sessionId/organizations',
  authenticateToken,
  organizationController.getOrganizationsBySession.bind(organizationController) as RequestHandler,
);
router.get(
  '/organizations/:id',
  authenticateToken,
  organizationController.getOrganizationById.bind(organizationController) as RequestHandler,
);
router.put(
  '/organizations/:id',
  authenticateToken,
  organizationController.updateOrganization.bind(organizationController) as RequestHandler,
);
router.delete(
  '/organizations/:id',
  authenticateToken,
  organizationController.deleteOrganization.bind(organizationController) as RequestHandler,
);

// Department routes
router.post(
  '/departments',
  authenticateToken,
  organizationController.createDepartment.bind(organizationController) as RequestHandler,
);
router.get(
  '/organizations/:organizationId/departments',
  authenticateToken,
  organizationController.getDepartmentsByOrganization.bind(
    organizationController,
  ) as RequestHandler,
);
router.get(
  '/departments/:id',
  authenticateToken,
  organizationController.getDepartmentById.bind(organizationController) as RequestHandler,
);
router.put(
  '/departments/:id',
  authenticateToken,
  organizationController.updateDepartment.bind(organizationController) as RequestHandler,
);
router.delete(
  '/departments/:id',
  authenticateToken,
  organizationController.deleteDepartment.bind(organizationController) as RequestHandler,
);

// Team routes
router.post(
  '/teams',
  authenticateToken,
  organizationController.createTeam.bind(organizationController) as RequestHandler,
);
router.get(
  '/departments/:departmentId/teams',
  authenticateToken,
  organizationController.getTeamsByDepartment.bind(organizationController) as RequestHandler,
);
router.get(
  '/teams/:id',
  authenticateToken,
  organizationController.getTeamById.bind(organizationController) as RequestHandler,
);
router.put(
  '/teams/:id',
  authenticateToken,
  organizationController.updateTeam.bind(organizationController) as RequestHandler,
);
router.delete(
  '/teams/:id',
  authenticateToken,
  organizationController.deleteTeam.bind(organizationController) as RequestHandler,
);

// User assignment routes
router.post(
  '/user-assignments',
  authenticateToken,
  organizationController.assignUserToDepartment.bind(organizationController) as RequestHandler,
);

// Bulk user assignment upload route
router.post(
  '/:organizationId/bulk-assign-users',
  authenticateToken,
  upload.single('file'),
  organizationController.bulkAssignUsers.bind(organizationController) as RequestHandler,
);

// Download CSV template for bulk user assignment
router.get(
  '/bulk-assignment-template',
  organizationController.downloadBulkAssignmentTemplate.bind(
    organizationController,
  ) as RequestHandler,
);

router.get(
  '/users/:userId/assignments',
  authenticateToken,
  organizationController.getUserAssignments.bind(organizationController) as RequestHandler,
);
router.delete(
  '/users/:userId/departments/:departmentId',
  authenticateToken,
  organizationController.removeUserFromDepartment.bind(organizationController) as RequestHandler,
);

export default router;
