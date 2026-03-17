# Session Quiz Scoring API

## Overview
The Session Quiz Scoring API provides comprehensive scoring details for all quizzes within a specific session, including participant performance, attempt counts, and overall session statistics.

## Endpoint
**GET** `/api/sessions/{sessionId}/quiz-scoring`

## Description
Retrieves overall quiz scoring details for all participants in a specific session, including:
- Person name, score, and total attempts for each participant
- Individual quiz performance breakdown
- Session-wide statistics and leaderboard rankings

## Authentication
- **Required**: Yes (Bearer Token)
- **Access Control**: 
  - Admins can access any session
  - Session creators can access their own sessions
  - Session participants and invited users can access the session they're part of

## Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string (UUID) | Yes | The unique identifier of the session |

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Session quiz scoring retrieved successfully",
  "data": {
    "sessionId": "uuid",
    "sessionTitle": "Session Title",
    "quizzes": [
      {
        "id": "quiz-uuid",
        "title": "Quiz Title",
        "totalMarks": 100,
        "passingScore": 60,
        "pointsPerQuestion": 10
      }
    ],
    "summary": {
      "totalQuizzes": 3,
      "totalParticipants": 25,
      "participantsWithAttempts": 20,
      "averageParticipationRate": 80.5,
      "highestScore": 285,
      "averageScore": 210.75
    },
    "participants": [
      {
        "rank": 1,
        "userId": "user-uuid",
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "totalAttempts": 8,
        "totalScore": 285,
        "averageScore": 95.0,
        "quizzesCompleted": 3,
        "quizzesPassed": 3,
        "participationRate": 100,
        "quizResults": [
          {
            "quizId": "quiz-uuid-1",
            "quizTitle": "Math Quiz",
            "attempts": 3,
            "bestScore": 95,
            "latestScore": 85,
            "totalMarks": 100,
            "passingScore": 60,
            "passed": true
          },
          {
            "quizId": "quiz-uuid-2",
            "quizTitle": "Science Quiz",
            "attempts": 2,
            "bestScore": 90,
            "latestScore": 90,
            "totalMarks": 100,
            "passingScore": 60,
            "passed": true
          }
        ]
      }
    ]
  }
}
```

### No Quizzes Response (200 OK)
```json
{
  "success": true,
  "message": "No quizzes found in this session",
  "data": {
    "sessionId": "uuid",
    "sessionTitle": "Session Title",
    "totalQuizzes": 0,
    "participants": []
  }
}
```

## Response Fields Explanation

### Summary Object
- `totalQuizzes`: Total number of quizzes in the session
- `totalParticipants`: Total number of participants (invited + joined users)
- `participantsWithAttempts`: Number of participants who have attempted at least one quiz
- `averageParticipationRate`: Average participation rate across all participants (%)
- `highestScore`: Highest total score achieved by any participant
- `averageScore`: Average total score across all participants

### Participant Object
- `rank`: Participant's ranking based on total score (1 = highest)
- `userId`: Unique identifier of the participant
- `userName`: Full name of the participant
- `userEmail`: Email address of the participant
- `totalAttempts`: Total number of quiz attempts across all quizzes
- `totalScore`: Sum of best scores from all quizzes
- `averageScore`: Average score across completed quizzes
- `quizzesCompleted`: Number of quizzes the participant has attempted
- `quizzesPassed`: Number of quizzes the participant has passed
- `participationRate`: Percentage of session quizzes completed by this participant
- `quizResults`: Array of individual quiz performance details

### Quiz Result Object
- `quizId`: Unique identifier of the quiz
- `quizTitle`: Title of the quiz
- `attempts`: Number of attempts made by the participant for this quiz
- `bestScore`: Highest score achieved by the participant for this quiz
- `latestScore`: Most recent score achieved by the participant for this quiz
- `totalMarks`: Maximum possible score for the quiz
- `passingScore`: Minimum score required to pass the quiz
- `passed`: Boolean indicating if the participant passed the quiz (based on best score)

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token is required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to view this session's quiz scores"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Session not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid session ID"
}
```

## Example Usage

### cURL
```bash
curl -X GET \
  "https://api.example.com/api/sessions/123e4567-e89b-12d3-a456-426614174000/quiz-scoring" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

### JavaScript (Axios)
```javascript
const response = await axios.get(
  `/api/sessions/${sessionId}/quiz-scoring`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const { summary, participants } = response.data.data;
console.log(`Session has ${summary.totalQuizzes} quizzes with ${summary.totalParticipants} participants`);
```

## Use Cases
1. **Session Analytics**: Get comprehensive performance overview for a session
2. **Leaderboard Display**: Show ranked participants with detailed scoring
3. **Progress Tracking**: Monitor individual participant progress across multiple quizzes
4. **Performance Reports**: Generate detailed reports for educators/administrators
5. **Participation Monitoring**: Track which participants are actively engaging with quizzes

## Notes
- Participants are ranked by total score (sum of best scores from all quizzes)
- Only users with appropriate permissions can access the data
- The endpoint includes both participants who have joined the session and invited users
- Best scores are used for ranking and total score calculations
- Participation rate is calculated as (quizzes completed / total quizzes) × 100 