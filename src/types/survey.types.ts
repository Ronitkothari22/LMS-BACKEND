// Survey Module Types
export interface CreateOrganizationRequest {
  sessionId: string;
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface CreateDepartmentRequest {
  organizationId: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  departmentHeadId?: string;
}

export interface CreateTeamRequest {
  departmentId: string;
  name: string;
  description?: string;
  teamLeadId?: string;
}

export interface AssignUserToDepartmentRequest {
  userId: string;
  departmentId: string;
  teamId?: string;
  role: 'ADMIN' | 'USER';
}

export interface BulkUserAssignmentData {
  userEmail: string;
  departmentName: string;
  teamName?: string;
  role: 'ADMIN' | 'USER';
}

export interface CreateSurveyRequest {
  sessionId: string;
  title: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  startDate?: Date;
  endDate?: Date;
  isAnonymous?: boolean;
  allowMultipleResponses?: boolean;
  isOptional?: boolean;
  settings?: Record<string, any>;
}

export interface CreateSurveyQuestionRequest {
  surveyId: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'RATING_SCALE' | 'TEXT' | 'BEHAVIORAL' | 'MATRIX';
  surveyType: 'BEHAVIORAL' | 'SATISFACTION' | 'ORGANIZATIONAL' | 'CUSTOM';
  options?: Record<string, any>;
  validationRules?: Record<string, any>;
  isRequired?: boolean;
  orderIndex: number;
}

export interface CreateSurveyAssignmentRequest {
  surveyId: string;
  assignedToType: 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL';
  assignedToId: string;
  deadline?: Date;
  reminderSchedule?: Record<string, any>;
}

export interface SurveyResponseRequest {
  surveyId: string;
  responses: Array<{
    questionId: string;
    responseValue: any;
  }>;
}
