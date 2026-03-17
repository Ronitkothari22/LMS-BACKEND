import { PrismaClient } from '@prisma/client';
import {
  CreateOrganizationRequest,
  CreateDepartmentRequest,
  CreateTeamRequest,
  AssignUserToDepartmentRequest,
  BulkUserAssignmentData,
} from '../types/survey.types';

const prisma = new PrismaClient();

export class OrganizationService {
  // Organization CRUD (Session-based)
  async createOrganization(data: CreateOrganizationRequest) {
    return await prisma.organization.create({
      data: {
        sessionId: data.sessionId,
        name: data.name,
        description: data.description,
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
        departments: {
          include: {
            teams: true,
            userAssignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getOrganizationsBySession(sessionId: string) {
    return await prisma.organization.findMany({
      where: { sessionId },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        departments: {
          include: {
            teams: true,
            userAssignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getOrganizationById(id: string) {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        departments: {
          include: {
            teams: true,
            userAssignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateOrganization(id: string, data: Partial<CreateOrganizationRequest>) {
    return await prisma.organization.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
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
        departments: {
          include: {
            teams: true,
            userAssignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async deleteOrganization(id: string) {
    return await prisma.organization.delete({
      where: { id },
    });
  }

  // Department CRUD
  async createDepartment(data: CreateDepartmentRequest) {
    return await prisma.department.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        parentDepartmentId: data.parentDepartmentId,
        departmentHeadId: data.departmentHeadId,
      },
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
        parentDepartment: true,
        subDepartments: true,
        departmentHead: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        teams: true,
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async getDepartmentsByOrganization(organizationId: string) {
    return await prisma.department.findMany({
      where: { organizationId },
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
        parentDepartment: true,
        subDepartments: true,
        departmentHead: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        teams: true,
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async getDepartmentById(id: string) {
    return await prisma.department.findUnique({
      where: { id },
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
        parentDepartment: true,
        subDepartments: true,
        departmentHead: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        teams: true,
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async updateDepartment(id: string, data: Partial<CreateDepartmentRequest>) {
    return await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        parentDepartmentId: data.parentDepartmentId,
        departmentHeadId: data.departmentHeadId,
      },
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
        parentDepartment: true,
        subDepartments: true,
        departmentHead: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        teams: true,
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteDepartment(id: string) {
    return await prisma.department.delete({
      where: { id },
    });
  }

  // Team CRUD
  async createTeam(data: CreateTeamRequest) {
    return await prisma.surveyTeam.create({
      data: {
        departmentId: data.departmentId,
        name: data.name,
        description: data.description,
        teamLeadId: data.teamLeadId,
      },
      include: {
        department: {
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
          },
        },
        teamLead: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async getTeamsByDepartment(departmentId: string) {
    return await prisma.surveyTeam.findMany({
      where: { departmentId },
      include: {
        department: {
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
          },
        },
        teamLead: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async getTeamById(id: string) {
    return await prisma.surveyTeam.findUnique({
      where: { id },
      include: {
        department: {
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
          },
        },
        teamLead: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async updateTeam(id: string, data: Partial<CreateTeamRequest>) {
    return await prisma.surveyTeam.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        teamLeadId: data.teamLeadId,
      },
      include: {
        department: {
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
          },
        },
        teamLead: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteTeam(id: string) {
    return await prisma.surveyTeam.delete({
      where: { id },
    });
  }

  // User Assignment
  async assignUserToDepartment(data: AssignUserToDepartmentRequest, assignedById: string) {
    // Check if user is already assigned to this department
    const existingAssignment = await prisma.userDepartmentAssignment.findUnique({
      where: {
        userId_departmentId: {
          userId: data.userId,
          departmentId: data.departmentId,
        },
      },
    });

    if (existingAssignment) {
      throw new Error('User is already assigned to this department');
    }

    return await prisma.userDepartmentAssignment.create({
      data: {
        userId: data.userId,
        departmentId: data.departmentId,
        teamId: data.teamId,
        role: data.role,
        assignedById: assignedById,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        department: {
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
          },
        },
        team: true,
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

  async getUserAssignments(userId: string) {
    return await prisma.userDepartmentAssignment.findMany({
      where: { userId },
      include: {
        department: {
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
          },
        },
        team: true,
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

  async removeUserFromDepartment(userId: string, departmentId: string) {
    return await prisma.userDepartmentAssignment.delete({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    });
  }

  // Bulk User Assignment from CSV/Excel
  async bulkAssignUsers(
    data: BulkUserAssignmentData[],
    organizationId: string,
    assignedById: string,
  ) {
    const results = {
      successful: [] as any[],
      failed: [] as { row: BulkUserAssignmentData; error: string }[],
    };

    for (const row of data) {
      try {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: row.userEmail },
          select: { id: true, name: true, email: true },
        });

        if (!user) {
          results.failed.push({ row, error: `User with email ${row.userEmail} not found` });
          continue;
        }

        // Find department by name within the organization
        const department = await prisma.department.findFirst({
          where: {
            organizationId: organizationId,
            name: row.departmentName,
          },
          select: { id: true, name: true },
        });

        if (!department) {
          results.failed.push({
            row,
            error: `Department ${row.departmentName} not found in the organization`,
          });
          continue;
        }

        let teamId = null;
        if (row.teamName) {
          // Find team by name within the department
          const team = await prisma.surveyTeam.findFirst({
            where: {
              departmentId: department.id,
              name: row.teamName,
            },
            select: { id: true, name: true },
          });

          if (!team) {
            results.failed.push({
              row,
              error: `Team ${row.teamName} not found in department ${row.departmentName}`,
            });
            continue;
          }
          teamId = team.id;
        }

        // Check if user is already assigned to this department
        const existingAssignment = await prisma.userDepartmentAssignment.findUnique({
          where: {
            userId_departmentId: {
              userId: user.id,
              departmentId: department.id,
            },
          },
        });

        if (existingAssignment) {
          results.failed.push({
            row,
            error: `User ${row.userEmail} is already assigned to department ${row.departmentName}`,
          });
          continue;
        }

        // Create the assignment
        const assignment = await prisma.userDepartmentAssignment.create({
          data: {
            userId: user.id,
            departmentId: department.id,
            teamId: teamId,
            role: row.role,
            assignedById: assignedById,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
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

        results.successful.push(assignment);
      } catch (error: any) {
        results.failed.push({ row, error: error.message || 'Unknown error occurred' });
      }
    }

    return results;
  }
}
