# Survey & Organization API - Postman Collection

## Base URL
```
https://your-backend-domain.com/api
```

## Authentication
All endpoints require Bearer token in the Authorization header:
```
Authorization: Bearer your-jwt-token
```

---

# 🏢 ORGANIZATION MANAGEMENT ENDPOINTS

## 1. CREATE ORGANIZATION
**POST** `/organization/organizations`

### Request Body:
```json
{
  "sessionId": "session-uuid-here",
  "name": "Tech Solutions Inc",
  "description": "A leading technology solutions company",
  "settings": {
    "timezone": "UTC",
    "workingHours": "9AM-5PM",
    "departments": ["Engineering", "Sales", "HR"]
  }
}
```

### Expected Response (201):
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "id": "org-uuid-12345",
    "sessionId": "session-uuid-here",
    "name": "Tech Solutions Inc",
    "description": "A leading technology solutions company",
    "settings": {
      "timezone": "UTC",
      "workingHours": "9AM-5PM",
      "departments": ["Engineering", "Sales", "HR"]
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "session": {
      "id": "session-uuid-here",
      "title": "Q1 2024 Assessment",
      "description": "First quarter organizational assessment"
    },
    "departments": []
  }
}
```

---

## 2. GET ORGANIZATIONS BY SESSION
**GET** `/organization/sessions/:sessionId/organizations`

### Path Parameters:
- `sessionId`: session-uuid-here

### Expected Response (200):
```json
{
  "success": true,
  "message": "Organizations retrieved successfully",
  "data": [
    {
      "id": "org-uuid-12345",
      "sessionId": "session-uuid-here",
      "name": "Tech Solutions Inc",
      "description": "A leading technology solutions company",
      "settings": {...},
      "createdAt": "2024-01-15T10:30:00Z",
      "departments": [
        {
          "id": "dept-uuid-1",
          "name": "Engineering",
          "description": "Software development team",
          "teams": []
        }
      ]
    }
  ]
}
```

---

## 3. CREATE DEPARTMENT
**POST** `/organization/departments`

### Request Body:
```json
{
  "organizationId": "org-uuid-12345",
  "name": "Engineering Department",
  "description": "Software development and technical operations",
  "parentDepartmentId": null,
  "departmentHeadId": "user-uuid-head"
}
```

### Expected Response (201):
```json
{
  "success": true,
  "message": "Department created successfully",
  "data": {
    "id": "dept-uuid-eng-001",
    "organizationId": "org-uuid-12345",
    "name": "Engineering Department",
    "description": "Software development and technical operations",
    "parentDepartmentId": null,
    "departmentHeadId": "user-uuid-head",
    "createdAt": "2024-01-15T11:00:00Z",
    "organization": {
      "id": "org-uuid-12345",
      "name": "Tech Solutions Inc"
    },
    "departmentHead": {
      "id": "user-uuid-head",
      "name": "John Smith",
      "email": "john.smith@company.com",
      "role": "ADMIN"
    },
    "teams": [],
    "userAssignments": []
  }
}
```

---

## 4. CREATE TEAM
**POST** `/organization/teams`

### Request Body:
```json
{
  "departmentId": "dept-uuid-eng-001",
  "name": "Frontend Development Team",
  "description": "React and Next.js development team",
  "teamLeadId": "user-uuid-lead"
}
```

### Expected Response (201):
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "id": "team-uuid-frontend-001",
    "departmentId": "dept-uuid-eng-001",
    "name": "Frontend Development Team",
    "description": "React and Next.js development team",
    "teamLeadId": "user-uuid-lead",
    "createdAt": "2024-01-15T11:30:00Z",
    "department": {
      "id": "dept-uuid-eng-001",
      "name": "Engineering Department",
      "organization": {
        "id": "org-uuid-12345",
        "name": "Tech Solutions Inc"
      }
    },
    "teamLead": {
      "id": "user-uuid-lead",
      "name": "Jane Doe",
      "email": "jane.doe@company.com",
      "role": "USER"
    },
    "userAssignments": []
  }
}
```

---

## 5. ASSIGN USER TO DEPARTMENT
**POST** `/organization/user-assignments`

### Request Body:
```json
{
  "userId": "user-uuid-employee",
  "departmentId": "dept-uuid-eng-001",
  "teamId": "team-uuid-frontend-001",
  "role": "USER"
}
```

### Expected Response (201):
```json
{
  "success": true,
  "message": "User assigned to department successfully",
  "data": {
    "id": "assignment-uuid-001",
    "userId": "user-uuid-employee",
    "departmentId": "dept-uuid-eng-001",
    "teamId": "team-uuid-frontend-001",
    "role": "USER",
    "assignedAt": "2024-01-15T12:00:00Z",
    "user": {
      "id": "user-uuid-employee",
      "name": "Bob Wilson",
      "email": "bob.wilson@company.com",
      "role": "USER"
    },
    "department": {
      "id": "dept-uuid-eng-001",
      "name": "Engineering Department"
    },
    "team": {
      "id": "team-uuid-frontend-001",
      "name": "Frontend Development Team"
    }
  }
}
```

---

# 📊 SURVEY MANAGEMENT ENDPOINTS

## 6. CREATE SURVEY
**POST** `/survey/surveys`

### Request Body:
```json
{
  "sessionId": "session-uuid-here",
  "title": "Employee Satisfaction Survey Q1 2024",
  "description": "Quarterly assessment of employee satisfaction and engagement",
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-02-15T23:59:59Z",
  "isAnonymous": true,
  "allowMultipleResponses": false,
  "isOptional": true,
  "settings": {
    "reminderEnabled": true,
    "showProgress": true,
    "randomizeQuestions": false
  }
}
```

### Expected Response (201):
```json
{
  "success": true,
  "message": "Survey created successfully",
  "data": {
    "id": "survey-uuid-satisfaction-001",
    "sessionId": "session-uuid-here",
    "title": "Employee Satisfaction Survey Q1 2024",
    "description": "Quarterly assessment of employee satisfaction and engagement",
    "status": "DRAFT",
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-15T23:59:59Z",
    "isAnonymous": true,
    "allowMultipleResponses": false,
    "isOptional": true,
    "settings": {
      "reminderEnabled": true,
      "showProgress": true,
      "randomizeQuestions": false
    },
    "createdAt": "2024-01-15T14:00:00Z",
    "session": {
      "id": "session-uuid-here",
      "title": "Q1 2024 Assessment",
      "description": "First quarter organizational assessment"
    },
    "createdBy": {
      "id": "admin-uuid-001",
      "name": "Admin User",
      "email": "admin@company.com",
      "role": "ADMIN"
    },
    "questions": [],
    "assignments": []
  }
}
```

---

## 7. ADD QUESTION TO SURVEY
**POST** `/survey/survey-questions`

### Request Body:
```json
{
  "surveyId": "survey-uuid-satisfaction-001",
  "questionText": "How satisfied are you with your work environment?",
  "questionType": "RATING_SCALE",
  "surveyType": "SATISFACTION",
  "options": {
    "scale": "1-5",
    "labels": {
      "1": "Very Dissatisfied",
      "2": "Dissatisfied", 
      "3": "Neutral",
      "4": "Satisfied",
      "5": "Very Satisfied"
    }
  },
  "validationRules": {
    "required": true,
    "minValue": 1,
    "maxValue": 5
  },
  "isRequired": true,
  "orderIndex": 1
}
```

### Expected Response (201):
```json
{
  "success": true,
  "message": "Question added to survey successfully",
  "data": {
    "id": "question-uuid-001",
    "surveyId": "survey-uuid-satisfaction-001",
    "questionText": "How satisfied are you with your current work environment?",
    "questionType": "RATING_SCALE",
    "options": {
      "scale": "1-5",
      "labels": {
        "1": "Very Dissatisfied",
        "2": "Dissatisfied", 
        "3": "Neutral",
        "4": "Satisfied",
        "5": "Very Satisfied"
      }
    },
    "validationRules": {
      "required": true,
      "minValue": 1,
      "maxValue": 5
    },
    "isRequired": true,
    "orderIndex": 1,
    "createdAt": "2024-01-15T14:15:00Z",
    "survey": {
      "id": "survey-uuid-satisfaction-001",
      "title": "Employee Satisfaction Survey Q1 2024"
    }
  }
}
```

---

## 8. ASSIGN SURVEY TO ORGANIZATION/DEPARTMENT/TEAM
**POST** `/survey/survey-assignments`

### Request Body (Assign to Department):
```json
{
  "surveyId": "survey-uuid-satisfaction-001",
  "assignedToType": "DEPARTMENT",
  "assignedToId": "dept-uuid-eng-001",
  "deadline": "2024-02-14T23:59:59Z",
  "reminderSchedule": {
    "enabled": true,
    "frequency": "weekly",
    "daysBeforeDeadline": [7, 3, 1]
  }
}
```

### Request Body (Assign to Team):
```json
{
  "surveyId": "survey-uuid-satisfaction-001",
  "assignedToType": "TEAM",
  "assignedToId": "team-uuid-frontend-001",
  "deadline": "2024-02-14T23:59:59Z",
  "reminderSchedule": {
    "enabled": true,
    "frequency": "weekly"
  }
}
```

### Request Body (Assign to Individual):
```json
{
  "surveyId": "survey-uuid-satisfaction-001",
  "assignedToType": "INDIVIDUAL",
  "assignedToId": "user-uuid-employee",
  "deadline": "2024-02-14T23:59:59Z"
}
```

### Expected Response (201):
```json
{
  "success": true,
  "message": "Survey assigned successfully",
  "data": {
    "id": "assignment-uuid-survey-001",
    "surveyId": "survey-uuid-satisfaction-001",
    "assignedToType": "DEPARTMENT",
    "assignedToId": "dept-uuid-eng-001",
    "deadline": "2024-02-14T23:59:59Z",
    "reminderSchedule": {
      "enabled": true,
      "frequency": "weekly",
      "daysBeforeDeadline": [7, 3, 1]
    },
    "assignedAt": "2024-01-15T15:00:00Z",
    "survey": {
      "id": "survey-uuid-satisfaction-001",
      "title": "Employee Satisfaction Survey Q1 2024",
      "description": "Quarterly assessment of employee satisfaction and engagement"
    },
    "assignedBy": {
      "id": "admin-uuid-001",
      "name": "Admin User",
      "email": "admin@company.com"
    }
  }
}
```

---

## 9. SUBMIT SURVEY RESPONSE
**POST** `/survey/survey-responses`

### Request Body:
```json
{
  "surveyId": "survey-uuid-satisfaction-001",
  "responses": [
    {
      "questionId": "question-uuid-001",
      "responseValue": 4
    },
    {
      "questionId": "question-uuid-002",
      "responseValue": "I really enjoy working with my team and the flexible work environment."
    },
    {
      "questionId": "question-uuid-003",
      "responseValue": ["Professional Development", "Better Equipment", "Team Building"]
    }
  ]
}
```

### Expected Response (201):
```json
{
  "success": true,
  "message": "Survey response submitted successfully",
  "data": {
    "id": "response-uuid-001",
    "surveyId": "survey-uuid-satisfaction-001",
    "userId": "user-uuid-employee",
    "submittedAt": "2024-02-05T16:30:00Z",
    "completionStatus": "COMPLETE",
    "survey": {
      "id": "survey-uuid-satisfaction-001",
      "title": "Employee Satisfaction Survey Q1 2024",
      "description": "Quarterly assessment of employee satisfaction and engagement"
    },
    "user": {
      "id": "user-uuid-employee",
      "name": "Bob Wilson",
      "email": "bob.wilson@company.com"
    },
    "questionResponses": [
      {
        "id": "qr-uuid-001",
        "questionId": "question-uuid-001",
        "responseValue": 4,
        "respondedAt": "2024-02-05T16:30:00Z",
        "question": {
          "id": "question-uuid-001",
          "questionText": "How satisfied are you with your current work environment?",
          "questionType": "RATING_SCALE"
        }
      }
    ]
  }
}
```

---

## 10. GET SURVEY ANALYTICS
**GET** `/survey/surveys/:surveyId/analytics`

### Path Parameters:
- `surveyId`: survey-uuid-satisfaction-001

### Expected Response (200):
```json
{
  "success": true,
  "message": "Survey analytics retrieved successfully",
  "data": {
    "surveyInfo": {
      "id": "survey-uuid-satisfaction-001",
      "title": "Employee Satisfaction Survey Q1 2024",
      "type": "SATISFACTION",
      "status": "ACTIVE"
    },
    "statistics": {
      "totalAssigned": 25,
      "totalResponses": 18,
      "completionRate": 72,
      "averageResponseTime": 420,
      "responsesByStatus": {
        "complete": 18,
        "incomplete": 0,
        "partial": 0
      }
    },
    "questionAnalytics": [
      {
        "questionId": "question-uuid-001",
        "questionText": "How satisfied are you with your current work environment?",
        "questionType": "RATING_SCALE",
        "responseCount": 18,
        "responses": [4, 5, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5]
      }
    ]
  }
}
```

---

## 11. GET SURVEYS BY SESSION
**GET** `/survey/sessions/:sessionId/surveys`

### Path Parameters:
- `sessionId`: session-uuid-here

### Expected Response (200):
```json
{
  "success": true,
  "message": "Surveys retrieved successfully",
  "data": [
    {
      "id": "survey-uuid-satisfaction-001",
      "sessionId": "session-uuid-here",
      "title": "Employee Satisfaction Survey Q1 2024",
      "description": "Quarterly assessment of employee satisfaction and engagement",
      "type": "SATISFACTION",
      "status": "ACTIVE",
      "startDate": "2024-02-01T00:00:00Z",
      "endDate": "2024-02-15T23:59:59Z",
      "isAnonymous": true,
      "createdAt": "2024-01-15T14:00:00Z",
      "createdBy": {
        "id": "admin-uuid-001",
        "name": "Admin User",
        "email": "admin@company.com",
        "role": "ADMIN"
      },
      "questions": [
        {
          "id": "question-uuid-001",
          "questionText": "How satisfied are you with your current work environment?",
          "questionType": "RATING_SCALE",
          "orderIndex": 1
        }
      ],
      "assignments": [
        {
          "id": "assignment-uuid-survey-001",
          "assignedToType": "DEPARTMENT",
          "assignedToId": "dept-uuid-eng-001",
          "deadline": "2024-02-14T23:59:59Z"
        }
      ],
      "responses": [
        {
          "id": "response-uuid-001",
          "userId": "user-uuid-employee",
          "submittedAt": "2024-02-05T16:30:00Z"
        }
      ]
    }
  ]
}
```

---

# 📋 ADDITIONAL ENDPOINTS

## 12. GET ORGANIZATION BY ID
**GET** `/organization/organizations/:id`
- Path Parameters: `id` (organization UUID)

## 13. UPDATE ORGANIZATION
**PUT** `/organization/organizations/:id`
- Request body: Partial organization data

## 14. DELETE ORGANIZATION  
**DELETE** `/organization/organizations/:id`

## 15. GET DEPARTMENTS BY ORGANIZATION
**GET** `/organization/organizations/:organizationId/departments`

## 16. GET TEAMS BY DEPARTMENT
**GET** `/organization/departments/:departmentId/teams`

## 17. GET USER ASSIGNMENTS
**GET** `/organization/users/:userId/assignments`

## 18. GET SURVEY ASSIGNMENTS
**GET** `/survey/surveys/:surveyId/assignments`

## 19. GET USER SURVEY RESPONSES
**GET** `/survey/users/:userId/survey-responses?sessionId=session-uuid-here`

---

# 🔧 POSTMAN SETUP TIPS

1. **Create Environment Variables:**
   - `base_url`: https://your-backend-domain.com/api
   - `auth_token`: your-jwt-token
   - `session_id`: session-uuid-here
   - `org_id`: org-uuid-12345
   - `dept_id`: dept-uuid-eng-001
   - `team_id`: team-uuid-frontend-001
   - `survey_id`: survey-uuid-satisfaction-001

2. **Set Authorization Header:**
   - Type: Bearer Token
   - Token: `{{auth_token}}`

3. **Use Variables in URLs:**
   - `{{base_url}}/organization/organizations`
   - `{{base_url}}/survey/surveys/{{survey_id}}/analytics`

This collection covers all the survey and organization endpoints with realistic request/response examples! 🚀 





Here's the complete documentation for the new bulk user assignment endpoints that you can share with your frontend admin team:

## 📋 Bulk User Assignment Endpoints

### 1. Download CSV Template
**GET** `/api/organization/bulk-assignment-template`

**Description:** Downloads a CSV template file that admins can use as a reference for the bulk upload format.

**Authentication:** Not required for template download

**Response:** Returns a CSV file with the following structure:
```csv
userEmail,departmentName,teamName,role
john.doe@example.com,Engineering,Frontend Team,USER
jane.smith@example.com,Marketing,,ADMIN
bob.johnson@example.com,Engineering,Backend Team,USER
alice.wilson@example.com,HR,Recruitment Team,USER
```

### 2. Bulk Upload User Assignments
**POST** `/api/organization/:organizationId/bulk-assign-users`

**Description:** Upload a CSV or Excel file to assign multiple users to departments and teams in bulk.

**Authentication:** Required (Bearer token)

**Parameters:**
- `organizationId` (path parameter): The ID of the organization

**Request:**
- Content-Type: `multipart/form-data`
- File field name: `file`
- Supported formats: `.csv`, `.xlsx`, `.xls`

**File Format Requirements:**

| Column Name | Required | Description | Example Values |
|-------------|----------|-------------|----------------|
| `userEmail` | ✅ Required | Email of existing user in the system | `john.doe@company.com` |
| `departmentName` | ✅ Required | Name of existing department in the organization | `Engineering`, `Marketing` |
| `teamName` | ❌ Optional | Name of existing team within the department (leave empty if no team) | `Frontend Team`, `` |
| `role` | ✅ Required | User role in the department | `USER` or `ADMIN` |

**Important Notes:**
1. **User must exist**: The email must belong to a user already registered in the system
2. **Department must exist**: The department must already exist in the specified organization
3. **Team must exist**: If teamName is provided, the team must exist within the specified department
4. **Unique assignments**: Users cannot be assigned to the same department twice
5. **Case sensitive**: Department and team names are case sensitive

**Example CSV:**
```csv
userEmail,departmentName,teamName,role
alice@company.com,Engineering,Frontend Team,USER
bob@company.com,Engineering,Backend Team,ADMIN
carol@company.com,Marketing,,USER
david@company.com,HR,Recruitment Team,USER
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bulk user assignment completed",
  "data": {
    "totalProcessed": 4,
    "successful": 3,
    "failed": 1,
    "successfulAssignments": [
      {
        "id": "assignment-uuid-1",
        "user": {
          "id": "user-uuid-1",
          "name": "Alice Johnson",
          "email": "alice@company.com",
          "role": "USER"
        },
        "department": {
          "id": "dept-uuid-1",
          "name": "Engineering"
        },
        "team": {
          "id": "team-uuid-1",
          "name": "Frontend Team"
        }
      }
    ],
    "failedAssignments": [
      {
        "row": {
          "userEmail": "nonexistent@company.com",
          "departmentName": "Engineering",
          "teamName": "Frontend Team",
          "role": "USER"
        },
        "error": "User with email nonexistent@company.com not found"
      }
    ]
  }
}
```

**Error Responses:**

**400 - No file uploaded:**
```json
{
  "success": false,
  "message": "Please upload a CSV or Excel file"
}
```

**400 - Invalid file format:**
```json
{
  "success": false,
  "message": "Unsupported file format. Please upload CSV or Excel file."
}
```

**400 - No valid data:**
```json
{
  "success": false,
  "message": "No valid rows found. Please check that userEmail, departmentName, and role fields are present and valid."
}
```

**404 - Organization not found:**
```json
{
  "success": false,
  "message": "Organization not found"
}
```


### 3. File Validation
- Accept only: `.csv`, `.xlsx`, `.xls`
- Max file size: 5MB
- Required columns: `userEmail`, `departmentName`, `role`

### 4. Results Display
Show a summary table with:
- Total rows processed
- Successful assignments count
- Failed assignments count
- Detailed error messages for failed rows

## 📝 Common Error Scenarios

1. **User not found**: Email doesn't exist in the system
2. **Department not found**: Department name doesn't exist in the organization
3. **Team not found**: Team name doesn't exist in the specified department
4. **Duplicate assignment**: User already assigned to the same department
5. **Invalid role**: Role must be exactly "USER" or "ADMIN"
6. **Missing required fields**: userEmail, departmentName, or role is empty

## 🎯 Workflow for Admin

1. **Download template** → Get the CSV format
2. **Fill template** → Add user assignments data
3. **Upload file** → Use the bulk upload endpoint
4. **Review results** → Check successful and failed assignments
5. **Fix errors** → Re-upload failed rows after corrections

This allows admins to efficiently assign hundreds of users to departments and teams without manual one-by-one assignments!