# Data Model And Types

## Source Of Truth

Primary schema file: [prisma/schema.prisma](/home/ronit/Documents/Projects/joining_dots_backend/prisma/schema.prisma)

## Identity Types

### `User`

Main fields:

- `id`
- `name`
- `email`
- `password`
- `profilePhoto`
- `role`
- `emailVerified`
- `phoneNumber`
- `companyPosition`
- `department`
- `isActive`
- `belt`
- `xpPoints`

### `Role`

- `ADMIN`
- `USER`

### `Belt`

- `WHITE`
- `YELLOW`
- `ORANGE`
- `GREEN`
- `BROWN`
- `BLACK`

## Session Core

### `Session`

Main fields:

- `id`
- `title`
- `description`
- `state`
- `joiningCode`
- `qrCode`
- `startTime`
- `endTime`
- `expiryDate`
- `maxParticipants`
- `allowGuests`
- `isActive`
- `createdById`

Relations:

- `participants`
- `invited`
- `quizzes`
- `polls`
- `content`
- `teams`
- `feedbacks`
- `surveys`
- `organizations`

### `SessionState`

- `UPCOMING`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

## Quiz Types

### `Quiz`

- `id`
- `title`
- `sessionId`
- `timeLimitSeconds`
- `pointsPerQuestion`
- `passingScore`
- `totalMarks`
- `retryQuiz`

### `Question`

- `id`
- `quizId`
- `text`
- `type`
- `imageUrl`
- `options`
- `correctAnswer`
- `order`
- `timeTaken`
- `marks`

### `QuestionType`

- `MULTIPLE_CHOICE`
- `MULTI_CORRECT`
- `TEXT`
- `MATCHING`

### `QuizResponse`

- `id`
- `quizId`
- `userId`
- `score`
- `completedAt`
- `answers`
- `timeTaken`
- `totalScore`

## Poll Types

### `Poll`

- `id`
- `title`
- `question`
- `sessionId`
- `joiningCode`
- `type`
- `isLive`
- `showResults`
- `isPublic`
- `maxVotes`
- `timeLimit`
- `responseLimit`
- `moderationEnabled`
- `autoRefresh`

### `PollQuestion`

- `id`
- `pollId`
- `question`
- `type`
- `order`
- `isActive`

### `PollQuestionOption`

- `id`
- `questionId`
- `text`
- `imageUrl`
- `order`

### `PollOption`

Legacy poll-level option model.

### `PollResponse`

- `id`
- `pollId`
- `questionId`
- `userId`
- `optionId`
- `questionOptionId`
- `textResponse`
- `ranking`
- `scale`
- `anonymous`
- `moderated`
- `weight`

### `PollType`

- `SINGLE_CHOICE`
- `MULTIPLE_CHOICE`
- `WORD_CLOUD`
- `RANKING`
- `SCALE`
- `OPEN_TEXT`
- `Q_AND_A`

## Content Types

### `Content`

- `id`
- `title`
- `url`
- `type`
- `sessionId`

Relations:

- `canView`
- `canEdit`

### `ContentType`

- `IMAGE`
- `PDF`
- `TEXT`
- `VIDEO`
- `DOCUMENT`

## Team And Gamification Types

### `Team`

Older session-based team model.

- `id`
- `name`
- `description`
- `color`
- `sessionId`
- `maxMembers`
- `isActive`

### `TeamMember`

- `id`
- `teamId`
- `userId`
- `role`
- `joinedAt`

### `TeamRole`

- `LEADER`
- `MEMBER`

### `TeamPointAward`

- `id`
- `teamId`
- `awardedById`
- `points`
- `reason`
- `category`

### `IndividualPointAward`

- `id`
- `userId`
- `sessionId`
- `teamId`
- `awardedById`
- `points`
- `reason`
- `category`

## Feedback Types

### `Feedback`

- `id`
- `title`
- `description`
- `sessionId`
- `isActive`
- `isAnonymous`

### `FeedbackQuestion`

- `id`
- `feedbackId`
- `question`
- `type`
- `isRequired`
- `order`

### `FeedbackResponse`

- `id`
- `feedbackId`
- `questionId`
- `userId`
- `rating`
- `textAnswer`
- `isAnonymous`

### `FeedbackType`

- `SMILEY_SCALE`
- `TEXT`

### `SmileyRating`

- `VERY_POOR`
- `POOR`
- `AVERAGE`
- `GOOD`
- `EXCELLENT`

## Organization And Survey Types

### `Organization`

- `id`
- `sessionId`
- `name`
- `description`
- `settings`

### `Department`

- `id`
- `organizationId`
- `name`
- `description`
- `parentDepartmentId`
- `departmentHeadId`

### `SurveyTeam`

Newer team model used by the organization/survey subsystem.

- `id`
- `departmentId`
- `name`
- `description`
- `teamLeadId`

### `UserDepartmentAssignment`

- `id`
- `userId`
- `departmentId`
- `teamId`
- `role`
- `assignedById`
- `assignedAt`

### `Survey`

- `id`
- `sessionId`
- `title`
- `description`
- `createdById`
- `status`
- `startDate`
- `endDate`
- `isAnonymous`
- `allowMultipleResponses`
- `isOptional`
- `settings`

### `SurveyAssignment`

- `id`
- `surveyId`
- `assignedToType`
- `assignedToId`
- `assignedById`
- `deadline`
- `reminderSchedule`

### `SurveyQuestion`

- `id`
- `surveyId`
- `questionText`
- `questionType`
- `surveyType`
- `options`
- `validationRules`
- `isRequired`
- `orderIndex`

### `SurveyResponse`

Stores one user submission for a survey.

### `SurveyQuestionResponse`

Stores per-question answers inside a survey response.

## TypeScript-Specific Request And DTO Types

### `Express.Request.user`

Extended in [src/types/express/index.d.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/types/express/index.d.ts)

### `Express.Request.content`

Attached by content middleware for downstream handlers.

### Survey DTOs

Defined in [src/types/survey.types.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/types/survey.types.ts):

- `CreateOrganizationRequest`
- `CreateDepartmentRequest`
- `CreateTeamRequest`
- `AssignUserToDepartmentRequest`
- `BulkUserAssignmentData`
- `CreateSurveyRequest`
- `CreateSurveyQuestionRequest`
- `CreateSurveyAssignmentRequest`
- `SurveyResponseRequest`

