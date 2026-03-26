# Session Assignment Submission Feature Plan

## 1) Goal

Add an **Assignment** module inside a **Session** where:

- Admin can create multiple assignments per session.
- Each assignment has a submission deadline.
- Users upload one or more assignment files (PDF/DOC/DOCX) before deadline.
- After deadline, user submission is blocked by default.
- Admin can optionally allow late submissions for a specific assignment.
- Admin can view all submissions, see submission timeline/status, and download uploaded files.

This document is planning-only. No implementation is included yet.

---

## 2) Scope

### In Scope

- Session-level assignments.
- Assignment CRUD by admin.
- File submission by session participants.
- Deadline and late-submission rules.
- Admin review/download view.
- Audit timeline (created, submitted, late, updated, reopened, etc.).

### Out of Scope (for first release)

- Grading/rubrics/marks.
- Inline annotation on files.
- Plagiarism detection.
- Notifications/reminders.
- Bulk ZIP export of all files.

---

## 3) Core User Stories

1. As an admin, I can create multiple assignments for one session.
2. As an admin, I can define title, instructions, due date/time, and allowed file types.
3. As a participant, I can upload multiple files for my assignment before deadline.
4. As a participant, I am blocked from submitting after deadline unless late submission is enabled.
5. As an admin, I can toggle late submission on/off per assignment.
6. As an admin, I can see who submitted, when they submitted, and whether submission was late.
7. As an admin, I can download participant submissions.

---

## 4) Business Rules

1. Assignment belongs to exactly one session.
2. Session can have many assignments.
3. User can submit only if user is part of the assignment’s session.
4. Submission window:
   - If `now <= dueDate`: submission allowed.
   - If `now > dueDate`: submission blocked unless `allowLateSubmission = true`.
5. If late submission is allowed, submission is accepted and marked `isLate = true`.
6. Re-submission behavior (recommended for V1):
   - One active submission per user per assignment.
   - A submission can include multiple files.
   - User may replace the submitted file set before deadline (and after deadline only if late submission enabled).
   - Preserve submission history through timeline logs.
7. Admin (or session creator if allowed by permission policy) can always view and download submissions.
8. All key actions should write timeline/audit events.

---

## 5) Suggested Data Model (Backend/Prisma)

### New Model: `SessionAssignment`

- `id: String @id @default(uuid())`
- `sessionId: String` (FK to `Session`)
- `title: String`
- `description: String?`
- `instructions: String?`
- `dueDate: DateTime`
- `allowLateSubmission: Boolean @default(false)`
- `maxFileSizeMb: Int?` (optional safety)
- `maxFilesPerSubmission: Int @default(5)`
- `allowedFileTypes: String[]` (e.g. `["pdf","doc","docx"]`)
- `isActive: Boolean @default(true)`
- `createdById: String` (FK to `User`)
- `createdAt: DateTime @default(now())`
- `updatedAt: DateTime @updatedAt`

Indexes:
- `@@index([sessionId, dueDate])`
- `@@index([createdById])`

### New Model: `SessionAssignmentSubmission`

- `id: String @id @default(uuid())`
- `assignmentId: String` (FK to `SessionAssignment`)
- `sessionId: String` (denormalized for faster filtering, optional but recommended)
- `userId: String` (FK to `User`)
- `submittedAt: DateTime @default(now())`
- `isLate: Boolean @default(false)`
- `version: Int @default(1)` (if re-submission replaces previous)
- `status: SubmissionStatus @default(SUBMITTED)`
- `createdAt: DateTime @default(now())`
- `updatedAt: DateTime @updatedAt`

Constraints:
- `@@unique([assignmentId, userId])` for single active submission in V1
- `@@index([sessionId, assignmentId])`
- `@@index([userId, submittedAt])`

### New Model: `SessionAssignmentSubmissionFile`

- `id: String @id @default(uuid())`
- `submissionId: String` (FK to `SessionAssignmentSubmission`)
- `fileUrl: String`
- `fileName: String`
- `fileMimeType: String`
- `fileSizeBytes: Int`
- `createdAt: DateTime @default(now())`

Indexes:
- `@@index([submissionId, createdAt])`

### New Model: `SessionAssignmentTimelineEvent`

- `id: String @id @default(uuid())`
- `assignmentId: String`
- `submissionId: String?`
- `actorUserId: String`
- `eventType: AssignmentTimelineEventType`
- `eventMeta: Json?`
- `createdAt: DateTime @default(now())`

Indexes:
- `@@index([assignmentId, createdAt])`
- `@@index([submissionId, createdAt])`

### New Enums

- `SubmissionStatus`: `SUBMITTED | REPLACED | WITHDRAWN` (minimal set for V1)
- `AssignmentTimelineEventType`:
  - `ASSIGNMENT_CREATED`
  - `ASSIGNMENT_UPDATED`
  - `LATE_SUBMISSION_ENABLED`
  - `LATE_SUBMISSION_DISABLED`
  - `SUBMISSION_UPLOADED`
  - `SUBMISSION_REPLACED`
  - `SUBMISSION_DOWNLOADED`

---

## 6) API Design (Draft)

All routes below are draft naming; final naming should follow existing backend route style.

### Admin Routes

1. `POST /api/sessions/:sessionId/assignments`
   - Create assignment.
2. `GET /api/sessions/:sessionId/assignments`
   - List assignments for session.
3. `GET /api/sessions/:sessionId/assignments/:assignmentId`
   - Assignment details + summary counts.
4. `PUT /api/sessions/:sessionId/assignments/:assignmentId`
   - Update assignment (title, dueDate, instructions, allowLateSubmission, etc.).
5. `DELETE /api/sessions/:sessionId/assignments/:assignmentId`
   - Soft delete/deactivate assignment.
6. `GET /api/sessions/:sessionId/assignments/:assignmentId/submissions`
   - Admin list of all submissions (with filters: submitted/late/missing).
7. `GET /api/sessions/:sessionId/assignments/:assignmentId/submissions/:submissionId/files/:fileId/download`
   - Download a specific submission file (or pre-signed URL).
8. `GET /api/sessions/:sessionId/assignments/:assignmentId/timeline`
   - Timeline events for admin audit.

### Participant Routes

1. `GET /api/sessions/:sessionId/me/assignments`
   - My assignments with due status.
2. `GET /api/sessions/:sessionId/me/assignments/:assignmentId`
   - Assignment details + my submission status.
3. `POST /api/sessions/:sessionId/me/assignments/:assignmentId/submission`
   - Upload/replace submission files (multiple files supported).
4. `GET /api/sessions/:sessionId/me/assignments/:assignmentId/submission`
   - My latest submission metadata.

### Shared Response Fields (Recommended)

- `deadlineStatus`: `OPEN | CLOSED | LATE_ALLOWED`
- `canSubmit: boolean`
- `isLate: boolean` (on submission)
- `submittedAt`

---

## 7) Validation & Security Rules

1. Auth required on all endpoints.
2. Admin endpoints require admin/session-owner permission.
3. Participant submission requires:
   - Participant belongs to session.
   - Assignment belongs to same session.
4. Upload validation:
   - Allowed mime/extensions only (`pdf/doc/docx` initially).
   - Max file size guard (per file).
   - Max file count guard per submission.
5. Prevent path traversal by storing files via managed storage service (Cloudinary/MinIO flow consistent with existing project).
6. Download endpoint must enforce permission before returning file/pre-signed URL.

---

## 8) Timeline/Audit Behavior

Capture these key events:

1. Assignment created/updated.
2. Late submission toggled on/off.
3. Submission uploaded or replaced.
4. Admin downloaded submission.

Each event stores actor, timestamp, and contextual metadata in `eventMeta`.

---

## 9) Phase-by-Phase Implementation Plan

Status:
- Phase 0: Completed (Updated)
- Phase 1: Completed (Updated)
- Phase 2: Pending
- Phase 3: Pending
- Phase 4: Pending
- Phase 5: Pending
- Phase 6: Pending
- Phase 7: Pending

## Phase 0: Finalized Functional Contract (Locked)

The following decisions are now locked for V1:

1. Re-submission behavior:
   - Exactly one active submission per user per assignment.
   - New upload replaces existing submission and increments version.
   - Each submission supports multiple files.
   - Timeline events preserve history.
2. Permission policy:
   - Admin can create/update/delete assignments and view/download all submissions.
   - Session creator (if not admin) can also manage assignments for their own session.
   - Session participants can submit only for sessions they belong to.
3. File policy:
   - Allowed file types: `pdf`, `doc`, `docx`.
   - Default max file size: `10 MB` per file.
   - Default max files per submission: `5`.
4. Submission policy:
   - Before due date: submit/replace allowed.
   - After due date: blocked unless `allowLateSubmission = true`.
   - If late submission allowed, accepted with `isLate = true`.
5. Download policy:
   - Admin/session creator download via authorized endpoint that returns secure URL or stream.
6. API response contract:
   - Keep existing backend envelope style:
     - `success`
     - `message`
     - `data`
   - Include deadline status fields (`deadlineStatus`, `canSubmit`) in assignment details payloads.

Deliverable:
- Phase 0 contract finalized in this document.

Completion Note:
- Completed on March 26, 2026.
- Open decisions were resolved and moved into locked V1 contract rules.
- Updated on March 26, 2026 to support multiple files per submission.

## Phase 1: Database & Prisma Foundation (Backend)

- Add new Prisma models/enums.
- Add relations from `Session` and `User` where needed.
- Generate migration.
- Seed update (optional minimal test data).

Deliverable:
- Migration applied locally, Prisma client regenerated.

Completion Note:
- Completed on March 26, 2026.
- Added Prisma models:
  - `SessionAssignment`
  - `SessionAssignmentSubmission`
  - `SessionAssignmentSubmissionFile`
  - `SessionAssignmentTimelineEvent`
- Added enums:
  - `SubmissionStatus`
  - `AssignmentTimelineEventType`
- Added new relations on `User` and `Session` models.
- Added migration:
  - `prisma/migrations/20260326120000_session_assignment_submission_phase1/migration.sql`
- Seed update intentionally skipped in this phase (optional item).
- Updated on March 26, 2026 to revise schema for multi-file submissions.

## Phase 2: Validation Layer (Backend)

- Add Zod schemas for:
  - create/update assignment
  - assignmentId/sessionId params
  - participant submission upload metadata
  - list filters (late/submitted/missing)

Deliverable:
- Validation coverage for all new routes.

## Phase 3: Service Layer (Backend)

- Create `session-assignment.service.ts` with:
  - assignment CRUD
  - submission upload/replace logic
  - deadline + late-submission gate
  - admin list and stats
  - timeline event writes

Deliverable:
- Service methods with typed return DTOs.

## Phase 4: Controllers + Routes (Backend)

- Add controller file(s) for admin and participant flows.
- Wire routes in `session.routes.ts` or dedicated `assignment.routes.ts` (based on existing route organization preference).
- Add middleware chain for auth/admin/validation/upload.

Deliverable:
- Working REST endpoints with consistent response envelope.

## Phase 5: Storage Integration (Backend)

- Reuse existing file upload strategy (Cloudinary/MinIO patterns already in project).
- Store metadata in submission model.
- Add secure download endpoint (proxy or signed URL).

Deliverable:
- End-to-end upload + download from API.

## Phase 6: Testing (Backend)

- Unit tests:
  - deadline closed behavior
  - late submission enabled behavior
  - permission failures
  - re-submission behavior
- Integration tests:
  - admin creates assignment
  - participant submits before/after deadline
  - admin lists and downloads submissions

Deliverable:
- Passing test suite for assignment module critical paths.

## Phase 7: Admin/UI + User/UI (Next Step, After Backend)

- Admin UI: create/manage assignments, toggle late submission, list/download submissions, timeline view.
- User UI: assignment list, due state badge, upload/re-upload flow, submission status.

Deliverable:
- Full front-end integration with backend endpoints.

---

## 10) Acceptance Criteria (Backend Complete)

1. Admin can create multiple assignments per session.
2. Participant can submit one or more valid files before deadline.
3. Participant is blocked after deadline when late submission is disabled.
4. Participant can submit after deadline when late submission is enabled.
5. Admin can list, inspect, and download submission files.
6. Timeline events are stored for key actions.
7. Authorization and validation failures return correct HTTP errors.

---

## 11) Contract Clarifications (Resolved for V1)

1. Session creator is allowed to manage assignments for their own session (same as admin scope for that session).
2. Multiple files per submission are supported in V1 (single submission record with file list).
3. Withdraw/delete submission by learner is not included in V1.
4. Due date can be edited by admin/session creator; timeline event must be recorded.
5. Download implementation can use secure URL or API stream, but permission check is mandatory before file access.
