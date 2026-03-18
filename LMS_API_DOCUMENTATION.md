# LMS API Documentation

## Base
- Base URL prefix: `/api/lms`
- Auth type: `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- JWT required: `Yes` for all LMS endpoints below
- Admin routes: require JWT + admin role

## Standard Success Response Shape
```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

## Standard Error Response Shape
```json
{
  "success": false,
  "message": "...",
  "code": "OPTIONAL_LMS_ERROR_CODE",
  "context": {}
}
```

---

## Admin Authoring APIs

### 1) Create Topic
- Method: `POST /api/lms/topics`
- JWT required: `Yes`
- Admin required: `Yes`

Request body:
```json
{
  "title": "Leadership Skills",
  "description": "Build leadership fundamentals",
  "slug": "leadership-skills",
  "isPublished": false,
  "position": 1,
  "estimatedDurationMinutes": 180
}
```

Response example:
```json
{
  "success": true,
  "message": "LMS topic created successfully",
  "data": {
    "topic": {
      "id": "topic_uuid",
      "title": "Leadership Skills",
      "isPublished": false
    }
  }
}
```

### 2) List Topics
- Method: `GET /api/lms/topics?isPublished=true&includeInactive=false`
- JWT required: `Yes`
- Admin required: `Yes`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS topics fetched successfully",
  "data": {
    "topics": []
  }
}
```

### 3) Get Topic By ID
- Method: `GET /api/lms/topics/:topicId`
- JWT required: `Yes`
- Admin required: `Yes`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS topic fetched successfully",
  "data": {
    "topic": {
      "id": "topic_uuid",
      "levels": []
    }
  }
}
```

### 4) Update Topic
- Method: `PUT /api/lms/topics/:topicId`
- JWT required: `Yes`
- Admin required: `Yes`

Request body (partial):
```json
{
  "title": "Leadership Advanced",
  "isActive": true,
  "position": 2
}
```

Response example:
```json
{
  "success": true,
  "message": "LMS topic updated successfully",
  "data": {
    "topic": {
      "id": "topic_uuid",
      "title": "Leadership Advanced"
    }
  }
}
```

### 5) Delete Topic
- Method: `DELETE /api/lms/topics/:topicId`
- JWT required: `Yes`
- Admin required: `Yes`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS topic deleted successfully",
  "data": {
    "id": "topic_uuid"
  }
}
```

### 6) Publish / Unpublish Topic
- Method: `POST /api/lms/topics/:topicId/publish`
- Method: `POST /api/lms/topics/:topicId/unpublish`
- JWT required: `Yes`
- Admin required: `Yes`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS topic published successfully",
  "data": {
    "topic": {
      "id": "topic_uuid",
      "isPublished": true
    }
  }
}
```

### 7) Create Level
- Method: `POST /api/lms/topics/:topicId/levels`
- JWT required: `Yes`
- Admin required: `Yes`

Request body:
```json
{
  "title": "Level 1",
  "description": "Introduction",
  "position": 1,
  "isPublished": true,
  "requireVideoCompletion": true,
  "minVideoWatchPercent": 80,
  "requireQuizPass": true,
  "quizPassingPercent": 70,
  "xpOnCompletion": 25
}
```

Response example:
```json
{
  "success": true,
  "message": "LMS level created successfully",
  "data": {
    "level": {
      "id": "level_uuid",
      "topicId": "topic_uuid",
      "position": 1
    }
  }
}
```

### 8) Update / Delete Level
- Method: `PUT /api/lms/levels/:levelId`
- Method: `DELETE /api/lms/levels/:levelId`
- JWT required: `Yes`
- Admin required: `Yes`

Update request body (partial):
```json
{
  "title": "Level 1 Updated",
  "position": 2,
  "isPublished": true
}
```

Delete response example:
```json
{
  "success": true,
  "message": "LMS level deleted successfully",
  "data": {
    "id": "level_uuid"
  }
}
```

### 9) Add Video Content
- Method: `POST /api/lms/levels/:levelId/content/video`
- JWT required: `Yes`
- Admin required: `Yes`

Request body:
```json
{
  "title": "Leadership Intro Video",
  "description": "Watch this first",
  "isRequired": true,
  "videoSourceType": "EXTERNAL_LINK",
  "externalUrl": "https://example.com/video",
  "videoDurationSeconds": 600,
  "position": 1
}
```

Response example:
```json
{
  "success": true,
  "message": "LMS video content created successfully",
  "data": {
    "content": {
      "id": "content_uuid",
      "type": "VIDEO",
      "position": 1
    }
  }
}
```

### 10) Add Reading Content
- Method: `POST /api/lms/levels/:levelId/content/reading`
- JWT required: `Yes`
- Admin required: `Yes`

Request body:
```json
{
  "title": "Leadership Reading",
  "description": "Read this PDF",
  "attachmentUrl": "https://example.com/reading.pdf",
  "isRequired": false,
  "position": 2
}
```

Response example:
```json
{
  "success": true,
  "message": "LMS reading content created successfully",
  "data": {
    "content": {
      "id": "content_uuid",
      "type": "READING",
      "position": 2
    }
  }
}
```

### 11) Question CRUD
- Create: `POST /api/lms/levels/:levelId/questions`
- Update: `PUT /api/lms/questions/:questionId`
- Delete: `DELETE /api/lms/questions/:questionId`
- JWT required: `Yes`
- Admin required: `Yes`

Create request body:
```json
{
  "questions": [
    {
      "questionText": "What is leadership?",
      "type": "SINGLE_CHOICE",
      "position": 1,
      "points": 1,
      "options": [
        { "optionText": "Guiding people", "position": 1, "isCorrect": true },
        { "optionText": "Ignoring team", "position": 2, "isCorrect": false }
      ]
    }
  ]
}
```

Create response example:
```json
{
  "success": true,
  "message": "LMS questions created successfully",
  "data": {
    "questions": []
  }
}
```

---

## Learner Runtime APIs

### 12) Get My Topics / Topic / Level
- `GET /api/lms/me/topics`
- `GET /api/lms/me/topics/:topicId`
- `GET /api/lms/me/levels/:levelId`
- JWT required: `Yes`
- Admin required: `No`
- Request body: `None`

Level response example:
```json
{
  "success": true,
  "message": "LMS learner level fetched successfully",
  "data": {
    "level": {
      "id": "level_uuid",
      "contents": [],
      "questions": []
    }
  }
}
```

### 13) Update Video Progress
- Method: `POST /api/lms/me/levels/:levelId/video-progress`
- JWT required: `Yes`
- Admin required: `No`

Request body:
```json
{
  "contentId": "content_uuid",
  "eventType": "PROGRESS",
  "watchSeconds": 30,
  "videoPositionSeconds": 120,
  "watchPercent": 20
}
```

Response example:
```json
{
  "success": true,
  "message": "LMS video progress updated successfully",
  "data": {
    "event": { "id": "event_uuid" },
    "progress": { "watchPercent": 20 }
  }
}
```

### 14) Submit Level Attempt
- Method: `POST /api/lms/me/levels/:levelId/attempts`
- JWT required: `Yes`
- Admin required: `No`

Request body:
```json
{
  "answers": [
    {
      "questionId": "question_uuid",
      "selectedOptionIds": ["option_uuid"]
    }
  ],
  "timeSpentSeconds": 180
}
```

Response example:
```json
{
  "success": true,
  "message": "LMS level attempt submitted successfully",
  "data": {
    "attempt": { "id": "attempt_uuid", "status": "PASSED" },
    "summary": { "passed": true, "scorePercent": 80 }
  }
}
```

### 15) Complete Level (Unlock Engine)
- Method: `POST /api/lms/me/levels/:levelId/complete`
- JWT required: `Yes`
- Admin required: `No`

Request body:
```json
{
  "force": false
}
```

Response example:
```json
{
  "success": true,
  "message": "LMS level completion evaluated successfully",
  "data": {
    "completion": { "status": "COMPLETED" },
    "nextLevelId": "next_level_uuid",
    "topicProgress": { "completionPercent": 50 }
  }
}
```

### 16) Get My Progress
- Method: `GET /api/lms/me/progress`
- JWT required: `Yes`
- Admin required: `No`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS learner progress fetched successfully",
  "data": {
    "topics": [],
    "levels": []
  }
}
```

---

## Gamification APIs

### 17) Global Leaderboard
- Method: `GET /api/lms/leaderboard/global?limit=50`
- JWT required: `Yes`
- Admin required: `No`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS global leaderboard fetched successfully",
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "lmsXp": 120,
        "user": { "id": "user_uuid", "name": "John" }
      }
    ]
  }
}
```

### 18) Topic Leaderboard
- Method: `GET /api/lms/leaderboard/topics/:topicId?limit=50`
- JWT required: `Yes`
- Admin required: `No`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS topic leaderboard fetched successfully",
  "data": {
    "topic": { "id": "topic_uuid", "title": "Leadership Skills" },
    "rankings": []
  }
}
```

---

## Analytics APIs (Admin)

### 19) Topic Analytics
- Method: `GET /api/lms/analytics/topics/:topicId`
- JWT required: `Yes`
- Admin required: `Yes`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS topic analytics fetched successfully",
  "data": {
    "topic": { "id": "topic_uuid", "title": "Leadership Skills" },
    "summary": {
      "totalLevels": 5,
      "enrolledUsers": 20,
      "completionRate": 40
    },
    "levelBreakdown": []
  }
}
```

### 20) Video Analytics
- Method: `GET /api/lms/analytics/videos/:contentId`
- JWT required: `Yes`
- Admin required: `Yes`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS video analytics fetched successfully",
  "data": {
    "content": { "id": "content_uuid", "title": "Leadership Intro Video" },
    "summary": {
      "uniqueViewers": 10,
      "averageWatchPercent": 62.5
    },
    "viewers": []
  }
}
```

### 21) Level Attempt Analytics (Pass/Fail)
- Method: `GET /api/lms/analytics/levels/:levelId/attempts`
- JWT required: `Yes`
- Admin required: `Yes`
- Request body: `None`

Response example:
```json
{
  "success": true,
  "message": "LMS level attempt analytics fetched successfully",
  "data": {
    "level": { "id": "level_uuid", "title": "Level 1" },
    "summary": {
      "totalAttempts": 50,
      "passAttempts": 35,
      "failAttempts": 15,
      "passRate": 70
    },
    "attempts": []
  }
}
```
