# Team Management API Documentation

## Overview

The Team Management API allows admin users to create and manage teams within sessions. Participants can be assigned to teams, and teams can have different roles and configurations.

## Base URL
All endpoints are relative to: `/api/sessions/{sessionId}/teams`

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

Most endpoints also require admin privileges.

---

## Endpoints

### 1. Create Team
Create a new team within a session.

**Endpoint:** `POST /api/sessions/{sessionId}/teams`  
**Auth:** Admin required  
**Content-Type:** `application/json`

#### Request Parameters
- `sessionId` (path): UUID of the session

#### Request Body
```json
{
  "name": "Team Alpha",
  "description": "Frontend development team",
  "color": "#FF5733",
  "maxMembers": 10
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "team": {
      "id": "team-uuid",
      "name": "Team Alpha",
      "description": "Frontend development team",
      "color": "#FF5733",
      "maxMembers": 10,
      "isActive": true,
      "memberCount": 0,
      "members": [],
      "session": {
        "id": "session-uuid",
        "title": "Session 100"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

---

### 2. Update Team
Update team details.

**Endpoint:** `PUT /api/sessions/{sessionId}/teams/{teamId}`  
**Auth:** Admin required  
**Content-Type:** `application/json`

#### Request Parameters
- `sessionId` (path): UUID of the session
- `teamId` (path): UUID of the team

#### Request Body
```json
{
  "name": "Team Alpha Updated",
  "description": "Updated description",
  "maxMembers": 15,
  "isActive": true
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Team updated successfully",
  "data": {
    "team": {
      "id": "team-uuid",
      "name": "Team Alpha Updated",
      "description": "Updated description",
      "color": "#FF5733",
      "maxMembers": 15,
      "isActive": true,
      "memberCount": 3,
      "members": [...],
      "session": {
        "id": "session-uuid",
        "title": "Session 100"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

### 3. Get All Teams
Retrieve all teams in a session.

**Endpoint:** `GET /api/sessions/{sessionId}/teams`  
**Auth:** Authenticated user  

#### Request Parameters
- `sessionId` (path): UUID of the session
- `includeInactive` (query): Boolean to include inactive teams (optional)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Teams retrieved successfully",
  "data": {
    "session": {
      "id": "session-uuid",
      "title": "Session 100"
    },
    "teams": [
      {
        "id": "team-uuid-1",
        "name": "Team Alpha",
        "description": "Frontend team",
        "color": "#FF5733",
        "maxMembers": 10,
        "isActive": true,
        "memberCount": 5,
        "members": [
          {
            "id": "member-uuid",
            "user": {
              "id": "user-uuid",
              "name": "John Doe",
              "email": "john@example.com",
              "profilePhoto": "url"
            },
            "role": "LEADER",
            "joinedAt": "2024-01-15T10:15:00Z"
          }
        ],
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "totalTeams": 3,
    "activeTeams": 3
  }
}
```

---

### 4. Get Team by ID
Retrieve detailed information about a specific team.

**Endpoint:** `GET /api/sessions/{sessionId}/teams/{teamId}`  
**Auth:** Authenticated user  

#### Request Parameters
- `sessionId` (path): UUID of the session
- `teamId` (path): UUID of the team

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Team retrieved successfully",
  "data": {
    "team": {
      "id": "team-uuid",
      "name": "Team Alpha",
      "description": "Frontend development team",
      "color": "#FF5733",
      "maxMembers": 10,
      "isActive": true,
      "memberCount": 5,
      "members": [
        {
          "id": "member-uuid",
          "user": {
            "id": "user-uuid",
            "name": "John Doe",
            "email": "john@example.com",
            "profilePhoto": "url",
            "companyPosition": "Developer",
            "department": "Engineering"
          },
          "role": "LEADER",
          "joinedAt": "2024-01-15T10:15:00Z"
        }
      ],
      "session": {
        "id": "session-uuid",
        "title": "Session 100"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

---

### 5. Add Team Member
Add a participant to a team.

**Endpoint:** `POST /api/sessions/{sessionId}/teams/{teamId}/members`  
**Auth:** Admin required  
**Content-Type:** `application/json`

#### Request Parameters
- `sessionId` (path): UUID of the session
- `teamId` (path): UUID of the team

#### Request Body
```json
{
  "userId": "user-uuid",
  "role": "MEMBER"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Team member added successfully",
  "data": {
    "teamMember": {
      "id": "member-uuid",
      "user": {
        "id": "user-uuid",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "profilePhoto": "url"
      },
      "role": "MEMBER",
      "joinedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

### 6. Remove Team Member
Remove a participant from a team.

**Endpoint:** `DELETE /api/sessions/{sessionId}/teams/{teamId}/members/{userId}`  
**Auth:** Admin required

#### Request Parameters
- `sessionId` (path): UUID of the session
- `teamId` (path): UUID of the team
- `userId` (path): UUID of the user to remove

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Team member removed successfully"
}
```

---

### 7. Update Team Member Role
Update the role of a team member.

**Endpoint:** `PATCH /api/sessions/{sessionId}/teams/{teamId}/members/{userId}/role`  
**Auth:** Admin required  
**Content-Type:** `application/json`

#### Request Parameters
- `sessionId` (path): UUID of the session
- `teamId` (path): UUID of the team
- `userId` (path): UUID of the user

#### Request Body
```json
{
  "role": "LEADER"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Team member role updated successfully",
  "data": {
    "teamMember": {
      "id": "member-uuid",
      "user": {
        "id": "user-uuid",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "profilePhoto": "url"
      },
      "role": "LEADER",
      "joinedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

### 8. Bulk Assign Members
Assign multiple participants to teams in a single operation.

**Endpoint:** `POST /api/sessions/{sessionId}/teams/bulk-assign`  
**Auth:** Admin required  
**Content-Type:** `application/json`

#### Request Parameters
- `sessionId` (path): UUID of the session

#### Request Body
```json
{
  "assignments": [
    {
      "userId": "user-uuid-1",
      "teamId": "team-uuid-1",
      "role": "LEADER"
    },
    {
      "userId": "user-uuid-2",
      "teamId": "team-uuid-1",
      "role": "MEMBER"
    },
    {
      "userId": "user-uuid-3",
      "teamId": "team-uuid-2",
      "role": "MEMBER"
    }
  ]
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Bulk assignment completed",
  "data": {
    "successful": [
      {
        "userId": "user-uuid-1",
        "teamId": "team-uuid-1",
        "teamName": "Team Alpha",
        "userName": "John Doe",
        "role": "LEADER",
        "status": "success"
      }
    ],
    "errors": [
      {
        "userId": "user-uuid-4",
        "teamId": "team-uuid-1",
        "error": "Team has reached maximum capacity"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 2,
      "failed": 1
    }
  }
}
```

---

### 9. Auto-Assign Teams
Automatically assign all session participants to teams.

**Endpoint:** `POST /api/sessions/{sessionId}/teams/auto-assign`  
**Auth:** Admin required  
**Content-Type:** `application/json`

#### Request Parameters
- `sessionId` (path): UUID of the session

#### Request Body
```json
{
  "strategy": "BALANCED",
  "teamsCount": 4,
  "maxMembersPerTeam": 5
}
```

**Strategy Options:**
- `BALANCED`: Distribute members evenly across teams
- `RANDOM`: Randomly shuffle participants before assignment

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Participants auto-assigned to teams successfully",
  "data": {
    "strategy": "BALANCED",
    "assignments": [
      {
        "userId": "user-uuid-1",
        "userName": "John Doe",
        "teamId": "team-uuid-1",
        "teamName": "Team 1"
      }
    ],
    "summary": {
      "totalParticipants": 20,
      "totalTeams": 4,
      "averageMembersPerTeam": 5
    }
  }
}
```

---

### 10. Delete Team
Delete a team and remove all its members.

**Endpoint:** `DELETE /api/sessions/{sessionId}/teams/{teamId}`  
**Auth:** Admin required

#### Request Parameters
- `sessionId` (path): UUID of the session
- `teamId` (path): UUID of the team

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Team deleted successfully",
  "data": {
    "deletedTeam": {
      "name": "Team Alpha",
      "memberCount": 5
    }
  }
}
```

---

### 11. Get Team Leaderboard
Get team rankings and performance metrics for a session.

**Endpoint:** `GET /api/sessions/{sessionId}/teams/leaderboard`  
**Auth:** Authenticated user (accessible to both admin and regular users)

#### Request Parameters
- `sessionId` (path): UUID of the session
- `sortBy` (query): Sort criteria - `quizScore`, `totalXP`, `averageXP`, `participationRate`, `memberCount` (optional, default: `quizScore`)
- `order` (query): Sort order - `asc`, `desc` (optional, default: `desc`)
- `includeInactive` (query): Boolean to include inactive teams (optional)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Team leaderboard retrieved successfully",
  "data": {
    "session": {
      "id": "session-uuid",
      "title": "Session 100",
      "state": "IN_PROGRESS"
    },
    "leaderboard": [
      {
        "id": "team-uuid-1",
        "name": "Team Alpha",
        "description": "Frontend development team",
        "color": "#FF5733",
        "isActive": true,
        "memberCount": 5,
        "maxMembers": 10,
        "rank": 1,
        "members": [
          {
            "id": "member-uuid",
            "user": {
              "id": "user-uuid",
              "name": "John Doe",
              "email": "john@example.com",
              "profilePhoto": "url",
              "xpPoints": 150
            },
            "role": "LEADER",
            "joinedAt": "2024-01-15T10:15:00Z"
          }
        ],
        "metrics": {
          "totalXP": 750,
          "averageXP": 150,
          "totalQuizScore": 285.5,
          "averageQuizScore": 95.17,
          "quizParticipationRate": 90,
          "pollParticipationRate": 85,
          "overallParticipationRate": 87,
          "completedQuizzes": 27,
          "completedPolls": 34,
          "totalActivities": 61
        },
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "totalTeams": 4,
      "activeTeams": 4,
      "totalParticipants": 20,
      "totalQuizzes": 3,
      "totalPolls": 4,
      "sortedBy": "totalXP",
      "sortOrder": "desc"
    }
  }
}
```

#### Leaderboard Metrics Explained
- **totalXP**: Sum of all XP points from team members
- **averageXP**: Average XP points per team member
- **totalQuizScore**: Sum of all quiz scores by team members
- **averageQuizScore**: Average quiz score per completed quiz
- **quizParticipationRate**: Percentage of quiz participation by team members
- **pollParticipationRate**: Percentage of poll participation by team members
- **overallParticipationRate**: Overall activity participation rate
- **completedQuizzes**: Total number of quiz responses by team members
- **completedPolls**: Total number of poll responses by team members
- **totalActivities**: Total responses across all activities

---

## Data Models

### Team
```typescript
{
  id: string;
  name: string;
  description?: string;
  color?: string;
  sessionId: string;
  maxMembers?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### TeamMember
```typescript
{
  id: string;
  teamId: string;
  userId: string;
  role: 'LEADER' | 'MEMBER';
  joinedAt: Date;
}
```

### TeamRole Enum
- `LEADER`: Team leader with additional privileges
- `MEMBER`: Regular team member

---

## Error Responses

### Common Error Codes
- `400 Bad Request`: Invalid request data or business logic violation
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions (admin required)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Example Error Response
```json
{
  "success": false,
  "message": "Team name already exists in this session",
  "statusCode": 400
}
```

---

## Use Cases

### 1. Creating Teams for a Workshop
1. Admin creates session "Session 100"
2. Admin creates teams: "Frontend Team", "Backend Team", "Design Team"
3. Admin invites participants to the session
4. Admin assigns participants to teams based on skills

### 2. Auto-Assignment for Large Groups
1. Admin creates session with 50 participants
2. Admin uses auto-assign with strategy "BALANCED" and 10 teams
3. System automatically creates teams and distributes participants evenly

### 3. Dynamic Team Management
1. Admin creates initial teams
2. During session, admin moves participants between teams
3. Admin promotes members to team leaders
4. Admin creates additional teams as needed

---

## Notes

- Users can only be in one team per session
- Teams belong to specific sessions
- Team names must be unique within a session
- Maximum team size is enforced if specified
- Deleting a team removes all team memberships
- Only session participants can be added to teams
- Auto-assignment clears existing team memberships before reassigning 