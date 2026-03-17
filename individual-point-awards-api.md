# Individual Point Awards API Documentation

This document describes the new API endpoints for individual point allocation in the teams module.

## Overview

The Individual Point Awards system allows admins to allocate points directly to individual candidates/users within a session. These points are tracked separately from team points but are included in the team leaderboard calculations, providing a comprehensive view of both team and individual performance.

## Key Features

1. **Individual Point Allocation**: Admins can award points directly to specific users/candidates
2. **Team Leaderboard Integration**: Individual points are automatically included in team leaderboard calculations
3. **Comprehensive Tracking**: Full history of individual point awards with reason and category
4. **Admin Oversight**: Admins can view all individual point awards across the session

## API Endpoints

### 1. Award Points to Individual User (Admin Only)

**POST** `/:sessionId/users/:userId/award-points`

Awards points to a specific user/candidate in a session.

**Request Body:**
```json
{
  "points": 50,
  "reason": "Excellent participation in discussion",
  "category": "Participation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Points awarded to user successfully",
  "data": {
    "award": {
      "id": "award-uuid",
      "points": 50,
      "reason": "Excellent participation in discussion",
      "category": "Participation",
      "user": {
        "id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "team": {
        "id": "team-uuid",
        "name": "Team Alpha"
      },
      "awardedBy": {
        "id": "admin-uuid",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "userSummary": {
      "id": "user-uuid",
      "name": "John Doe",
      "totalIndividualPoints": 150,
      "totalAwards": 3,
      "team": {
        "id": "team-uuid",
        "name": "Team Alpha"
      }
    }
  }
}
```

### 2. Get Individual Point Awards for a User

**GET** `/:sessionId/users/:userId/point-awards?limit=50&offset=0`

Retrieves the individual point awards history for a specific user.

**Query Parameters:**
- `limit` (optional): Number of records to return (1-100, default: 50)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "message": "Individual point awards retrieved successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "team": {
        "id": "team-uuid",
        "name": "Team Alpha"
      }
    },
    "awards": [
      {
        "id": "award-uuid",
        "points": 50,
        "reason": "Excellent participation in discussion",
        "category": "Participation",
        "awardedBy": {
          "id": "admin-uuid",
          "name": "Admin User"
        },
        "team": {
          "id": "team-uuid",
          "name": "Team Alpha"
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "summary": {
      "totalPoints": 150,
      "totalAwards": 5,
      "positiveAwards": 4,
      "negativeAwards": 1
    }
  }
}
```

### 3. Get All Individual Point Awards in Session (Admin Only)

**GET** `/:sessionId/individual-point-awards?limit=50&offset=0&teamId=team-uuid&category=Participation&sortBy=createdAt&order=desc`

Retrieves all individual point awards in a session with filtering and sorting options.

**Query Parameters:**
- `limit` (optional): Number of records to return (1-100, default: 50)
- `offset` (optional): Number of records to skip (default: 0)
- `teamId` (optional): Filter by specific team
- `category` (optional): Filter by award category
- `sortBy` (optional): Sort by field (createdAt, points, userName, default: createdAt)
- `order` (optional): Sort order (asc, desc, default: desc)

**Response:**
```json
{
  "success": true,
  "message": "Session individual point awards retrieved successfully",
  "data": {
    "session": {
      "id": "session-uuid",
      "title": "Leadership Workshop"
    },
    "awards": [
      {
        "id": "award-uuid",
        "points": 50,
        "reason": "Excellent participation in discussion",
        "category": "Participation",
        "user": {
          "id": "user-uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "team": {
          "id": "team-uuid",
          "name": "Team Alpha"
        },
        "awardedBy": {
          "id": "admin-uuid",
          "name": "Admin User"
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "summary": {
      "totalPoints": 1250,
      "totalAwards": 25
    },
    "categoryBreakdown": [
      {
        "category": "Participation",
        "totalPoints": 600,
        "totalAwards": 12
      },
      {
        "category": "Leadership",
        "totalPoints": 400,
        "totalAwards": 8
      },
      {
        "category": "Uncategorized",
        "totalPoints": 250,
        "totalAwards": 5
      }
    ]
  }
}
```

### 4. Updated Team Leaderboard

The existing team leaderboard endpoint now includes individual point awards in its calculations:

**GET** `/:sessionId/teams/leaderboard`

**Enhanced Response (new fields added):**
```json
{
  "success": true,
  "message": "Team leaderboard retrieved successfully",
  "data": {
    "session": {
      "id": "session-uuid",
      "title": "Leadership Workshop",
      "state": "IN_PROGRESS"
    },
    "leaderboard": [
      {
        "id": "team-uuid",
        "name": "Team Alpha",
        "rank": 1,
        "totalScore": 875.5,
        "members": [
          {
            "id": "member-uuid",
            "user": {
              "id": "user-uuid",
              "name": "John Doe"
            },
            "quizContribution": {
              "totalQuizScore": 250.5,
              "averageQuizScore": 83.5,
              "quizzesCompleted": 3,
              "participationRate": 100
            },
            "individualPoints": {
              "totalPoints": 150,
              "totalAwards": 3
            }
          }
        ],
        "quizMetrics": {
          "totalQuizScore": 650.5,
          "averageQuizScore": 81.31,
          "totalQuizzesCompleted": 8,
          "participationRate": 89,
          "topContributor": "John Doe",
          "topContribution": 250.5
        },
        "pointAwards": {
          "manualPointsAwarded": 75,
          "totalAwardsCount": 2
        },
        "individualPointAwards": {
          "totalIndividualPoints": 300,
          "totalIndividualAwards": 6,
          "topIndividualContributor": {
            "userId": "user-uuid",
            "userName": "John Doe",
            "totalIndividualPoints": 150,
            "totalIndividualAwards": 3
          }
        }
      }
    ],
    "summary": {
      "totalTeams": 5,
      "activeTeams": 5,
      "totalParticipants": 25,
      "totalQuizzes": 3,
      "highestTeamScore": 875.5,
      "totalQuizPoints": 2450.75,
      "totalManualPoints": 200,
      "sortedBy": "totalScore",
      "sortOrder": "desc"
    }
  }
}
```

## Validation Rules

### Points
- Must be an integer
- Range: -1000 to +1000 points
- Negative points can be used for penalties

### Reason
- Required field
- Maximum 500 characters
- Describes why the points were awarded

### Category
- Optional field
- Maximum 100 characters
- Used for grouping and filtering awards

## Authentication & Authorization

- All endpoints require authentication (`authenticateToken` middleware)
- Point awarding endpoints require admin privileges (`isAdmin` middleware)
- Point history viewing is accessible to all authenticated users

## Use Cases

1. **Performance Recognition**: Award points for exceptional quiz performance
2. **Participation Rewards**: Recognize active participation in discussions
3. **Leadership Points**: Award points for showing leadership qualities
4. **Penalty System**: Deduct points for infractions or late submissions
5. **Bonus Awards**: Give bonus points for creative solutions or innovative thinking

## Team Leaderboard Impact

Individual points are automatically included in team leaderboard calculations:
- **Total Team Score** = Quiz Points + Manual Team Points + Individual Points (sum of all team members)
- **Member Ranking** = Quiz Score + Individual Points
- **Team Analytics** include separate tracking of individual vs team awards

This system provides admins with granular control over point allocation while maintaining the team-based competitive structure of the platform. 