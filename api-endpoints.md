# Joining Dots API Endpoints

## Base URL
```
/api
```

## Authentication

### POST /auth/signup
- **Request**: `{ name, email, password }`
- **Response**: `{ success, message, data: { user, tokens } }`

### POST /auth/login
- **Request**: `{ email, password }`
- **Response**: `{ success, message, data: { user, tokens } }`

### POST /auth/verify-email
- **Request**: `{ token }`
- **Response**: `{ success, message }`

### POST /auth/request-password-reset
- **Request**: `{ email }`
- **Response**: `{ success, message }`

### POST /auth/reset-password
- **Request**: `{ token, password }`
- **Response**: `{ success, message }`

### POST /auth/refresh-token
- **Request**: `{ refreshToken }`
- **Response**: `{ success, data: { accessToken, refreshToken } }`

## Users

### POST /users/create-user (Admin)
- **Request**: `{ name, email, password, phoneNumber?, companyPosition?, department?, profilePhoto? }`
- **Response**: `{ success, message, data: { user } }`

### POST /users/bulk-invite (Admin)
- **Request**: `FormData with file field`
- **Response**: `{ success, message, data: { invitedCount, failedCount, failedEmails } }`

### GET /users (Admin)
- **Response**: `{ success, message, data: { users, pagination } }`

### GET /users/:userId (Admin)
- **Response**: `{ success, message, data: { user } }`

### PUT /users/:userId (Admin)
- **Request**: `{ name?, email?, phoneNumber?, companyPosition?, department?, profilePhoto? }`
- **Response**: `{ success, message, data: { user } }`

### PATCH /users/:userId (Admin)
- **Response**: `{ success, message, data: { user } }`

## Sessions

### POST /sessions (Admin)
- **Description**: Creates a new session. Only accessible to admin users.
- **Request**: `{ title, allowGuests, participants?, startTime?, endTime? }`
- **Response**: `{ success, message, data: { session, invitationsSent } }`
- **Notes**:
  - `title` is required and must be at least 3 characters
  - `participants` is an optional array of email addresses to invite
  - If participants are provided, email invitations will be sent automatically
  - Each session gets a unique joining code generated automatically

### PUT /sessions/:sessionId (Admin)
- **Description**: Updates an existing session. Only accessible to admin users.
- **Request**: `{ startTime?, endTime?, maxParticipants?, allowGuests?, state? }`
- **Response**: `{ success, message, data: { session } }`
- **Notes**:
  - `state` can be one of: 'PENDING', 'UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'
  - All fields are optional - only provided fields will be updated

### POST /sessions/join
- **Description**: Allows a user to join a session using a joining code.
- **Request**: `{ joiningCode }`
- **Response**: `{ success, message, data: { sessionId, session } }`
- **Notes**:
  - Requires authentication
  - The joining code is case-sensitive
  - Users can only join sessions that are in 'PENDING' or 'UPCOMING' state

### PATCH /sessions/:sessionId (Admin)
- **Description**: Toggles a session's active status. Only accessible to admin users.
- **Request**: `{ active: boolean }`
- **Response**: `{ success, message, data: { session } }`
- **Notes**: Used to activate or deactivate a session without deleting it

### POST /sessions/bulk-invite (Admin)
- **Description**: Bulk invite users to a session using a CSV or Excel file. Only accessible to admin users.
- **Request**: `FormData with file field and sessionId`
- **Response**: `{ success, message, data: { summary, sessionId, sessionTitle, results } }`
- **Notes**:
  - The CSV/Excel file should contain a column named 'email' with email addresses
  - Invitations will be sent to all valid email addresses in the file
  - Duplicate emails or emails already invited to the session will be skipped

### GET /sessions
- **Description**: Retrieves all sessions with pagination.
- **Query Parameters**: `page`, `limit`, `state`, `search`
- **Response**: `{ success, message, data: { sessions, pagination } }`
- **Notes**:
  - Requires authentication
  - Regular users can only see sessions they're invited to or participating in
  - Admin users can see all sessions

### GET /sessions/user
- **Description**: Retrieves all sessions that the authenticated user is participating in.
- **Response**: `{ success, message, data: { sessions } }`
- **Notes**: Shows past, current, and upcoming sessions for the user

### GET /sessions/:sessionId
- **Description**: Retrieves detailed information about a specific session.
- **Response**: `{ success, message, data: { session } }`
- **Notes**:
  - Requires authentication
  - Regular users can only access sessions they're invited to or participating in
  - Admin users can access any session
  - Returns complete session details including participants list

## Quizzes

### POST /quizzes (Admin)
- **Description**: Creates a new quiz associated with a session. Only accessible to admin users.
- **Request**: `{ title, sessionId, timeLimitSeconds?, pointsPerQuestion?, passingScore?, totalMarks? }`
- **Response**: `{ success, message, data: { quiz } }`
- **Notes**:
  - `title` and `sessionId` are required
  - `pointsPerQuestion` defines the default points for each question
  - `passingScore` is the minimum percentage required to pass the quiz

### GET /quizzes
- **Description**: Retrieves all quizzes, optionally filtered by session.
- **Query Parameters**: `sessionId`, `page`, `limit`
- **Response**: `{ success, message, data: { quizzes } }`
- **Notes**: Requires authentication

### GET /quizzes/:quizId
- **Description**: Retrieves detailed information about a specific quiz.
- **Response**: `{ success, message, data: { quiz } }`
- **Notes**:
  - Requires authentication
  - Returns quiz details including questions if the user has permission

### POST /quizzes/:quizId/questions (Admin)
- **Description**: Adds multiple questions to an existing quiz. Only accessible to admin users.
- **Request**: `{ questions: [{ text, type, options?, correctAnswer, order, marks? }] }`
- **Response**: `{ success, message, data: { questions } }`
- **Notes**:
  - `type` can be one of: 'MULTIPLE_CHOICE', 'MULTI_CORRECT', 'TEXT', 'MATCHING'
  - `options` is required for MULTIPLE_CHOICE and MULTI_CORRECT types
  - `correctAnswer` format depends on the question type

### POST /quizzes/:quizId/join
- **Description**: Allows a user to join a quiz and receive the questions.
- **Request**: `{}`
- **Response**: `{ success, message, data: { quiz, questions } }`
- **Notes**:
  - Requires authentication
  - Creates a quiz attempt record in the database
  - Returns all quiz questions with options but without correct answers

### POST /quizzes/:quizId/submit
- **Description**: Submits a user's answers to a quiz for grading.
- **Request**: `{ answers: [{ questionId, answer, timeTaken? }] }`
- **Response**: `{ success, message, data: { score, totalMarks, passed, answers } }`
- **Notes**:
  - Requires authentication
  - Automatically grades the answers and calculates the score
  - Records the quiz response in the database

### PUT /quizzes/:quizId (Admin)
- **Description**: Updates an existing quiz. Only accessible to admin users.
- **Request**: `{ title?, timeLimitSeconds?, pointsPerQuestion?, passingScore?, totalMarks? }`
- **Response**: `{ success, message, data: { quiz } }`
- **Notes**: All fields are optional - only provided fields will be updated

### DELETE /quizzes/:quizId (Admin)
- **Description**: Deletes a quiz and all associated questions. Only accessible to admin users.
- **Response**: `{ success, message }`
- **Notes**: This operation cannot be undone

### GET /quizzes/:quizId/results
- **Description**: Retrieves the authenticated user's results for a specific quiz.
- **Response**: `{ success, data: { score, totalMarks, passed, answers } }`
- **Notes**:
  - Requires authentication
  - Returns detailed results including correct answers and explanations

### GET /quizzes/:quizId/leaderboard
- **Description**: Retrieves the leaderboard for a specific quiz.
- **Response**: `{ success, data: [{ userId, userName, score, correctAnswers, totalQuestions, percentage, passed, attemptTime }] }`
- **Notes**:
  - Requires authentication
  - Results are sorted by score in descending order

## Polls

### POST /poll (Admin)
- **Request**: `{ title, sessionId, type, isLive?, showResults?, isPublic?, maxVotes?, timeLimit? }`
- **Response**: `{ success, message, data: { poll } }`

### POST /poll/quick (Admin)
- **Request**: `{ title, question, options }`
- **Response**: `{ success, message, data: { poll } }`

### POST /poll/join
- **Request**: `{ joiningCode }`
- **Response**: `{ success, message, data: { poll } }`

### POST /poll/:pollId/response
- **Request**: `{ questionId, response }`
- **Response**: `{ success, message, data: { response } }`

### GET /poll/:pollId (Admin)
- **Response**: `{ success, message, data: { poll } }`

### POST /poll/question (Admin)
- **Request**: `{ pollId, text, options, type?, isActive? }`
- **Response**: `{ success, message, data: { question } }`

### POST /poll/:pollId/end-question (Admin)
- **Response**: `{ success, message, data: { question } }`

### GET /poll
- **Response**: `{ success, message, data: { polls } }`

## Dashboard

### GET /dashboard
- **Response**:
```json
{
  "success": true,
  "data": {
    "user": { "id", "name", "email", "belt", "xpPoints" },
    "quizScores": [{ "quizId", "quizTitle", "score", "totalMarks", "completedAt" }],
    "courseProgress": { "percentage", "completedSessions", "totalSessions" },
    "dailyStreak": number,
    "highestQuizScore": { "score", "quizTitle" },
    "topPerformers": [{ "userId", "name", "score", "belt" }],
    "upcomingSessions": [{ "id", "title", "description", "startTime", "endTime", "joiningCode" }]
  }
}
```

## Onboarding

### PUT /onboarding/user-details (Admin)
- **Request**: `{ userId, companyPosition?, department? }`
- **Response**: `{ success, message, data: { user } }`

## Health Check

### GET /health
- **Response**: `{ status: "ok", timestamp }`
