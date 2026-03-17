import { Request, Response } from 'express';
import { getParamString } from '../utils/param-parser';
import { OrganizationService } from '../services/organization.service';
import {
  CreateOrganizationRequest,
  CreateDepartmentRequest,
  CreateTeamRequest,
  AssignUserToDepartmentRequest,
  BulkUserAssignmentData,
} from '../types/survey.types';
import xlsx from 'xlsx';
import { Readable } from 'stream';
import csv from 'csv-parser';

const organizationService = new OrganizationService();

export class OrganizationController {
  // Organization endpoints
  async createOrganization(req: Request, res: Response) {
    try {
      const data: CreateOrganizationRequest = req.body;

      if (!data.sessionId || !data.name) {
        return res.status(400).json({
          success: false,
          message: 'Session ID and organization name are required',
        });
      }

      const organization = await organizationService.createOrganization(data);

      return res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: organization,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create organization',
        error: error.message,
      });
    }
  }

  async getOrganizationsBySession(req: Request, res: Response) {
    try {
      const normalizedSessionId = getParamString(req.params.sessionId);

      if (!normalizedSessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
      }

      const organizations =
        await organizationService.getOrganizationsBySession(normalizedSessionId);

      return res.status(200).json({
        success: true,
        message: 'Organizations retrieved successfully',
        data: organizations,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve organizations',
        error: error.message,
      });
    }
  }

  async getOrganizationById(req: Request, res: Response) {
    try {
      const normalizedId = getParamString(req.params.id);

      const organization = await organizationService.getOrganizationById(normalizedId);

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Organization retrieved successfully',
        data: organization,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve organization',
        error: error.message,
      });
    }
  }

  async updateOrganization(req: Request, res: Response) {
    try {
      const normalizedId = getParamString(req.params.id);
      const data: Partial<CreateOrganizationRequest> = req.body;

      const organization = await organizationService.updateOrganization(normalizedId, data);

      res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: organization,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update organization',
        error: error.message,
      });
    }
  }

  async deleteOrganization(req: Request, res: Response) {
    try {
      const normalizedId = getParamString(req.params.id);

      await organizationService.deleteOrganization(normalizedId);

      res.status(200).json({
        success: true,
        message: 'Organization deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete organization',
        error: error.message,
      });
    }
  }

  // Department endpoints
  async createDepartment(req: Request, res: Response) {
    try {
      const data: CreateDepartmentRequest = req.body;

      if (!data.organizationId || !data.name) {
        return res.status(400).json({
          success: false,
          message: 'Organization ID and department name are required',
        });
      }

      const department = await organizationService.createDepartment(data);

      return res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create department',
        error: error.message,
      });
    }
  }

  async getDepartmentsByOrganization(req: Request, res: Response) {
    try {
      const normalizedOrgId = getParamString(req.params.organizationId);

      const departments = await organizationService.getDepartmentsByOrganization(normalizedOrgId);

      res.status(200).json({
        success: true,
        message: 'Departments retrieved successfully',
        data: departments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve departments',
        error: error.message,
      });
    }
  }

  async getDepartmentById(req: Request, res: Response) {
    try {
      const normalizedId = getParamString(req.params.id);

      const department = await organizationService.getDepartmentById(normalizedId);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Department retrieved successfully',
        data: department,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve department',
        error: error.message,
      });
    }
  }

  async updateDepartment(req: Request, res: Response) {
    try {
      const normalizedId = getParamString(req.params.id);
      const data: Partial<CreateDepartmentRequest> = req.body;

      const department = await organizationService.updateDepartment(normalizedId, data);

      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: department,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update department',
        error: error.message,
      });
    }
  }

  async deleteDepartment(req: Request, res: Response) {
    try {
      const normalizedId = getParamString(req.params.id);

      await organizationService.deleteDepartment(normalizedId);

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete department',
        error: error.message,
      });
    }
  }

  // Team endpoints
  async createTeam(req: Request, res: Response) {
    try {
      const data: CreateTeamRequest = req.body;

      if (!data.departmentId || !data.name) {
        return res.status(400).json({
          success: false,
          message: 'Department ID and team name are required',
        });
      }

      const team = await organizationService.createTeam(data);

      return res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: team,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create team',
        error: error.message,
      });
    }
  }

  async getTeamsByDepartment(req: Request, res: Response) {
    try {
      const normalizedDeptId = getParamString(req.params.departmentId);

      const teams = await organizationService.getTeamsByDepartment(normalizedDeptId);

      res.status(200).json({
        success: true,
        message: 'Teams retrieved successfully',
        data: teams,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve teams',
        error: error.message,
      });
    }
  }

  async getTeamById(req: Request, res: Response) {
    try {
      const normalizedId = getParamString(req.params.id);

      const team = await organizationService.getTeamById(normalizedId);

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Team retrieved successfully',
        data: team,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve team',
        error: error.message,
      });
    }
  }

  async updateTeam(req: Request, res: Response) {
    try {
      const normalizedId = getParamString(req.params.id);
      const data: Partial<CreateTeamRequest> = req.body;

      const team = await organizationService.updateTeam(normalizedId, data);

      res.status(200).json({
        success: true,
        message: 'Team updated successfully',
        data: team,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update team',
        error: error.message,
      });
    }
  }

  async deleteTeam(req: Request, res: Response) {
    try {
      const normalizedId = getParamString(req.params.id);

      await organizationService.deleteTeam(normalizedId);

      res.status(200).json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete team',
        error: error.message,
      });
    }
  }

  // User Assignment endpoints
  async assignUserToDepartment(req: Request, res: Response) {
    try {
      const data: AssignUserToDepartmentRequest = req.body;
      const assignedById = (req as any).user?.id; // From auth middleware

      if (!data.userId || !data.departmentId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and department ID are required',
        });
      }

      if (!assignedById) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const assignment = await organizationService.assignUserToDepartment(data, assignedById);

      return res.status(201).json({
        success: true,
        message: 'User assigned to department successfully',
        data: assignment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to assign user to department',
        error: error.message,
      });
    }
  }

  async getUserAssignments(req: Request, res: Response) {
    try {
      const normalizedUserId = getParamString(req.params.userId);

      const assignments = await organizationService.getUserAssignments(normalizedUserId);

      res.status(200).json({
        success: true,
        message: 'User assignments retrieved successfully',
        data: assignments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user assignments',
        error: error.message,
      });
    }
  }

  async removeUserFromDepartment(req: Request, res: Response) {
    try {
      const normalizedUserId = getParamString(req.params.userId);
      const normalizedDeptId = getParamString(req.params.departmentId);

      await organizationService.removeUserFromDepartment(normalizedUserId, normalizedDeptId);

      res.status(200).json({
        success: true,
        message: 'User removed from department successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to remove user from department',
        error: error.message,
      });
    }
  }

  // Bulk User Assignment Upload
  async bulkAssignUsers(req: Request, res: Response) {
    try {
      const normalizedOrgId = getParamString(req.params.organizationId);
      const assignedById = (req as any).user?.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a CSV or Excel file',
        });
      }

      if (!assignedById) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Verify organization exists
      const organization = await organizationService.getOrganizationById(normalizedOrgId);
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
      }

      const results: BulkUserAssignmentData[] = [];
      const fileBuffer = req.file.buffer;
      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel files
        const workbook = xlsx.read(fileBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        results.push(...(data as BulkUserAssignmentData[]));
      } else if (fileExtension === 'csv') {
        // Handle CSV files
        const csvData: BulkUserAssignmentData[] = [];
        await new Promise((resolve, reject) => {
          Readable.from(fileBuffer)
            .pipe(csv())
            .on('data', row => csvData.push(row))
            .on('end', () => resolve(csvData))
            .on('error', error => reject(error));
        });
        results.push(...csvData);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file format. Please upload CSV or Excel file.',
        });
      }

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid data found in the uploaded file',
        });
      }

      // Validate required fields
      const validData = results.filter(
        row => row.userEmail && row.departmentName && (row.role === 'ADMIN' || row.role === 'USER'),
      );

      if (validData.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            'No valid rows found. Please check that userEmail, departmentName, and role fields are present and valid.',
        });
      }

      // Process bulk assignments
      const assignmentResults = await organizationService.bulkAssignUsers(
        validData,
        normalizedOrgId,
        assignedById,
      );

      return res.status(200).json({
        success: true,
        message: 'Bulk user assignment completed',
        data: {
          totalProcessed: validData.length,
          successful: assignmentResults.successful.length,
          failed: assignmentResults.failed.length,
          successfulAssignments: assignmentResults.successful,
          failedAssignments: assignmentResults.failed,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process bulk user assignments',
        error: error.message,
      });
    }
  }

  // Download CSV template for bulk user assignment
  async downloadBulkAssignmentTemplate(_req: Request, res: Response) {
    try {
      const csvTemplate = `userEmail,departmentName,teamName,role
john.doe@example.com,Engineering,Frontend Team,USER
jane.smith@example.com,Marketing,,ADMIN
bob.johnson@example.com,Engineering,Backend Team,USER
alice.wilson@example.com,HR,Recruitment Team,USER`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=bulk_user_assignment_template.csv',
      );
      return res.status(200).send(csvTemplate);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate template',
        error: error.message,
      });
    }
  }
}
