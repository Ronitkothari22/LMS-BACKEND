# Joining Dots Admin API Documentation

This document provides details for all admin-only API endpoints in the Joining Dots backend.

## Base URL

```
/api
```

## User Endpoints

### Create User

- **URL**: `/users/create-user`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    name: string;              // At least 2 characters
    email: string;             // Valid email format
    password: string;          // At least 8 characters
    phoneNumber?: string;      // Optional, must follow E.164 format
    companyPosition?: string;  // Optional, at least 2 characters
    department?: string;       // Optional, at least 2 characters
    profilePhoto?: string;     // Optional URL
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;          // true
    message: string;           // "User created successfully and welcome email sent"
    data: {
      user: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string | null;
        companyPosition: string | null;
        department: string | null;
        profilePhoto: string | null;
        role: string;
        emailVerified: boolean;
        createdAt: string;
      }
    }
  }
  ```
- **Status Codes**:
  - `201 Created`: User created successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `409 Conflict`: Email or phone number already registered
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  POST /api/users/create-user
  Headers: Authorization: Bearer <access_token>
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123",
    "phoneNumber": "+12345678901",
    "companyPosition": "Product Manager",
    "department": "Product"
  }
  
  // Response (201 Created)
  {
    "success": true,
    "message": "User created successfully and welcome email sent",
    "data": {
      "user": {
        "id": "user-uuid",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phoneNumber": "+12345678901",
        "companyPosition": "Product Manager",
        "department": "Product",
        "profilePhoto": null,
        "role": "USER",
        "emailVerified": true,
        "createdAt": "2023-05-20T14:30:00Z"
      }
    }
  }
  ```

### Bulk Invite Users

- **URL**: `/users/bulk-invite`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  file: File  // CSV or Excel file with columns: name, email
  ```
- **Response**:
  ```typescript
  {
    success: boolean;          // true
    data: {
      summary: {
        total: number;
        successful: number;
        failed: number;
        skipped: number;
      },
      results: Array<{
        email: string;
        name: string;
        status: 'success' | 'failed' | 'skipped';
        error?: string;
      }>
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Invitations processed
  - `400 Bad Request`: Invalid file format or missing file
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  POST /api/users/bulk-invite
  Headers: Authorization: Bearer <access_token>
  Content-Type: multipart/form-data
  
  // Form data:
  // file: [CSV or Excel file]
  
  // Response (200 OK)
  {
    "success": true,
    "data": {
      "summary": {
        "total": 3,
        "successful": 2,
        "failed": 0,
        "skipped": 1
      },
      "results": [
        {
          "email": "user1@example.com",
          "name": "User One",
          "status": "success"
        },
        {
          "email": "user2@example.com",
          "name": "User Two",
          "status": "success"
        },
        {
          "email": "existing@example.com",
          "name": "Existing User",
          "status": "skipped",
          "error": "User already exists"
        }
      ]
    }
  }
  ```

### Get All Users

- **URL**: `/users`
- **Method**: `GET`
- **Authentication**: Required (Admin only)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**:
  ```typescript
  {
    success: boolean;          // true
    data: {
      users: Array<{
        id: string;
        name: string;
        email: string;
        phoneNumber: string | null;
        companyPosition: string | null;
        department: string | null;
        profilePhoto: string | null;
        role: string;
        emailVerified: boolean;
        isActive: boolean;
        createdAt: string;
      }>,
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  GET /api/users?page=1&limit=10
  Headers: Authorization: Bearer <access_token>
  
  // Response (200 OK)
  {
    "success": true,
    "data": {
      "users": [
        {
          "id": "user-uuid-1",
          "name": "John Doe",
          "email": "john@example.com",
          "phoneNumber": "+12345678901",
          "companyPosition": "Software Engineer",
          "department": "Engineering",
          "profilePhoto": "https://example.com/photo.jpg",
          "role": "ADMIN",
          "emailVerified": true,
          "isActive": true,
          "createdAt": "2023-05-20T14:30:00Z"
        },
        // More users...
      ],
      "pagination": {
        "total": 25,
        "page": 1,
        "limit": 10,
        "totalPages": 3,
        "hasMore": true
      }
    }
  }
  ```

### Get User By ID

- **URL**: `/users/:userId`
- **Method**: `GET`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `userId`: ID of the user to fetch
- **Response**:
  ```typescript
  {
    success: boolean;          // true
    data: {
      user: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string | null;
        companyPosition: string | null;
        department: string | null;
        profilePhoto: string | null;
        role: string;
        emailVerified: boolean;
        createdAt: string;
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  GET /api/users/user-uuid-1
  Headers: Authorization: Bearer <access_token>
  
  // Response (200 OK)
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid-1",
        "name": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "+12345678901",
        "companyPosition": "Software Engineer",
        "department": "Engineering",
        "profilePhoto": "https://example.com/photo.jpg",
        "role": "ADMIN",
        "emailVerified": true,
        "createdAt": "2023-05-20T14:30:00Z"
      }
    }
  }
  ```

### Update User

- **URL**: `/users/:userId`
- **Method**: `PUT`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `userId`: ID of the user to update
- **Request Body**:
  ```typescript
  {
    name?: string;             // Optional, at least 2 characters
    email?: string;            // Optional, valid email format
    phoneNumber?: string;      // Optional, must follow E.164 format
    companyPosition?: string;  // Optional, at least 2 characters
    department?: string;       // Optional, at least 2 characters
    profilePhoto?: string;     // Optional, valid URL format
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;          // true
    data: {
      user: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string | null;
        companyPosition: string | null;
        department: string | null;
        profilePhoto: string | null;
        role: string;
        emailVerified: boolean;
        createdAt: string;
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: User updated successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: User not found
  - `409 Conflict`: Email already in use
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  PUT /api/users/user-uuid-1
  Headers: Authorization: Bearer <access_token>
  {
    "name": "John Smith",
    "department": "Product Engineering"
  }
  
  // Response (200 OK)
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid-1",
        "name": "John Smith",
        "email": "john@example.com",
        "phoneNumber": "+12345678901",
        "companyPosition": "Software Engineer",
        "department": "Product Engineering",
        "profilePhoto": "https://example.com/photo.jpg",
        "role": "ADMIN",
        "emailVerified": true,
        "createdAt": "2023-05-20T14:30:00Z"
      }
    }
  }
  ```

### Toggle User Active Status

- **URL**: `/users/:userId`
- **Method**: `PATCH`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `userId`: ID of the user to toggle active status
- **Response**:
  ```typescript
  {
    success: boolean;          // true
    data: {
      user: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string | null;
        companyPosition: string | null;
        department: string | null;
        profilePhoto: string | null;
        role: string;
        emailVerified: boolean;
        isActive: boolean;
        createdAt: string;
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: User status toggled successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  PATCH /api/users/user-uuid-1
  Headers: Authorization: Bearer <access_token>
  
  // Response (200 OK)
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid-1",
        "name": "John Smith",
        "email": "john@example.com",
        "phoneNumber": "+12345678901",
        "companyPosition": "Software Engineer",
        "department": "Product Engineering",
        "profilePhoto": "https://example.com/photo.jpg",
        "role": "ADMIN",
        "emailVerified": true,
        "isActive": false,  // Was toggled from true to false
        "createdAt": "2023-05-20T14:30:00Z"
      }
    }
  }
  ```

## Onboarding Endpoints

### Update User Details

- **URL**: `/onboarding/user-details`
- **Method**: `PUT`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    companyPosition?: string;  // Optional, at least 2 characters
    department?: string;       // Optional, at least 2 characters
    phoneNumber?: string;      // Optional, must follow E.164 format (e.g., +123456789)
  }
  ```
- **Response**:
  ```typescript
  {
    message: string;           // "User details updated successfully"
    user: {
      id: string;
      name: string;
      email: string;
      profilePhoto: string | null;
      companyPosition: string | null;
      department: string | null;
      phoneNumber: string | null;
      role: string;
      emailVerified: boolean;
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: User details updated successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  PUT /api/onboarding/user-details
  Headers: Authorization: Bearer <access_token>
  {
    "companyPosition": "Software Engineer",
    "department": "Engineering",
    "phoneNumber": "+12345678901"
  }
  
  // Response (200 OK)
  {
    "message": "User details updated successfully",
    "user": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePhoto": "https://example.com/photo.jpg",
      "companyPosition": "Software Engineer",
      "department": "Engineering",
      "phoneNumber": "+12345678901",
      "role": "ADMIN",
      "emailVerified": true
    }
  }
  ```

## Poll Endpoints (Admin Only)

### Get Poll By ID

- **URL**: `/poll/:pollId`
- **Method**: `GET`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `pollId`: ID of the poll to fetch
- **Response**:
  ```typescript
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
    participants: Array<{
      id: string;
      name: string;
    }>;
    _count: {
      responses: number;
      participants: number;
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to view this poll
  - `404 Not Found`: Poll not found
  - `500 Internal Server Error`: Server error

### Quick Create Poll

- **URL**: `/poll/create`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    title: string;           // At least 1 character
    sessionId: string;       // Valid UUID
    isPublic: boolean;       // Default: false
  }
  ```
- **Response**:
  ```typescript
  {
    pollId: string;
    title: string;
    joiningCode: string;     // 6-character alphanumeric code
  }
  ```
- **Status Codes**:
  - `201 Created`: Poll created successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to create polls in this session
  - `404 Not Found`: Session not found or inactive
  - `400 Bad Request`: Invalid request
  - `500 Internal Server Error`: Server error

### Create Standalone Poll (New)

- **URL**: `/poll/standalone`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Description**: Create a poll without requiring a session. This allows admins to create standalone polls that can be accessed independently.
- **Request Body**:
  ```typescript
  {
    title: string;           // At least 1 character
    type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A'; // Default: 'SINGLE_CHOICE'
    isLive?: boolean;        // Default: false
    showResults?: boolean;   // Default: false
    isPublic?: boolean;      // Default: true
    maxVotes?: number;       // Optional
    timeLimit?: number;      // Optional, in seconds
    question?: string;       // Optional, for backward compatibility
    questions?: Array<{      // Optional, for multiple questions
      question: string;
      type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A';
      order: number;
      options?: Array<{
        text: string;
        imageUrl?: string;
        order: number;
      }>;
    }>;
    options?: Array<{        // Optional, for backward compatibility
      text: string;
      imageUrl?: string;
      order: number;
    }>;
  }
  ```
- **Response**:
  ```typescript
  {
    id: string;
    title: string;
    question: string;
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A';
    joiningCode: string;     // 6-character alphanumeric code
    isLive: boolean;
    showResults: boolean;
    isPublic: boolean;
    sessionId: null;         // Always null for standalone polls
    createdAt: string;
    updatedAt: string;
    options: Array<{
      id: string;
      text: string;
      pollId: string;
      imageUrl: string | null;
      order: number;
    }>;
    questions: Array<{       // Created questions
      id: string;
      question: string;
      type: string;
      order: number;
      options: Array<{
        id: string;
        text: string;
        imageUrl: string | null;
        order: number;
      }>;
    }>;
    previewUrl: string;      // URL to preview the poll
    joinUrl: string;         // URL to join the poll directly
  }
  ```
- **Status Codes**:
  - `201 Created`: Poll created successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `400 Bad Request`: Invalid request data
  - `500 Internal Server Error`: Server error
- **Example**:
  ```typescript
  // Request
  POST /api/poll/standalone
  Headers: Authorization: Bearer <admin_access_token>
  {
    "title": "Quick Feedback Poll",
    "type": "WORD_CLOUD",
    "isPublic": true,
    "question": "What's your favorite feature?",
    "timeLimit": 60
  }
  
  // Response (201 Created)
  {
    "id": "poll-uuid",
    "title": "Quick Feedback Poll",
    "question": "What's your favorite feature?",
    "type": "WORD_CLOUD",
    "joiningCode": "ABC123",
    "isLive": false,
    "showResults": false,
    "isPublic": true,
    "sessionId": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "options": [],
    "questions": [...],
    "previewUrl": "/polls/poll-uuid/preview",
    "joinUrl": "/polls/join/ABC123"
  }
  ```

### Create Poll

- **URL**: `/poll`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    title: string;           // At least 1 character
    sessionId: string;       // Valid UUID
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A';
    isLive: boolean;         // Default: false
    showResults: boolean;    // Default: false
    isPublic: boolean;       // Default: false
    maxVotes?: number;       // Optional
    timeLimit?: number;      // Optional, in seconds
    question?: string;       // Optional, for backward compatibility
    questions?: Array<{      // Optional, for multiple questions
      question: string;
      type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A';
      order: number;
      options?: Array<{
        text: string;
        imageUrl?: string;
        order: number;
      }>;
    }>;
    options?: Array<{        // Optional, for backward compatibility
      text: string;
      imageUrl?: string;
      order: number;
    }>;
  }
  ```
- **Response**:
  ```typescript
  {
    // Full poll object with created questions and options
  }
  ```
- **Status Codes**:
  - `201 Created`: Poll created successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to create polls in this session
  - `404 Not Found`: Session not found
  - `400 Bad Request`: Invalid request
  - `500 Internal Server Error`: Server error

### Add Poll Question

- **URL**: `/poll/question`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    pollId: string;           // Valid UUID
    question: string;         // At least 1 character
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A';
    order: number;            // Default: 0
    timeLimit?: number;       // Optional, in seconds
    options?: Array<{
      text: string;           // At least 1 character
      imageUrl?: string;      // Optional
      order: number;
    }>;
  }
  ```
- **Response**:
  ```typescript
  {
    // Created question details
  }
  ```
- **Status Codes**:
  - `201 Created`: Question added successfully
  - `400 Bad Request`: Invalid question data
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to add questions to this poll
  - `404 Not Found`: Poll not found
  - `500 Internal Server Error`: Server error

### End Poll Question

- **URL**: `/poll/:pollId/end-question`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `pollId`: ID of the poll
- **Response**:
  ```typescript
  {
    message: string;          // "Poll question ended and results visible"
    // Updated poll details
  }
  ```
- **Status Codes**:
  - `200 OK`: Poll question ended successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to end this poll
  - `404 Not Found`: Poll not found
  - `500 Internal Server Error`: Server error

## Session Endpoints (Admin Only)

### Create Session

- **URL**: `/sessions`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    title: string;           // At least 3 characters
    allowGuests: boolean;    // Default: false
    participants?: string[]; // Optional array of email addresses
    startTime?: string;      // Optional ISO datetime string
    endTime?: string;        // Optional ISO datetime string
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;        // true
    message: string;         // "Session created successfully. Invitations are being sent."
    data: {
      session: {
        id: string;
        title: string;
        joiningCode: string; // 6-character code for joining
        allowGuests: boolean;
        startTime: string | null;
        endTime: string | null;
        state: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
        createdAt: string;
        createdBy: {
          name: string;
          email: string;
        };
        registeredInvitees: string[];
        unregisteredInvitees: string[];
        allInvitedEmails: string[];
      },
      invitationsSent: number;
    }
  }
  ```
- **Status Codes**:
  - `201 Created`: Session created successfully
  - `400 Bad Request`: Invalid request data
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `500 Internal Server Error`: Server error

### Update Session

- **URL**: `/sessions/:sessionId`
- **Method**: `PUT`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `sessionId`: ID of the session to update
- **Request Body**:
  ```typescript
  {
    startTime?: string;      // Optional ISO datetime string
    endTime?: string;        // Optional ISO datetime string
    maxParticipants?: number; // Optional positive integer
    allowGuests?: boolean;   // Optional
    state?: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'; // Optional
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;        // true
    message: string;         // "Session updated successfully"
    data: {
      session: {
        id: string;
        title: string;
        startTime: string | null;
        endTime: string | null;
        maxParticipants: number | null;
        allowGuests: boolean;
        state: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
        createdBy: {
          name: string;
          email: string;
        }
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Session updated successfully
  - `400 Bad Request`: Invalid request data
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Session not found
  - `500 Internal Server Error`: Server error

### Toggle Session Status

- **URL**: `/sessions/:sessionId`
- **Method**: `PATCH`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `sessionId`: ID of the session to toggle status
- **Response**:
  ```typescript
  {
    success: boolean;        // true
    message: string;         // "Session activated/deactivated successfully"
    data: {
      session: {
        id: string;
        title: string;
        isActive: boolean;
        state: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
        updatedAt: string;
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Session status toggled successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Session not found
  - `500 Internal Server Error`: Server error

### Get All Sessions

- **URL**: `/sessions`
- **Method**: `GET`
- **Authentication**: Required (Admin only)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `state`: Filter by session state (optional)
  - `isActive`: Filter by active status (true/false, optional)
- **Response**:
  ```typescript
  {
    success: boolean;        // true
    message: string;         // "Sessions retrieved successfully"
    data: {
      sessions: Array<{
        id: string;
        title: string;
        state: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
        isActive: boolean;
        joiningCode: string;
        startTime: string | null;
        endTime: string | null;
        createdAt: string;
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
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        limit: number;
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `400 Bad Request`: Invalid query parameters
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `500 Internal Server Error`: Server error

### Get Session By ID

- **URL**: `/sessions/:sessionId`
- **Method**: `GET`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `sessionId`: ID of the session to fetch
- **Response**:
  ```typescript
  {
    success: boolean;        // true
    message: string;         // "Session details retrieved successfully"
    data: {
      session: {
        id: string;
        title: string;
        description: string | null;
        state: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
        isActive: boolean;
        joiningCode: string;
        startTime: string | null;
        endTime: string | null;
        expiryDate: string | null;
        maxParticipants: number | null;
        allowGuests: boolean;
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
          companyPosition: string | null;
          department: string | null;
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
          url: string;
        }>;
      }
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Session not found
  - `500 Internal Server Error`: Server error

## Quiz Endpoints (Admin Only)

### Create Quiz

- **URL**: `/quizzes`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    title: string;                 // At least 1 character
    sessionId: string;             // Valid session ID
    timeLimitSeconds?: number;     // Optional, in seconds
    pointsPerQuestion: number;     // At least 1
    passingScore?: number;         // Optional, positive number
    totalMarks?: number;           // Optional, positive integer
    questions?: Array<{
      text: string;                // At least 1 character
      type: 'MULTIPLE_CHOICE' | 'MULTI_CORRECT' | 'TEXT' | 'MATCHING';
      options?: string[];          // Optional array of option texts
      correctAnswer: string;       // Valid string
      order?: number;              // Optional
      imageUrl?: string | null;    // Optional URL
      marks?: number;              // Optional, positive integer
      timeTaken?: number;          // Optional, positive number
    }>;
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    message: string;               // "Quiz created successfully"
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
    }
  }
  ```
- **Status Codes**:
  - `201 Created`: Quiz created successfully
  - `400 Bad Request`: Invalid request data
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Session not found
  - `409 Conflict`: Quiz with same title already exists in session
  - `500 Internal Server Error`: Server error

### Update Quiz

- **URL**: `/quizzes/:quizId`
- **Method**: `PUT`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `quizId`: ID of the quiz to update
- **Request Body**:
  ```typescript
  {
    title?: string;               // At least 1 character
    timeLimitSeconds?: number;    // Positive number
    pointsPerQuestion?: number;   // Positive number
    passingScore?: number;        // Positive number
    totalMarks?: number;          // Positive integer
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;             // true
    message: string;              // "Quiz updated successfully"
    data: {
      // Updated quiz details
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Quiz updated successfully
  - `400 Bad Request`: Invalid update data
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Quiz not found
  - `500 Internal Server Error`: Server error

### Delete Quiz

- **URL**: `/quizzes/:quizId`
- **Method**: `DELETE`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `quizId`: ID of the quiz to delete
- **Response**:
  ```typescript
  {
    success: boolean;             // true
    message: string;              // "Quiz deleted successfully"
  }
  ```
- **Status Codes**:
  - `200 OK`: Quiz deleted successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Quiz not found
  - `500 Internal Server Error`: Server error

### Delete Question

- **URL**: `/quizzes/:quizId/questions/:questionId`
- **Method**: `DELETE`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `quizId`: ID of the quiz
  - `questionId`: ID of the question to delete
- **Response**:
  ```typescript
  {
    success: boolean;             // true
    message: string;              // "Question deleted successfully"
  }
  ```
- **Status Codes**:
  - `200 OK`: Question deleted successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Quiz or question not found
  - `500 Internal Server Error`: Server error

### Update Question

- **URL**: `/quizzes/:quizId/questions/:questionId`
- **Method**: `PUT`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `quizId`: ID of the quiz
  - `questionId`: ID of the question to update
- **Request Body**:
  ```typescript
  {
    text: string;                // At least 1 character
    type: 'MULTIPLE_CHOICE' | 'MULTI_CORRECT' | 'TEXT' | 'MATCHING';
    options?: string[];          // Optional array of option texts
    correctAnswer?: string;      // Optional
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;            // true
    message: string;             // "Question updated successfully"
    data: {
      // Updated question details
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Question updated successfully
  - `400 Bad Request`: Invalid update data
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Quiz or question not found
  - `500 Internal Server Error`: Server error

### Upload Quiz Question Image

- **URL**: `/quizzes/:quizId/upload-image`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Content-Type**: `multipart/form-data`
- **Path Parameters**:
  - `quizId`: ID of the quiz to upload image for
- **Form Data**:
  - `image`: Image file (JPG, PNG, GIF, WebP, etc.) - Max 10MB
- **Request Example**:
  ```bash
  curl -X POST \
    "http://localhost:5000/api/quizzes/quiz-uuid/upload-image" \
    -H "Authorization: Bearer <admin_token>" \
    -F "image=@question-image.jpg"
  ```
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    message: string;               // "Image uploaded successfully"
    data: {
      imageUrl: string;            // Cloudinary URL for the uploaded image
      publicId: string;            // Cloudinary public ID for management
      format: string;              // Image format (jpg, png, etc.)
      size: number;                // File size in bytes
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Image uploaded successfully
  - `400 Bad Request`: No image file provided or invalid file type
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Quiz not found
  - `500 Internal Server Error`: Upload failed

### Upload and Attach Image to Question (Recommended)

- **URL**: `/quizzes/:quizId/questions/:questionId/upload-image`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Content-Type**: `multipart/form-data`
- **Path Parameters**:
  - `quizId`: ID of the quiz
  - `questionId`: ID of the question to attach image to
- **Form Data**:
  - `image`: Image file (JPG, PNG, GIF, WebP, etc.) - Max 10MB
- **Request Example**:
  ```bash
  curl -X POST \
    "http://localhost:5000/api/quizzes/quiz-uuid/questions/question-uuid/upload-image" \
    -H "Authorization: Bearer <admin_token>" \
    -F "image=@question-image.jpg"
  ```
- **Response**:
  ```typescript
  {
    success: boolean;              // true
    message: string;               // "Image uploaded and attached to question successfully"
    data: {
      question: {
        id: string;                // Question ID
        text: string;              // Question text
        type: string;              // Question type
        imageUrl: string;          // Newly uploaded image URL
        options: string;           // Question options
        correctAnswer: string;     // Correct answer
        order: number;             // Question order
        marks: number;             // Question marks
      };
      uploadInfo: {
        publicId: string;          // Cloudinary public ID
        format: string;            // Image format
        size: number;              // File size in bytes
      };
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Image uploaded and attached successfully
  - `400 Bad Request`: No image file provided or invalid file type
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: User is not an admin
  - `404 Not Found`: Quiz or question not found
  - `500 Internal Server Error`: Upload or attachment failed

**Usage Workflow for Quiz Questions with Images:**

**Simple One-Step Process (Recommended):**
```bash
# Upload and attach image in one step
POST /api/quizzes/quiz-uuid/questions/question-uuid/upload-image
# Done! Image is uploaded and attached to the question
```

**Alternative Two-Step Process:**
1. **Upload Image**: Use `/quizzes/:quizId/upload-image` to upload an image and get the URL
2. **Update Question**: Use the returned `imageUrl` in quiz question endpoints

Example complete workflow:
```bash
# Step 1: Upload image
POST /api/quizzes/quiz-uuid/upload-image
# Returns: { data: { imageUrl: "https://cloudinary.com/..." } }

# Step 2: Add question with image
POST /api/quizzes/quiz-uuid/questions
{
  "text": "What is shown in this image?",
  "type": "MULTIPLE_CHOICE",
  "options": ["A cat", "A dog", "A bird", "A fish"],
  "correctAnswer": "A cat",
  "imageUrl": "https://cloudinary.com/...",
  "marks": 10
}
```

## WebSocket Events (Admin)

This API uses WebSockets for real-time communication between the server and admin clients. WebSocket connections are authenticated using JWT tokens.

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

### Admin Events

In addition to the regular WebSocket events documented in the main API docs, admin connections have access to the following events:

#### Server-to-Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `admin-poll-update` | Admin-specific updates about poll activity | Various formats based on update type |
| `session-participant-joined` | Notification when a participant joins a session | `{ sessionId, userId, userName, timestamp }` |
| `session-participant-left` | Notification when a participant leaves a session | `{ sessionId, userId, userName, timestamp }` |

#### Client-to-Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `start-poll-question` | Start a specific poll question | `{ pollId, questionId }` |
| `end-poll-question` | End the currently active question | `{ pollId, questionId }` |
| `show-poll-results` | Show results for a completed question | `{ pollId, questionId, showResults: boolean }` |

### Example Admin Usage

```javascript
// Connect to WebSocket server
const token = adminToken; // Without "Bearer " prefix
const socket = new WebSocket(`${SOCKET_URL}?authorization=${encodeURIComponent(token)}`);

// Handle connection events
socket.onopen = () => {
  console.log('Connected to WebSocket server as admin');
  
  // Start a poll question
  socket.send(JSON.stringify({
    event: 'start-poll-question',
    data: {
      pollId: 'poll-123',
      questionId: 'question-456'
    }
  }));
};

// Listen for admin events
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.event === 'admin-poll-update') {
    console.log('Admin poll update:', data.data);
    // Handle admin-specific poll update
  } else if (data.event === 'session-participant-joined') {
    console.log('New participant joined:', data.data.userName);
    // Update UI with new participant
  }
}; 