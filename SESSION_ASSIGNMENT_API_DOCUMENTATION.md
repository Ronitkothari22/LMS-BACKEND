# Session Assignment API Documentation

This document is for frontend (Admin + User) integration of the Session Assignment module.

## Base Info

- Base path: `/api/sessions`
- Auth: `Authorization: Bearer <token>` required on all endpoints
- Response envelope (success):

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

- Validation error format:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.title",
      "message": "Title must be at least 2 characters"
    }
  ]
}
```

- API error format:

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Admin / Session-Creator Endpoints

## 1) Create Assignment

- Method: `POST`
- URL: `/:sessionId/assignments`

### Path Params

- `sessionId` (uuid)

### Request Body

```json
{
  "title": "Assignment 1",
  "description": "Optional short description",
  "instructions": "Upload your solution files",
  "dueDate": "2026-04-10T18:00:00.000Z",
  "allowLateSubmission": false,
  "maxFileSizeMb": 10,
  "maxFilesPerSubmission": 5,
  "allowedFileTypes": ["pdf", "doc", "docx"],
  "isActive": true
}
```

### Response (201)

```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "assignment": {
      "id": "assignment-uuid",
      "sessionId": "session-uuid",
      "title": "Assignment 1",
      "dueDate": "2026-04-10T18:00:00.000Z",
      "allowLateSubmission": false,
      "maxFileSizeMb": 10,
      "maxFilesPerSubmission": 5,
      "allowedFileTypes": ["pdf", "doc", "docx"],
      "isActive": true,
      "deadlineStatus": "OPEN",
      "canSubmit": true
    }
  }
}
```

---

## 2) List Assignments (Admin View)

- Method: `GET`
- URL: `/:sessionId/assignments`

### Query Params

- `includeInactive` (boolean, optional)
- `page` (number, optional)
- `limit` (number, optional)

### Response (200)

```json
{
  "success": true,
  "message": "Assignments fetched successfully",
  "data": {
    "items": [
      {
        "id": "assignment-uuid",
        "title": "Assignment 1",
        "dueDate": "2026-04-10T18:00:00.000Z",
        "submissionsCount": 12,
        "deadlineStatus": "OPEN",
        "canSubmit": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## 3) Get Assignment By ID (Admin View)

- Method: `GET`
- URL: `/:sessionId/assignments/:assignmentId`

### Response (200)

```json
{
  "success": true,
  "message": "Assignment fetched successfully",
  "data": {
    "assignment": {
      "id": "assignment-uuid",
      "sessionId": "session-uuid",
      "title": "Assignment 1",
      "description": "Optional",
      "instructions": "Optional",
      "dueDate": "2026-04-10T18:00:00.000Z",
      "allowLateSubmission": false,
      "submissionsCount": 12,
      "timelineEventsCount": 40,
      "deadlineStatus": "OPEN",
      "canSubmit": true
    }
  }
}
```

---

## 4) Update Assignment

- Method: `PUT`
- URL: `/:sessionId/assignments/:assignmentId`

### Request Body (any subset, at least one field)

```json
{
  "title": "Assignment 1 - Updated",
  "dueDate": "2026-04-12T18:00:00.000Z",
  "allowLateSubmission": true,
  "maxFileSizeMb": 15,
  "maxFilesPerSubmission": 7,
  "allowedFileTypes": ["pdf", "docx"],
  "isActive": true
}
```

### Response (200)

```json
{
  "success": true,
  "message": "Assignment updated successfully",
  "data": {
    "assignment": {
      "id": "assignment-uuid",
      "title": "Assignment 1 - Updated",
      "allowLateSubmission": true,
      "deadlineStatus": "LATE_ALLOWED",
      "canSubmit": true
    }
  }
}
```

---

## 5) Deactivate Assignment

- Method: `DELETE`
- URL: `/:sessionId/assignments/:assignmentId`

### Response (200)

```json
{
  "success": true,
  "message": "Assignment deactivated successfully",
  "data": {
    "assignment": {
      "id": "assignment-uuid",
      "isActive": false
    }
  }
}
```

---

## 6) List Submissions (Admin View)

- Method: `GET`
- URL: `/:sessionId/assignments/:assignmentId/submissions`

### Query Params

- `filter` (optional): `submitted | late | missing`
- `query` (optional): user name/email search
- `page` (optional)
- `limit` (optional)

### Response (200)

```json
{
  "success": true,
  "message": "Assignment submissions fetched successfully",
  "data": {
    "items": [
      {
        "type": "SUBMITTED",
        "user": {
          "id": "user-uuid",
          "name": "User A",
          "email": "user@example.com"
        },
        "submission": {
          "id": "submission-uuid",
          "isLate": false,
          "submittedAt": "2026-04-05T12:00:00.000Z",
          "version": 1,
          "files": [
            {
              "id": "file-uuid",
              "fileName": "solution.pdf",
              "fileMimeType": "application/pdf",
              "fileSizeBytes": 150000
            }
          ]
        }
      }
    ],
    "summary": {
      "totalParticipants": 30,
      "submittedCount": 20,
      "lateCount": 2,
      "missingCount": 10
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

For `filter=missing`, each item has:

```json
{
  "type": "MISSING",
  "user": {
    "id": "user-uuid",
    "name": "User B",
    "email": "userb@example.com"
  },
  "submission": null
}
```

---

## 7) Download Submission File (Admin View)

- Method: `GET`
- URL: `/:sessionId/assignments/:assignmentId/submissions/:submissionId/files/:fileId/download`

### Response (200)

```json
{
  "success": true,
  "message": "Submission file download URL fetched successfully",
  "data": {
    "file": {
      "id": "file-uuid",
      "fileName": "solution.pdf",
      "fileMimeType": "application/pdf",
      "fileSizeBytes": 150000,
      "url": "https://res.cloudinary.com/..."
    }
  }
}
```

---

## 8) Assignment Timeline (Admin View)

- Method: `GET`
- URL: `/:sessionId/assignments/:assignmentId/timeline`

### Query Params

- `page` (optional)
- `limit` (optional)

### Response (200)

```json
{
  "success": true,
  "message": "Assignment timeline fetched successfully",
  "data": {
    "items": [
      {
        "id": "event-uuid",
        "assignmentId": "assignment-uuid",
        "submissionId": "submission-uuid",
        "actorUserId": "admin-uuid",
        "eventType": "SUBMISSION_DOWNLOADED",
        "eventMeta": {
          "fileId": "file-uuid",
          "fileName": "solution.pdf"
        },
        "createdAt": "2026-04-06T09:00:00.000Z",
        "actorUser": {
          "id": "admin-uuid",
          "name": "Admin A",
          "email": "admin@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Participant Endpoints

## 9) List My Assignments

- Method: `GET`
- URL: `/:sessionId/me/assignments`

### Query Params

- `upcomingOnly` (boolean, optional)
- `page` (optional)
- `limit` (optional)

### Response (200)

```json
{
  "success": true,
  "message": "My assignments fetched successfully",
  "data": {
    "items": [
      {
        "id": "assignment-uuid",
        "title": "Assignment 1",
        "dueDate": "2026-04-10T18:00:00.000Z",
        "deadlineStatus": "OPEN",
        "canSubmit": true,
        "mySubmission": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## 10) Get My Assignment By ID

- Method: `GET`
- URL: `/:sessionId/me/assignments/:assignmentId`

### Response (200)

```json
{
  "success": true,
  "message": "My assignment fetched successfully",
  "data": {
    "assignment": {
      "id": "assignment-uuid",
      "title": "Assignment 1",
      "instructions": "Upload your files",
      "dueDate": "2026-04-10T18:00:00.000Z",
      "deadlineStatus": "OPEN",
      "canSubmit": true,
      "mySubmission": {
        "id": "submission-uuid",
        "submittedAt": "2026-04-05T12:00:00.000Z",
        "isLate": false,
        "version": 1,
        "files": [
          {
            "id": "file-uuid",
            "fileName": "solution.pdf"
          }
        ]
      }
    }
  }
}
```

---

## 11) Submit / Replace My Submission (Multi-file)

- Method: `POST`
- URL: `/:sessionId/me/assignments/:assignmentId/submission`
- Content-Type: `multipart/form-data`

### Form Data

- `files` (required, multiple): file array
- `replaceExisting` (optional, boolean): set `true` to replace old submission
- `fileCount` (optional, number): accepted by validator (informational only)

### Example

- `files`: `solution.pdf`, `appendix.docx`
- `replaceExisting`: `true`

### Response (201)

```json
{
  "success": true,
  "message": "Assignment submitted successfully",
  "data": {
    "submission": {
      "id": "submission-uuid",
      "assignmentId": "assignment-uuid",
      "sessionId": "session-uuid",
      "userId": "user-uuid",
      "submittedAt": "2026-04-05T12:00:00.000Z",
      "isLate": false,
      "version": 2,
      "status": "REPLACED",
      "files": [
        {
          "id": "file-uuid-1",
          "fileName": "solution.pdf",
          "fileMimeType": "application/pdf",
          "fileSizeBytes": 150000,
          "fileUrl": "https://res.cloudinary.com/..."
        },
        {
          "id": "file-uuid-2",
          "fileName": "appendix.docx",
          "fileMimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "fileSizeBytes": 220000,
          "fileUrl": "https://res.cloudinary.com/..."
        }
      ]
    }
  }
}
```

---

## 12) Get My Latest Submission

- Method: `GET`
- URL: `/:sessionId/me/assignments/:assignmentId/submission`

### Response (200)

```json
{
  "success": true,
  "message": "My submission fetched successfully",
  "data": {
    "submission": {
      "id": "submission-uuid",
      "submittedAt": "2026-04-05T12:00:00.000Z",
      "isLate": false,
      "version": 2,
      "status": "REPLACED",
      "files": [
        {
          "id": "file-uuid-1",
          "fileName": "solution.pdf",
          "fileUrl": "https://res.cloudinary.com/..."
        }
      ]
    }
  }
}
```

---

## Important Rules for Frontend

1. Submission allows multiple files in one request (`files` array).
2. Allowed file extensions: `pdf`, `doc`, `docx`.
3. Assignment-specific limits are enforced server-side:
   - max file size per file
   - max files per submission
4. If user already submitted, send `replaceExisting=true` for re-upload.
5. `deadlineStatus` values:
   - `OPEN`: submit allowed
   - `CLOSED`: submit blocked
   - `LATE_ALLOWED`: submit allowed but marked late

---

## Common HTTP Statuses

- `200` OK
- `201` Created
- `400` Validation/business-rule error
- `403` Permission denied
- `404` Not found
- `500` Server error
