# Joining Dots API Documentation

This document provides details for all available API endpoints in the Joining Dots backend.

## Base URL

```
/api
```

## Authentication Endpoints

### Signup

- **URL**: `/auth/signup`
- **Method**: `POST`
- **Request Body**:
  ```typescript
  {
    name: string;            // At least 2 characters
    email: string;           // Valid email format
    password: string;        // At least 8 characters, must contain uppercase, lowercase, and a number
    profilePhoto?: string;   // Optional, valid URL format
  }
  ```
- **Response**:
  ```typescript
  {
    message: string;         // "User registered successfully. Please verify your email."
    user: {
      id: string;
      name: string;
      email: string;
      profilePhoto: string | null;
      role: string;
      emailVerified: boolean;
    };
    accessToken: string;     // JWT access token
    refreshToken: string;    // JWT refresh token
  }
  ```
- **Status Codes**:
  - `201 Created`: User registered successfully
  - `400 Bad Request`: Email already registered
  - `500 Internal Server Error`: Server error

### Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```typescript
  {
    email: string;           // Valid email format
    password: string;        // User's password
  }
  ```
- **Response (Success)**:
  ```typescript
  {
    message: string;         // "Login successful"
    user: {
      id: string;
      name: string;
      email: string;
      profilePhoto: string | null;
      role: string;
      emailVerified: boolean;
    };
    accessToken: string;     // JWT access token
    refreshToken: string;    // JWT refresh token
  }
  ```
- **Response (Email Not Verified)**:
  ```typescript
  {
    message: string;         // "Email not verified. A new verification code has been sent."
    requiresVerification: true;
  }
  ```
- **Status Codes**:
  - `200 OK`: Login successful
  - `401 Unauthorized`: Invalid credentials
  - `403 Forbidden`: Email not verified
  - `500 Internal Server Error`: Server error

### Verify Email

- **URL**: `/auth/verify-email`
- **Method**: `POST`
- **Request Body**:
  ```typescript
  {
    email: string;           // Valid email format
    otp: string;             // 6-digit OTP code
  }
  ```
- **Response**:
  ```typescript
  {
    message: string;         // "Email verified successfully"
    user: {
      id: string;
      name: string;
      email: string;
      profilePhoto: string | null;
      role: string;
      emailVerified: boolean;
    };
  }
  ```
- **Status Codes**:
  - `200 OK`: Email verified successfully
  - `400 Bad Request`: Invalid or expired OTP
  - `500 Internal Server Error`: Server error

### Request Password Reset

- **URL**: `/auth/request-password-reset`
- **Method**: `POST`
- **Request Body**:
  ```typescript
  {
    email: string;           // Valid email format
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;        // true
    message: string;         // "Password reset OTP sent successfully"
  }
  ```
- **Status Codes**:
  - `200 OK`: Password reset OTP sent successfully
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Failed to send password reset email or server error

### Reset Password

- **URL**: `/auth/reset-password`
- **Method**: `POST`
- **Request Body**:
  ```typescript
  {
    email: string;           // Valid email format
    otp: string;             // 6-digit OTP code
    newPassword: string;     // At least 8 characters, must contain uppercase, lowercase, and a number
  }
  ```
- **Response**:
  ```typescript
  {
    status: string;          // "success"
    message: string;         // "Password has been reset successfully"
  }
  ```
- **Status Codes**:
  - `200 OK`: Password reset successfully
  - `400 Bad Request`: Invalid or expired OTP
  - `500 Internal Server Error`: Server error

### Refresh Token

- **URL**: `/auth/refresh-token`
- **Method**: `POST`
- **Request Body**:
  ```typescript
  {
    refreshToken: string;    // Valid refresh token
  }
  ```
- **Response**:
  ```typescript
  {
    message: string;         // "Token refreshed successfully"
    user: {
      id: string;
      name: string;
      email: string;
      profilePhoto: string | null;
      role: string;
      emailVerified: boolean;
    };
    accessToken: string;     // New JWT access token
    refreshToken: string;    // New JWT refresh token
  }
  ```
- **Status Codes**:
  - `200 OK`: Token refreshed successfully
  - `400 Bad Request`: Refresh token is required
  - `401 Unauthorized`: Invalid or expired refresh token
  - `403 Forbidden`: Email not verified
  - `500 Internal Server Error`: Server error

## Health Check

- **URL**: `/health`
- **Method**: `GET`
- **Response**:
  ```typescript
  {
    status: string;          // "ok"
    timestamp: string;       // ISO timestamp
  }
  ```
- **Status Codes**:
  - `200 OK`: Server is running

## Poll Endpoints

### Get All Polls

- **URL**: `/poll`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `sessionId`: ID of the session to get polls from (optional)
  - `isLive`: Filter by live status (true/false, optional)
- **Response**:
  ```typescript
  [
    {
      id: string;
      title: string;
      question: string;
      type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A';
      joiningCode: string;
      isLive: boolean;
      showResults: boolean;
      isPublic: boolean;
      sessionId: string;
      createdAt: string;
      updatedAt: string;
      options: Array<{
        id: string;
        text: string;
        pollId: string;
        imageUrl: string | null;
        order: number;
      }>;
      _count: {
        responses: number;
        participants: number;
      }
    },
    // More polls...
  ]
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `400 Bad Request`: Invalid request
  - `401 Unauthorized`: User not authenticated
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  GET /api/poll?sessionId=session-uuid&isLive=true
  Headers: Authorization: Bearer <access_token>

  // Response (200 OK)
  [
    {
      "id": "poll-uuid-1",
      "title": "Company Culture Poll",
      "question": "How would you rate our company culture?",
      "type": "SCALE",
      "joiningCode": "ABC123",
      "isLive": true,
      "showResults": false,
      "isPublic": true,
      "sessionId": "session-uuid",
      "createdAt": "2023-05-20T14:30:00Z",
      "updatedAt": "2023-05-20T14:30:00Z",
      "options": [],
      "_count": {
        "responses": 15,
        "participants": 20
      }
    }
  ]
  ```

### Join Poll

- **URL**: `/poll/join`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```typescript
  {
    joiningCode: string;     // 6-character alphanumeric code
  }
  ```
- **Response**:
  ```typescript
  {
    // Poll details with questions and options
  }
  ```
- **Status Codes**:
  - `200 OK`: Successfully joined poll
  - `400 Bad Request`: Invalid joining code
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Poll not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  POST /api/poll/join
  Headers: Authorization: Bearer <access_token>
  {
    "joiningCode": "ABC123"
  }
  ```

### Submit Poll Response

- **URL**: `/poll/:pollId/response`
- **Method**: `POST`
- **Authentication**: Required
- **Path Parameters**:
  - `pollId`: ID of the poll to respond to
- **Request Body**:
  ```typescript
  {
    pollId: string;             // Valid UUID
    questionId?: string;        // Optional, for specific question response
    optionId?: string;          // Optional, for option-based responses
    questionOptionId?: string;  // Optional, for question-option responses
    textResponse?: string;      // Optional, for text responses
    ranking?: number;           // Optional, for ranking responses
    scale?: number;             // Optional, for scale responses
    anonymous: boolean;         // Default: false
  }
  ```
- **Response**:
  ```typescript
  {
    message: string;           // "Response submitted successfully"
    // Response details
  }
  ```
- **Status Codes**:
  - `200 OK`: Response submitted successfully
  - `400 Bad Request`: Invalid response data
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to respond to this poll
  - `404 Not Found`: Poll not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  POST /api/poll/poll-uuid-1/response
  Headers: Authorization: Bearer <access_token>
  {
    "pollId": "poll-uuid-1",
    "optionId": "option-uuid-1",
    "anonymous": false
  }
  ```

## Session Endpoints

### Get All Sessions

- **URL**: `/sessions`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Number of items per page (default: 10)
  - `state`: Filter by session state ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  - `isActive`: Filter by active status ('true' or 'false')
- **Access Control**:
  - Admin users: Can see all sessions
  - Regular users: Can only see sessions they are participating in
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    message: string;               // "Sessions retrieved successfully"
    data: {
      sessions: Array<{
        id: string;
        title: string;
        description: string | null;
        state: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
        isActive: boolean;
        joiningCode: string | null;
        startTime: string | null;
        endTime: string | null;
        createdAt: string;
        updatedAt: string;
        createdBy: {
          id: string;
          name: string;
          email: string;
        };
        participantsCount: number;
        participants: Array<{
          id: string;
          name: string;
          email: string;
        }>;
        invitedUsers: Array<{
          id: string;
          name: string;
          email: string;
        }>;
        invitedEmails: string[];
        quizzes: Array<{
          id: string;
          title: string;
          timeLimitSeconds: number | null;
          pointsPerQuestion: number;
          passingScore: number | null;
        }>;
        polls: Array<{
          id: string;
          title: string;
          type: string;
        }>;
        content: Array<{
          id: string;
          title: string;
          type: string;
          url: string | null;
        }>;
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        limit: number;
      };
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  GET /api/sessions?page=1&limit=10&state=UPCOMING&isActive=true
  Headers: Authorization: Bearer <access_token>

  // Response (200 OK)
  {
    "success": true,
    "message": "Sessions retrieved successfully",
    "data": {
      "sessions": [
        {
          "id": "session-uuid-1",
          "title": "JavaScript Fundamentals",
          "description": "Learn the basics of JavaScript",
          "state": "UPCOMING",
          "isActive": true,
          "joiningCode": "ABC123",
          "startTime": "2023-06-15T10:00:00Z",
          "endTime": "2023-06-15T12:00:00Z",
          "createdAt": "2023-06-01T09:00:00Z",
          "updatedAt": "2023-06-01T09:00:00Z",
          "createdBy": {
            "id": "user-uuid-1",
            "name": "Admin User",
            "email": "admin@example.com"
          },
          "participantsCount": 5,
          "participants": [
            {
              "id": "user-uuid-2",
              "name": "John Doe",
              "email": "john@example.com"
            }
          ],
          "invitedUsers": [],
          "invitedEmails": ["invited@example.com"],
          "quizzes": [
            {
              "id": "quiz-uuid-1",
              "title": "JavaScript Quiz",
              "timeLimitSeconds": 1800,
              "pointsPerQuestion": 10,
              "passingScore": 70
            }
          ],
          "polls": [],
          "content": []
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalItems": 1,
        "hasNextPage": false,
        "hasPrevPage": false,
        "limit": 10
      }
    }
  }
  ```

### Get Session By ID

- **URL**: `/sessions/:sessionId`
- **Method**: `GET`
- **Authentication**: Required
- **Path Parameters**:
  - `sessionId`: ID of the session to fetch
- **Access Control**:
  - Admin users: Can access any session
  - Regular users: Can only access sessions they are participating in
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    message: string;               // "Session retrieved successfully"
    data: {
      session: {
        id: string;
        title: string;
        description: string | null;
        state: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
        isActive: boolean;
        joiningCode: string | null;
        startTime: string | null;
        endTime: string | null;
        createdAt: string;
        updatedAt: string;
        createdBy: {
          id: string;
          name: string;
          email: string;
        };
        participants: Array<{
          id: string;
          name: string;
          email: string;
        }>;
        invitedUsers: Array<{
          id: string;
          name: string;
          email: string;
        }>;
        invitedEmails: string[];
        quizzes: Array<{
          id: string;
          title: string;
        }>;
        polls: Array<{
          id: string;
          title: string;
        }>;
        content: Array<{
          id: string;
          title: string;
        }>;
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not a participant in this session
  - `404 Not Found`: Session not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  GET /api/sessions/session-uuid-1
  Headers: Authorization: Bearer <access_token>

  // Response (200 OK)
  {
    "success": true,
    "message": "Session retrieved successfully",
    "data": {
      "session": {
        "id": "session-uuid-1",
        "title": "JavaScript Fundamentals",
        "description": "Learn the basics of JavaScript",
        "state": "UPCOMING",
        "isActive": true,
        "joiningCode": "ABC123",
        "startTime": "2023-06-15T10:00:00Z",
        "endTime": "2023-06-15T12:00:00Z",
        "createdAt": "2023-06-01T09:00:00Z",
        "updatedAt": "2023-06-01T09:00:00Z",
        "createdBy": {
          "id": "user-uuid-1",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "participants": [
          {
            "id": "user-uuid-2",
            "name": "John Doe",
            "email": "john@example.com"
          }
        ],
        "invitedUsers": [],
        "invitedEmails": ["invited@example.com"],
        "quizzes": [
          {
            "id": "quiz-uuid-1",
            "title": "JavaScript Quiz"
          }
        ],
        "polls": [],
        "content": []
      }
    }
  }
  ```

### Join Session

- **URL**: `/sessions/join`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```typescript
  {
    joiningCode: string;     // 6-character session joining code
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;        // true
    message: string;         // "Successfully joined the session" or "Already a participant in this session"
    data: {
      session: {
        id: string;
        title: string;
        state: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
        startTime: string | null;
        endTime: string | null;
        participantsCount: number;
        hasQuizzes: boolean;
        hasPolls: boolean;
        hasContent: boolean;
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Successfully joined session or already a participant
  - `400 Bad Request`: Invalid joining code, session inactive, or session has reached maximum participants
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Session not found
  - `500 Internal Server Error`: Server error
- **Notes**:
  - After joining a session, users can access session details and related quizzes
  - If a user is already a participant, they will receive a success response with a different message
- **Example**:
  ```typescript
  // Request
  POST /api/sessions/join
  Headers: Authorization: Bearer <access_token>
  {
    "joiningCode": "ABC123"
  }

  // Response (200 OK)
  {
    "success": true,
    "message": "Successfully joined the session",
    "data": {
      "session": {
        "id": "session-uuid",
        "title": "Team Meeting",
        "state": "IN_PROGRESS",
        "startTime": "2023-06-01T11:00:00Z",
        "endTime": "2023-06-01T11:00:00Z",
        "participantsCount": 4,
        "hasQuizzes": true,
        "hasPolls": false,
        "hasContent": true
      }
    }
  }
  ```

## Quiz Endpoints

### Get Quizzes

- **URL**: `/quizzes/session`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `sessionId`: ID of the session to get quizzes from
- **Access Control**:
  - Admin users: Can access quizzes from any session
  - Regular users: Can only access quizzes from sessions they are participating in
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    data: Array<{
      id: string;
      title: string;
      sessionId: string;
      timeLimitSeconds: number | null;
      pointsPerQuestion: number;
      passingScore: number | null;
      totalMarks: number | null;
      createdAt: string;
      updatedAt: string;
      questions: Array<{
        id: string;
        text: string;
        type: string;
        order: number;
        marks: number | null;
      }>;
    }>
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `400 Bad Request`: Session ID is required
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not a participant in this session
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  GET /api/quizzes/session?sessionId=session-uuid
  Headers: Authorization: Bearer <access_token>

  // Response (200 OK)
  {
    "success": true,
    "data": [
      {
        "id": "quiz-uuid-1",
        "title": "JavaScript Fundamentals",
        "sessionId": "session-uuid",
        "timeLimitSeconds": 1800,
        "pointsPerQuestion": 10,
        "passingScore": 70,
        "totalMarks": 100,
        "createdAt": "2023-05-20T14:30:00Z",
        "updatedAt": "2023-05-20T14:30:00Z",
        "questions": [
          {
            "id": "question-uuid-1",
            "text": "What is JavaScript?",
            "type": "MULTIPLE_CHOICE",
            "order": 1,
            "marks": 10
          }
        ]
      },
      {
        "id": "quiz-uuid-2",
        "title": "React Basics",
        "sessionId": "session-uuid",
        "timeLimitSeconds": 1200,
        "pointsPerQuestion": 5,
        "passingScore": 60,
        "totalMarks": 50,
        "createdAt": "2023-05-21T10:15:00Z",
        "updatedAt": "2023-05-21T10:15:00Z",
        "questions": []
      }
    ]
  }
  ```

### Get Quiz By ID

- **URL**: `/quizzes/:quizId`
- **Method**: `GET`
- **Authentication**: Required
- **Path Parameters**:
  - `quizId`: ID of the quiz to fetch
- **Access Control**:
  - Admin users: Can access any quiz
  - Regular users: Can access quizzes if they:
    1. Have already submitted a response to the quiz, OR
    2. Are a participant in the session that contains the quiz
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    data: {
      id: string;
      title: string;
      sessionId: string;
      timeLimitSeconds: number | null;
      pointsPerQuestion: number;
      passingScore: number | null;
      totalMarks: number | null;
      createdAt: string;
      updatedAt: string;
      questions: Array<{
        id: string;
        text: string;
        type: string;
        options: string | null;    // Comma-separated options
        correctAnswer: string;
        order: number;
        quizId: string;
        imageUrl: string | null;
        marks: number | null;
        timeTaken: number | null;
        createdAt: string;
        updatedAt: string;
      }>;
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User must be a participant in the session to access quiz details
  - `404 Not Found`: Quiz not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  GET /api/quizzes/quiz-uuid-1
  Headers: Authorization: Bearer <access_token>

  // Response (200 OK)
  {
    "success": true,
    "data": {
      "id": "quiz-uuid-1",
      "title": "JavaScript Fundamentals",
      "sessionId": "session-uuid",
      "timeLimitSeconds": 1800,
      "pointsPerQuestion": 10,
      "passingScore": 70,
      "totalMarks": 100,
      "createdAt": "2023-05-20T14:30:00Z",
      "updatedAt": "2023-05-20T14:30:00Z",
      "questions": [
        {
          "id": "question-uuid-1",
          "text": "What is JavaScript?",
          "type": "MULTIPLE_CHOICE",
          "options": "A programming language,A markup language,A styling language,A database",
          "correctAnswer": "A programming language",
          "order": 1,
          "quizId": "quiz-uuid-1",
          "imageUrl": null,
          "marks": 10,
          "timeTaken": null,
          "createdAt": "2023-05-20T14:30:00Z",
          "updatedAt": "2023-05-20T14:30:00Z"
        }
      ]
    }
  }
  ```

### Add Questions To Quiz

- **URL**: `/quizzes/:quizId/questions`
- **Method**: `POST`
- **Authentication**: Required
- **Path Parameters**:
  - `quizId`: ID of the quiz to add questions to
- **Request Body**:
  ```typescript
  [
    {
      text: string;                // At least 1 character
      type: 'MULTIPLE_CHOICE' | 'MULTI_CORRECT' | 'TEXT' | 'MATCHING';
      options?: string[];          // Optional array of option texts
      correctAnswer: string;       // Valid string
      imageUrl?: string | null;    // Optional URL
      marks?: number;              // Optional, positive integer
      timeTaken?: number;          // Optional, positive number
    }
  ]
  ```
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    message: string;               // "Questions added successfully"
    data: {
      added: number;               // Number of questions added
      skipped: number;             // Number of questions skipped (duplicates)
      skippedQuestions: string[];  // Array of skipped question texts
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Questions added successfully
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Quiz not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  POST /api/quizzes/quiz-uuid-1/questions
  Headers: Authorization: Bearer <access_token>
  [
    {
      "text": "What is a closure in JavaScript?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        "A way to lock variables",
        "A function that remembers its lexical scope",
        "A type of loop",
        "A JavaScript error"
      ],
      "correctAnswer": "A function that remembers its lexical scope",
      "marks": 15
    },
    {
      "text": "What does the 'this' keyword refer to in JavaScript?",
      "type": "TEXT",
      "correctAnswer": "The object it belongs to",
      "marks": 10
    }
  ]

  // Response (200 OK)
  {
    "success": true,
    "message": "Questions added successfully",
    "data": {
      "added": 2,
      "skipped": 0,
      "skippedQuestions": []
    }
  }
  ```

### Join Quiz

- **URL**: `/quizzes/:quizId/join`
- **Method**: `POST`
- **Authentication**: Required
- **Path Parameters**:
  - `quizId`: ID of the quiz to join
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    message: string;               // "Quiz joined successfully"
    data: {
      quiz: {
        // Quiz details
      },
      userResponse: {
        // User's existing response if any
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Successfully joined quiz
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Quiz not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  POST /api/quizzes/quiz-uuid-1/join
  Headers: Authorization: Bearer <access_token>

  // Response (200 OK)
  {
    "success": true,
    "message": "Quiz joined successfully",
    "data": {
      "quiz": {
        "id": "quiz-uuid-1",
        "title": "JavaScript Fundamentals",
        "sessionId": "session-uuid",
        "timeLimitSeconds": 1800,
        "pointsPerQuestion": 10,
        "passingScore": 70,
        "totalMarks": 100,
        "createdAt": "2023-05-20T14:30:00Z",
        "updatedAt": "2023-05-20T14:30:00Z"
      },
      "userResponse": null
    }
  }
  ```

### Submit Quiz Response

- **URL**: `/quizzes/:quizId/submit`
- **Method**: `POST`
- **Authentication**: Required
- **Path Parameters**:
  - `quizId`: ID of the quiz to submit answers for
- **Request Body**:
  ```typescript
  {
    answers: Record<string, string>; // Dictionary of questionId -> answer
    attemptTime: string;            // ISO date string
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    message: string;               // "Quiz submitted successfully"
    data: {
      score: number;               // User's score
      totalQuestions: number;      // Total number of questions
      correctAnswers: number;      // Number of correct answers
      passed: boolean;             // Whether user passed
      details: Array<{
        questionId: string;
        correct: boolean;
        points: number;
        userAnswer: string;
        correctAnswer: string;
      }>;
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Successfully submitted quiz
  - `400 Bad Request`: Invalid submission data
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Quiz not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  POST /api/quizzes/quiz-uuid-1/submit
  Headers: Authorization: Bearer <access_token>
  {
    "answers": {
      "question-uuid-1": "A programming language",
      "question-uuid-2": "A function that remembers its lexical scope"
    },
    "attemptTime": "2023-05-20T15:00:00Z"
  }

  // Response (200 OK)
  {
    "success": true,
    "message": "Quiz submitted successfully",
    "data": {
      "score": 25,
      "totalQuestions": 2,
      "correctAnswers": 2,
      "passed": true,
      "details": [
        {
          "questionId": "question-uuid-1",
          "correct": true,
          "points": 10,
          "userAnswer": "A programming language",
          "correctAnswer": "A programming language"
        },
        {
          "questionId": "question-uuid-2",
          "correct": true,
          "points": 15,
          "userAnswer": "A function that remembers its lexical scope",
          "correctAnswer": "A function that remembers its lexical scope"
        }
      ]
    }
  }
  ```

### Get Quiz Leaderboard

- **URL**: `/quizzes/:quizId/leaderboard`
- **Method**: `GET`
- **Authentication**: Required
- **Path Parameters**:
  - `quizId`: ID of the quiz
- **Response**:
  ```typescript
  {
    success: boolean;            // true
    data: Array<{
      userId: string;
      userName: string;
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      percentage: number;
      passed: boolean;
      attemptTime: string;
    }>
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Quiz not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  GET /api/quizzes/quiz-uuid-1/leaderboard
  Headers: Authorization: Bearer <access_token>

  // Response (200 OK)
  {
    "success": true,
    "data": [
      {
        "userId": "user-uuid-1",
        "userName": "John Doe",
        "score": 95,
        "correctAnswers": 9,
        "totalQuestions": 10,
        "percentage": 95,
        "passed": true,
        "attemptTime": "2023-05-20T15:00:00Z"
      },
      {
        "userId": "user-uuid-2",
        "userName": "Jane Smith",
        "score": 80,
        "correctAnswers": 8,
        "totalQuestions": 10,
        "percentage": 80,
        "passed": true,
        "attemptTime": "2023-05-20T16:30:00Z"
      }
    ]
  }
  ```

## Dashboard Endpoint

### Get Dashboard Data

- **URL**: `/dashboard`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    data: {
      user: {
        id: string;
        name: string;
        email: string;
        belt: string;              // User's belt level (WHITE, YELLOW, ORANGE, etc.)
        xpPoints: number;          // Experience points
      },
      quizScores: Array<{
        quizId: string;
        quizTitle: string;
        score: number;
        totalMarks: number;
        completedAt: string;       // ISO date string
      }>,
      courseProgress: {
        percentage: number;        // Overall completion percentage
        completedSessions: number; // Number of completed sessions
        totalSessions: number;     // Total number of sessions
      },
      dailyStreak: number;         // Number of consecutive days active
      highestQuizScore: {
        score: number;
        quizTitle: string;
      } | null,
      topPerformers: Array<{
        userId: string;
        name: string;
        score: number;
        belt: string;
      }>,
      upcomingSessions: Array<{
        id: string;
        title: string;
        description: string | null;
        startTime: string | null;  // ISO date string
        endTime: string | null;    // ISO date string
        joiningCode: string | null;
      }>
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  GET /api/dashboard
  Headers: Authorization: Bearer <access_token>

  // Response (200 OK)
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid-1",
        "name": "John Doe",
        "email": "john@example.com",
        "belt": "GREEN",
        "xpPoints": 1250
      },
      "quizScores": [
        {
          "quizId": "quiz-uuid-1",
          "quizTitle": "JavaScript Fundamentals",
          "score": 85,
          "totalMarks": 100,
          "completedAt": "2023-06-15T14:30:00Z"
        },
        {
          "quizId": "quiz-uuid-2",
          "quizTitle": "React Basics",
          "score": 92,
          "totalMarks": 100,
          "completedAt": "2023-06-10T11:45:00Z"
        }
      ],
      "courseProgress": {
        "percentage": 65,
        "completedSessions": 13,
        "totalSessions": 20
      },
      "dailyStreak": 5,
      "highestQuizScore": {
        "score": 95,
        "quizTitle": "HTML & CSS"
      },
      "topPerformers": [
        {
          "userId": "user-uuid-2",
          "name": "Jane Smith",
          "score": 1450,
          "belt": "BROWN"
        },
        {
          "userId": "user-uuid-1",
          "name": "John Doe",
          "score": 1250,
          "belt": "GREEN"
        }
      ],
      "upcomingSessions": [
        {
          "id": "session-uuid-1",
          "title": "Advanced JavaScript",
          "description": "Deep dive into advanced JavaScript concepts",
          "startTime": "2023-06-20T10:00:00Z",
          "endTime": "2023-06-20T12:00:00Z",
          "joiningCode": "ABC123"
        }
      ]
    }
  }
  ```

## WebSocket Events

This API uses WebSockets for real-time communication between the server and clients. WebSocket connections are authenticated using JWT tokens.

### Authentication

WebSocket connections require authentication using a JWT token provided as a URL query parameter:

```javascript
// Create WebSocket connection with authentication token in URL query parameter
const token = "your-jwt-token-here"; // Without "Bearer " prefix
const ws = new WebSocket(`${SOCKET_URL}?authorization=${encodeURIComponent(token)}`);

// Or with "Bearer " prefix
const authToken = `Bearer ${token}`;
const ws = new WebSocket(`${SOCKET_URL}?authorization=${encodeURIComponent(authToken)}`);

// Example usage:
ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
};
```

### Events

#### Client-to-Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `join-poll` | Join a specific poll room | `pollId` (string) |
| `leave-poll` | Leave a poll room | `pollId` (string) |
| `poll-response` | Submit a response to an active poll question | `{ pollId, answer, type }` |
| `message` | Alternative JSON format for events | `{ event: 'event-name', data: {} }` |
| `disconnect` | Triggered when client disconnects | None |

#### Server-to-Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `message` | General message event | Various formats based on message type |
| `poll-update` | Updates about poll activity | Various formats based on update type |
| `active-question` | Sent when a new question becomes active | Question data |
| `poll-updated` | General poll update event | `{ action, data }` |
| `question-ended` | Sent when an active question ends | `{ pollId, timestamp, questionId }` |
| `word-cloud-update` | Special event for word cloud responses | `{ pollId, word, userId, timestamp }` |

#### Message Types

The `message` event can contain various types of messages, including:

| Type | Description | Payload |
|------|-------------|---------|
| `participant-count-updated` | Updates participant count for a poll | `{ pollId, count }` |
| `joined-poll` | Confirmation that a client joined a poll | `{ pollId, count, socketId }` |
| `left-poll` | Confirmation that a client left a poll | `{ pollId, count }` |
| `new-response` | Notification of a new poll response | `{ pollId, userId, userName, answer, responseType, timestamp }` |

#### Poll Update Types

The `poll-update` and `poll-updated` events can have various action/type values:

| Action/Type | Description | Payload |
|-------------|-------------|---------|
| `new-question` | A new question has been started | Question data with `startedAt` timestamp |
| `question-results` | Results for a completed question | Results data including response counts |
| `question-ended` | Notification that a question has ended | `{ pollId, timestamp, questionId }` |
| `participant-count-updated` | Updates on number of participants | `{ pollId, count }` |
| `new-response` | A new response has been submitted | Response data |

### Connection Flow

1. Client connects with authentication token
2. Client joins a poll by emitting `join-poll` event with pollId
3. Server confirms join with `joined-poll` message
4. If there's an active question, server sends it via `active-question` event
5. Client can submit responses with `poll-response` event
6. Server broadcasts updates to all poll participants

### Example

```javascript
// Connect to WebSocket server
const token = jwtToken; // Without "Bearer " prefix
const socket = new WebSocket(`${SOCKET_URL}?authorization=${encodeURIComponent(token)}`);

// Handle connection events
socket.onopen = () => {
  console.log('Connected to socket server');

  // Join a poll
  socket.send(JSON.stringify({
    event: 'join-poll',
    data: pollId
  }));
};

// Listen for active questions
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.event === 'active-question') {
    console.log('New active question:', data.data);
    // Display question to user
  } else if (data.event === 'poll-updated') {
    console.log('Poll update:', data.data);
    // Handle different update types
  }
};

// Submit a response
socket.send(JSON.stringify({
  event: 'poll-response',
  data: {
    pollId: 'poll-123',
    answer: 'My answer',
    type: 'MULTIPLE_CHOICE'
  }
}));
```