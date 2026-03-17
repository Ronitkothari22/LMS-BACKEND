"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationController = void 0;
const param_parser_1 = require("../utils/param-parser");
const organization_service_1 = require("../services/organization.service");
const xlsx_1 = __importDefault(require("xlsx"));
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
const organizationService = new organization_service_1.OrganizationService();
class OrganizationController {
    async createOrganization(req, res) {
        try {
            const data = req.body;
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create organization',
                error: error.message,
            });
        }
    }
    async getOrganizationsBySession(req, res) {
        try {
            const normalizedSessionId = (0, param_parser_1.getParamString)(req.params.sessionId);
            if (!normalizedSessionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Session ID is required',
                });
            }
            const organizations = await organizationService.getOrganizationsBySession(normalizedSessionId);
            return res.status(200).json({
                success: true,
                message: 'Organizations retrieved successfully',
                data: organizations,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve organizations',
                error: error.message,
            });
        }
    }
    async getOrganizationById(req, res) {
        try {
            const normalizedId = (0, param_parser_1.getParamString)(req.params.id);
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve organization',
                error: error.message,
            });
        }
    }
    async updateOrganization(req, res) {
        try {
            const normalizedId = (0, param_parser_1.getParamString)(req.params.id);
            const data = req.body;
            const organization = await organizationService.updateOrganization(normalizedId, data);
            res.status(200).json({
                success: true,
                message: 'Organization updated successfully',
                data: organization,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update organization',
                error: error.message,
            });
        }
    }
    async deleteOrganization(req, res) {
        try {
            const normalizedId = (0, param_parser_1.getParamString)(req.params.id);
            await organizationService.deleteOrganization(normalizedId);
            res.status(200).json({
                success: true,
                message: 'Organization deleted successfully',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete organization',
                error: error.message,
            });
        }
    }
    async createDepartment(req, res) {
        try {
            const data = req.body;
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create department',
                error: error.message,
            });
        }
    }
    async getDepartmentsByOrganization(req, res) {
        try {
            const normalizedOrgId = (0, param_parser_1.getParamString)(req.params.organizationId);
            const departments = await organizationService.getDepartmentsByOrganization(normalizedOrgId);
            res.status(200).json({
                success: true,
                message: 'Departments retrieved successfully',
                data: departments,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve departments',
                error: error.message,
            });
        }
    }
    async getDepartmentById(req, res) {
        try {
            const normalizedId = (0, param_parser_1.getParamString)(req.params.id);
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve department',
                error: error.message,
            });
        }
    }
    async updateDepartment(req, res) {
        try {
            const normalizedId = (0, param_parser_1.getParamString)(req.params.id);
            const data = req.body;
            const department = await organizationService.updateDepartment(normalizedId, data);
            res.status(200).json({
                success: true,
                message: 'Department updated successfully',
                data: department,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update department',
                error: error.message,
            });
        }
    }
    async deleteDepartment(req, res) {
        try {
            const normalizedId = (0, param_parser_1.getParamString)(req.params.id);
            await organizationService.deleteDepartment(normalizedId);
            res.status(200).json({
                success: true,
                message: 'Department deleted successfully',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete department',
                error: error.message,
            });
        }
    }
    async createTeam(req, res) {
        try {
            const data = req.body;
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create team',
                error: error.message,
            });
        }
    }
    async getTeamsByDepartment(req, res) {
        try {
            const normalizedDeptId = (0, param_parser_1.getParamString)(req.params.departmentId);
            const teams = await organizationService.getTeamsByDepartment(normalizedDeptId);
            res.status(200).json({
                success: true,
                message: 'Teams retrieved successfully',
                data: teams,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve teams',
                error: error.message,
            });
        }
    }
    async getTeamById(req, res) {
        try {
            const normalizedId = (0, param_parser_1.getParamString)(req.params.id);
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve team',
                error: error.message,
            });
        }
    }
    async updateTeam(req, res) {
        try {
            const normalizedId = (0, param_parser_1.getParamString)(req.params.id);
            const data = req.body;
            const team = await organizationService.updateTeam(normalizedId, data);
            res.status(200).json({
                success: true,
                message: 'Team updated successfully',
                data: team,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update team',
                error: error.message,
            });
        }
    }
    async deleteTeam(req, res) {
        try {
            const normalizedId = (0, param_parser_1.getParamString)(req.params.id);
            await organizationService.deleteTeam(normalizedId);
            res.status(200).json({
                success: true,
                message: 'Team deleted successfully',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete team',
                error: error.message,
            });
        }
    }
    async assignUserToDepartment(req, res) {
        var _a;
        try {
            const data = req.body;
            const assignedById = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to assign user to department',
                error: error.message,
            });
        }
    }
    async getUserAssignments(req, res) {
        try {
            const normalizedUserId = (0, param_parser_1.getParamString)(req.params.userId);
            const assignments = await organizationService.getUserAssignments(normalizedUserId);
            res.status(200).json({
                success: true,
                message: 'User assignments retrieved successfully',
                data: assignments,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve user assignments',
                error: error.message,
            });
        }
    }
    async removeUserFromDepartment(req, res) {
        try {
            const normalizedUserId = (0, param_parser_1.getParamString)(req.params.userId);
            const normalizedDeptId = (0, param_parser_1.getParamString)(req.params.departmentId);
            await organizationService.removeUserFromDepartment(normalizedUserId, normalizedDeptId);
            res.status(200).json({
                success: true,
                message: 'User removed from department successfully',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to remove user from department',
                error: error.message,
            });
        }
    }
    async bulkAssignUsers(req, res) {
        var _a, _b;
        try {
            const normalizedOrgId = (0, param_parser_1.getParamString)(req.params.organizationId);
            const assignedById = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
            const organization = await organizationService.getOrganizationById(normalizedOrgId);
            if (!organization) {
                return res.status(404).json({
                    success: false,
                    message: 'Organization not found',
                });
            }
            const results = [];
            const fileBuffer = req.file.buffer;
            const fileExtension = (_b = req.file.originalname.split('.').pop()) === null || _b === void 0 ? void 0 : _b.toLowerCase();
            if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                const workbook = xlsx_1.default.read(fileBuffer);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = xlsx_1.default.utils.sheet_to_json(worksheet);
                results.push(...data);
            }
            else if (fileExtension === 'csv') {
                const csvData = [];
                await new Promise((resolve, reject) => {
                    stream_1.Readable.from(fileBuffer)
                        .pipe((0, csv_parser_1.default)())
                        .on('data', row => csvData.push(row))
                        .on('end', () => resolve(csvData))
                        .on('error', error => reject(error));
                });
                results.push(...csvData);
            }
            else {
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
            const validData = results.filter(row => row.userEmail && row.departmentName && (row.role === 'ADMIN' || row.role === 'USER'));
            if (validData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid rows found. Please check that userEmail, departmentName, and role fields are present and valid.',
                });
            }
            const assignmentResults = await organizationService.bulkAssignUsers(validData, normalizedOrgId, assignedById);
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to process bulk user assignments',
                error: error.message,
            });
        }
    }
    async downloadBulkAssignmentTemplate(_req, res) {
        try {
            const csvTemplate = `userEmail,departmentName,teamName,role
john.doe@example.com,Engineering,Frontend Team,USER
jane.smith@example.com,Marketing,,ADMIN
bob.johnson@example.com,Engineering,Backend Team,USER
alice.wilson@example.com,HR,Recruitment Team,USER`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=bulk_user_assignment_template.csv');
            return res.status(200).send(csvTemplate);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate template',
                error: error.message,
            });
        }
    }
}
exports.OrganizationController = OrganizationController;
//# sourceMappingURL=organization.controller.js.map