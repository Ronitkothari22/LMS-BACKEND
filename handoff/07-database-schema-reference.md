# Database Schema Reference

## Purpose

This file explains the Prisma schema model by model and field by field in plain language.

Primary schema source:

- [prisma/schema.prisma](/home/ronit/Documents/Projects/joining_dots_backend/prisma/schema.prisma)

## Global Notes

- `id`: primary key for the record, generated as UUID
- `createdAt`: when the record was first created
- `updatedAt`: when the record was last updated
- relation fields like `session`, `user`, `questions`, `responses`: object/collection links managed by Prisma
- fields ending in `Id`: foreign keys pointing to another table

## User

Represents a platform user, either admin or participant.

### Fields

- `id`: unique user identifier
- `name`: display name of the user
- `email`: unique login email
- `password`: hashed password
- `profilePhoto`: optional image URL for profile avatar
- `role`: access level, either admin or normal user
- `emailVerified`: whether the user completed OTP/email verification
- `phoneNumber`: optional phone number, unique if present
- `companyPosition`: optional job title or role in company
- `department`: optional free-text department name from older user profile flow
- `isActive`: whether the account is active and allowed to use the platform
- `belt`: gamification rank or level
- `xpPoints`: total experience points earned by the user
- `createdAt`: account creation timestamp
- `updatedAt`: last update timestamp

### Relations

- `sessionsParticipated`: sessions the user joined
- `sessionsInvited`: sessions the user was invited to
- `sessionsCreated`: sessions created by this user
- `quizResponses`: quiz attempts submitted by this user
- `pollResponses`: poll responses submitted by this user
- `participatedPolls`: polls the user joined
- `contentCanView`: content explicitly viewable by this user
- `contentCanEdit`: content explicitly editable by this user
- `activityLogs`: tracked user actions
- `teamMemberships`: old session-team memberships
- `pointAwardsGiven`: team point awards given by this admin
- `individualPointsReceived`: individual points this user received
- `individualPointAwardsGiven`: individual points this admin gave to others
- `feedbackResponses`: feedback answers submitted by this user
- `departmentAssignments`: org/survey department assignments for this user
- `assignmentsMade`: org/survey assignments made by this admin
- `departmentHeadOf`: departments led by this user
- `teamLeadOf`: survey teams led by this user
- `surveysCreated`: surveys created by this user
- `surveyAssignmentsMade`: survey assignments made by this user
- `surveyResponses`: survey submissions by this user

## Role

User role enum.

- `ADMIN`: full admin access
- `USER`: normal participant access

## Belt

Gamification rank enum.

- `WHITE`
- `YELLOW`
- `ORANGE`
- `GREEN`
- `BROWN`
- `BLACK`

## Session

The main business object. Most features are attached to a session.

### Fields

- `id`: unique session identifier
- `title`: session title
- `description`: optional session description
- `state`: lifecycle state of the session
- `invitedEmails`: plain list of invited email addresses, including users not yet registered
- `joiningCode`: unique code participants use to join the session
- `qrCode`: optional QR code URL associated with joining
- `startTime`: optional planned start time
- `endTime`: optional planned end time
- `expiryDate`: optional expiration time for joining code
- `maxParticipants`: optional capacity limit
- `allowGuests`: whether unregistered/uninvited users are allowed
- `isActive`: whether the session is currently active in the system
- `createdById`: foreign key to the admin/creator
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `participants`: users who joined the session
- `invited`: registered users invited to the session
- `createdBy`: user who created the session
- `quizzes`: quizzes inside the session
- `polls`: polls inside the session
- `content`: uploaded content inside the session
- `teams`: old session teams inside the session
- `individualPointAwards`: individual point awards scoped to this session
- `feedbacks`: feedback forms for the session
- `surveys`: surveys for the session
- `organizations`: organizations created under the session

## SessionState

Session lifecycle enum.

- `UPCOMING`: not started yet
- `IN_PROGRESS`: currently active
- `COMPLETED`: finished
- `CANCELLED`: cancelled and no longer active as normal session

## Quiz

Represents one quiz attached to a session.

### Fields

- `id`: unique quiz identifier
- `title`: quiz title
- `sessionId`: owning session
- `timeLimitSeconds`: optional total time limit for the quiz
- `pointsPerQuestion`: default score weight per question
- `passingScore`: minimum score required to pass
- `totalMarks`: maximum possible marks for the quiz
- `retryQuiz`: whether a user can retake quiz after submission
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `session`: owning session
- `questions`: quiz questions
- `responses`: user quiz attempts

## Question

A single quiz question.

### Fields

- `id`: unique question identifier
- `quizId`: owning quiz
- `text`: question prompt text
- `type`: question type enum
- `imageUrl`: optional image attached to question
- `options`: serialized options payload, historically stored as string/JSON string
- `correctAnswer`: correct answer value, format depends on question type
- `order`: display order inside quiz
- `timeTaken`: optional expected or tracked time value used in logic/UI
- `marks`: explicit marks for this question if per-question scoring is used

### Relations

- `quiz`: owning quiz

## QuestionType

Quiz question type enum.

- `MULTIPLE_CHOICE`: one correct option
- `MULTI_CORRECT`: multiple correct options
- `TEXT`: text answer
- `MATCHING`: matching-style answer format

## QuizResponse

Stores one user attempt/submission for a quiz.

### Fields

- `id`: unique response identifier
- `quizId`: quiz attempted
- `userId`: user who attempted quiz
- `score`: raw or partial score value
- `completedAt`: when attempt was finished
- `answers`: serialized answer payload
- `createdAt`: record creation timestamp
- `timeTaken`: total time spent or tracked duration
- `totalScore`: normalized/final score used for leaderboards/results

### Relations

- `quiz`: associated quiz
- `user`: user who submitted the attempt

## Poll

Represents a live poll. Can be session-based or standalone.

### Fields

- `id`: unique poll identifier
- `title`: poll title
- `question`: legacy single-question field kept for backward compatibility
- `sessionId`: owning session if session-based, nullable for standalone poll
- `joiningCode`: code used to join poll
- `type`: default poll type
- `isLive`: whether poll is currently running live
- `showResults`: whether results should be shown to participants
- `isPublic`: whether poll is public/open
- `maxVotes`: optional vote cap per user
- `timeLimit`: optional per-question/per-poll time limit
- `responseLimit`: optional text response length cap
- `moderationEnabled`: whether moderation flow is enabled
- `autoRefresh`: whether clients should auto-refresh results/live state
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `session`: owning session if any
- `questions`: modern multi-question poll records
- `responses`: all responses for this poll
- `options`: legacy poll-level options
- `participants`: users who joined the poll

## PollQuestion

Modern question record inside a poll.

### Fields

- `id`: unique question identifier
- `pollId`: owning poll
- `question`: question text
- `type`: question-specific poll type, can override poll default
- `order`: display order inside poll
- `isActive`: whether this is the currently active question in live mode
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `poll`: owning poll
- `options`: options for this question
- `responses`: responses tied to this question

## PollQuestionOption

Option for a modern poll question.

### Fields

- `id`: unique option identifier
- `questionId`: owning question
- `text`: option label text
- `imageUrl`: optional option image
- `order`: display order

### Relations

- `question`: owning poll question
- `responses`: responses that selected this option

## PollResponse

Stores one submitted response in a poll.

### Fields

- `id`: unique response identifier
- `pollId`: poll this response belongs to
- `questionId`: modern poll question being answered
- `userId`: responding user
- `optionId`: selected legacy poll-level option
- `questionOptionId`: selected modern question option
- `textResponse`: free-text answer for text-based poll types
- `ranking`: ranking value for ranking polls
- `scale`: numeric rating for scale polls
- `anonymous`: whether response should be treated as anonymous
- `moderated`: whether response passed moderation or was marked moderated
- `weight`: weighting used especially for word cloud or repeated aggregation logic
- `createdAt`: submission timestamp

### Relations

- `poll`: owning poll
- `question`: modern poll question if used
- `user`: submitting user
- `option`: legacy poll option if used
- `questionOption`: modern poll option if used

## PollType

Poll mode enum.

- `SINGLE_CHOICE`: one option
- `MULTIPLE_CHOICE`: multiple selections
- `WORD_CLOUD`: short text aggregated visually
- `RANKING`: ranked ordering input
- `SCALE`: numeric scale response
- `OPEN_TEXT`: free text answer
- `Q_AND_A`: question-and-answer style interaction

## PollOption

Legacy poll-level option model retained for backward compatibility.

### Fields

- `id`: unique option identifier
- `pollId`: owning poll
- `text`: option label
- `imageUrl`: optional image for option
- `order`: display order

### Relations

- `poll`: owning poll
- `responses`: responses that selected this option

## Content

Represents uploaded material for a session.

### Fields

- `id`: unique content identifier
- `title`: content title
- `url`: storage URL for the file
- `type`: content category
- `sessionId`: owning session, nullable in schema but usually session-scoped
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `session`: owning session
- `canView`: users explicitly allowed to view
- `canEdit`: users explicitly allowed to edit

## ContentType

Content category enum.

- `IMAGE`
- `PDF`
- `TEXT`
- `VIDEO`
- `DOCUMENT`

## ActivityLog

Stores audit or user activity events.

### Fields

- `id`: unique log identifier
- `userId`: user who performed action
- `action`: event name such as `quiz_completed` or `session_joined`
- `details`: optional extra textual context
- `createdAt`: event timestamp

### Relations

- `user`: user who performed the action

## Team

Older session-based team model used for gamification and grouping.

### Fields

- `id`: unique team identifier
- `name`: team name
- `description`: optional description
- `color`: optional color used by frontend/UI
- `sessionId`: owning session
- `maxMembers`: optional membership limit
- `isActive`: whether team is active
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `session`: owning session
- `members`: team member records
- `pointAwards`: manual team points
- `individualPointAwards`: individual point awards linked to this team

### Constraints

- `(sessionId, name)` must be unique inside a session

## TeamMember

Links a user to a team.

### Fields

- `id`: unique membership identifier
- `teamId`: team joined
- `userId`: member user
- `role`: role inside team
- `joinedAt`: when user joined team

### Relations

- `team`: team being joined
- `user`: member user

### Constraints

- `(teamId, userId)` must be unique

## TeamRole

Role within a team.

- `LEADER`
- `MEMBER`

## TeamPointAward

Manual team-level points awarded by an admin.

### Fields

- `id`: unique award identifier
- `teamId`: team receiving points
- `awardedById`: admin who granted points
- `points`: positive or negative points
- `reason`: reason text for the award
- `category`: optional grouping category
- `createdAt`: award timestamp

### Relations

- `team`: team receiving points
- `awardedBy`: user/admin who gave points

## IndividualPointAward

Manual points awarded to a specific user within a session.

### Fields

- `id`: unique award identifier
- `userId`: user receiving points
- `sessionId`: session context for the award
- `teamId`: optional team context if user belongs to a team
- `awardedById`: admin who granted the points
- `points`: positive or negative points
- `reason`: explanation for the award
- `category`: optional grouping category
- `createdAt`: award timestamp

### Relations

- `user`: recipient user
- `session`: owning session context
- `team`: linked team if present
- `awardedBy`: admin who gave points

## Feedback

Feedback form attached to a session.

### Fields

- `id`: unique feedback form identifier
- `title`: feedback form title
- `description`: optional description
- `sessionId`: owning session
- `isActive`: whether form accepts or exposes active feedback
- `isAnonymous`: whether feedback is intended to be anonymous
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `session`: owning session
- `questions`: questions inside this feedback form
- `responses`: all response rows for this form

## FeedbackQuestion

Question inside a feedback form.

### Fields

- `id`: unique question identifier
- `feedbackId`: owning feedback form
- `question`: question text
- `type`: feedback response type
- `isRequired`: whether response is mandatory
- `order`: display order
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `feedback`: owning form
- `responses`: submitted responses for this question

## FeedbackResponse

Stores one user answer to one feedback question.

### Fields

- `id`: unique response identifier
- `feedbackId`: feedback form
- `questionId`: feedback question answered
- `userId`: responding user
- `rating`: smiley rating value if scale question
- `textAnswer`: free-text answer if text question
- `isAnonymous`: whether this stored answer should be treated as anonymous
- `createdAt`: submission timestamp

### Relations

- `feedback`: owning feedback form
- `question`: question answered
- `user`: responding user

### Constraints

- `(feedbackId, questionId, userId)` must be unique, so one user can answer each question once

## FeedbackType

Feedback question mode.

- `SMILEY_SCALE`
- `TEXT`

## SmileyRating

Five-point rating scale.

- `VERY_POOR`
- `POOR`
- `AVERAGE`
- `GOOD`
- `EXCELLENT`

## Organization

Top-level org unit inside the newer organization/survey subsystem.

### Fields

- `id`: unique organization identifier
- `sessionId`: owning session, nullable in schema for migration compatibility
- `name`: organization name within session
- `description`: optional description
- `settings`: JSON settings/configuration payload
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `session`: owning session
- `departments`: departments under this organization

### Constraints

- `(sessionId, name)` must be unique

## Department

Department inside an organization, with optional hierarchy.

### Fields

- `id`: unique department identifier
- `organizationId`: owning organization
- `name`: department name
- `description`: optional description
- `parentDepartmentId`: optional parent department for nested hierarchy
- `departmentHeadId`: optional user leading the department
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `organization`: owning organization
- `parentDepartment`: parent department if nested
- `subDepartments`: child departments
- `departmentHead`: assigned head user
- `teams`: survey teams under this department
- `userAssignments`: users assigned to this department

### Constraints

- `(organizationId, name)` must be unique

## SurveyTeam

Newer team model used only in organization/survey subsystem.

### Fields

- `id`: unique survey-team identifier
- `departmentId`: owning department
- `name`: team name
- `description`: optional description
- `teamLeadId`: optional user assigned as team lead
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `department`: owning department
- `teamLead`: lead user
- `userAssignments`: assignments linked to this team

### Constraints

- `(departmentId, name)` must be unique

## UserDepartmentAssignment

Maps a user into the organization hierarchy.

### Fields

- `id`: unique assignment identifier
- `userId`: assigned user
- `departmentId`: department assigned
- `teamId`: optional team within that department
- `role`: role used in assignment context
- `assignedById`: admin/user who created assignment
- `assignedAt`: assignment timestamp

### Relations

- `user`: assigned user
- `department`: assigned department
- `team`: assigned survey team if any
- `assignedBy`: user who performed assignment

### Constraints

- `(userId, departmentId)` must be unique

## Survey

Survey attached to a session.

### Fields

- `id`: unique survey identifier
- `title`: survey title
- `description`: optional description
- `sessionId`: owning session
- `createdById`: creator user
- `status`: survey lifecycle state
- `startDate`: optional time when survey becomes active
- `endDate`: optional closing time
- `isAnonymous`: whether survey should be anonymous
- `allowMultipleResponses`: whether multiple submissions should be allowed
- `isOptional`: whether taking the survey is optional
- `settings`: JSON settings/configuration payload
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `session`: owning session
- `createdBy`: creator user
- `questions`: survey questions
- `assignments`: assignment targets
- `responses`: user survey responses

## SurveyAssignment

Assigns a survey to a target inside the organization structure or directly to an individual.

### Fields

- `id`: unique assignment identifier
- `surveyId`: survey being assigned
- `assignedToType`: kind of target, such as department, team, or individual
- `assignedToId`: actual target identifier
- `assignedById`: user who created assignment
- `deadline`: optional due date
- `reminderSchedule`: JSON configuration for reminders
- `assignedAt`: creation timestamp of assignment

### Relations

- `survey`: assigned survey
- `assignedBy`: user who made assignment

## SurveyQuestion

One question inside a survey.

### Fields

- `id`: unique question identifier
- `surveyId`: owning survey
- `questionText`: question prompt
- `questionType`: answer format type
- `surveyType`: business category of the question
- `options`: JSON options payload for choice/matrix/rating questions
- `validationRules`: JSON validation definition
- `isRequired`: whether question must be answered
- `orderIndex`: display order
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `survey`: owning survey
- `responses`: submitted answers to this question

## SurveyResponse

Represents one survey submission by one user.

### Fields

- `id`: unique survey submission identifier
- `surveyId`: survey being answered
- `userId`: responding user
- `submittedAt`: when user finalized submission
- `completionStatus`: whether response is incomplete, complete, or partial
- `responseTimeSeconds`: total completion time
- `ipAddress`: optional audit IP address
- `userAgent`: optional audit user agent
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp

### Relations

- `survey`: survey being answered
- `user`: responding user
- `questionResponses`: per-question answer rows

### Constraints

- `(surveyId, userId)` must be unique in schema, although code comments note multiple responses may be a future behavior consideration

## SurveyQuestionResponse

Stores one answer to one survey question within a survey response.

### Fields

- `id`: unique answer row identifier
- `surveyResponseId`: owning survey submission
- `questionId`: survey question answered
- `responseValue`: JSON payload for flexible answer storage
- `respondedAt`: timestamp of answer capture

### Relations

- `surveyResponse`: parent submission
- `question`: survey question answered

### Constraints

- `(surveyResponseId, questionId)` must be unique

## SurveyType

Business grouping/category enum for survey questions.

- `BEHAVIORAL`
- `SATISFACTION`
- `ORGANIZATIONAL`
- `CUSTOM`

## SurveyStatus

Survey lifecycle enum.

- `DRAFT`
- `ACTIVE`
- `CLOSED`
- `ARCHIVED`

## AssignmentTargetType

Survey assignment target enum.

- `DEPARTMENT`
- `TEAM`
- `INDIVIDUAL`

## SurveyQuestionType

Survey answer format enum.

- `MULTIPLE_CHOICE`
- `RATING_SCALE`
- `TEXT`
- `BEHAVIORAL`
- `MATRIX`

## CompletionStatus

Survey response completion enum.

- `INCOMPLETE`
- `COMPLETE`
- `PARTIAL`

## Recommended Use For Migration Team

Use this file together with:

- [handoff/03-feature-modules.md](/home/ronit/Documents/Projects/joining_dots_backend/handoff/03-feature-modules.md)
- [handoff/04-data-model-and-types.md](/home/ronit/Documents/Projects/joining_dots_backend/handoff/04-data-model-and-types.md)
- [prisma/schema.prisma](/home/ronit/Documents/Projects/joining_dots_backend/prisma/schema.prisma)

Suggested order:

1. read this file for business meaning
2. read `schema.prisma` for exact technical shape
3. read feature-module flows to understand how models are used in code

