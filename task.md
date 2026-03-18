# Backend Task Plan - LMS Phase (Topic/Level Gamified Learning)

## 1. Scope and Guardrails
- Goal: add an independent LMS learning journey system (Topic -> Levels -> Content -> Progress -> Gamification) without breaking current session-based modules.
- No breaking changes to existing APIs/flows.
- Backward compatibility first: LMS work must be additive and isolated.
- Allowed system change: database schema expansion for LMS.

## 2. Product Requirements (Mapped)
- Admin creates Topics.
- Each Topic has sequential Levels.
- Each Level can contain:
  - Video (upload or external link)
  - Questions (single choice, multiple correct, text)
  - Optional reading material/attachments
- Video completion can be required or optional per level.
- Next level unlocks only after current completion rules pass.
- Gamification:
  - XP rewards
  - Badges by milestones
  - Progress bars
  - Topic completion percentage
  - Leaderboards (global + topic-wise)
- Progress tracking:
  - Video watch percentage
  - Level completion
  - Time spent
  - Attempts and pass/fail
- LMS must work independently from Sessions.

## 3. Architecture Aligned to Current Backend Structure
Use current structure (no new module root folders):
- `src/controllers/lms.*.controller.ts`
- `src/routes/lms.routes.ts`
- `src/services/lms.*.service.ts`
- `src/validations/lms.*.validation.ts`
- `src/types/lms.*.types.ts`
- `src/utils/*` only if shared LMS helper is needed

Route mount strategy:
- Add LMS router in existing [src/routes/index.ts](./src/routes/index.ts) as `router.use('/lms', lmsRoutes)`.

Security strategy:
- Reuse existing middleware: `authenticateToken`, `isAdmin`, `validateRequest`.

Storage strategy:
- Reuse existing content/upload provider path where possible (Cloudinary/MinIO abstractions already present).

## 4. Proposed Prisma Models (Additive)
- `LmsTopic`
- `LmsLevel`
- `LmsLevelContent`
- `LmsQuestion`
- `LmsQuestionOption`
- `LmsLevelAttempt`
- `LmsLevelAttemptAnswer`
- `LmsUserLevelProgress`
- `LmsUserTopicProgress`
- `LmsVideoWatchEvent`
- `LmsXpLedger`
- `LmsBadge`
- `LmsUserBadge`
- `LmsLeaderboardSnapshot` (optional optimization)

Rules:
- Additive schema only.
- Existing session, quiz, poll, team flows stay untouched.

## 5. API Blueprint (Backend)
Admin APIs
- `POST /api/lms/topics`
- `GET /api/lms/topics`
- `GET /api/lms/topics/:topicId`
- `PUT /api/lms/topics/:topicId`
- `DELETE /api/lms/topics/:topicId`
- `POST /api/lms/topics/:topicId/levels`
- `PUT /api/lms/levels/:levelId`
- `DELETE /api/lms/levels/:levelId`
- `POST /api/lms/levels/:levelId/content/video`
- `POST /api/lms/levels/:levelId/content/reading`
- `POST /api/lms/levels/:levelId/questions`
- `GET /api/lms/analytics/topics/:topicId`
- `GET /api/lms/analytics/videos/:contentId`

Learner APIs
- `GET /api/lms/me/topics`
- `GET /api/lms/me/topics/:topicId`
- `GET /api/lms/me/levels/:levelId`
- `POST /api/lms/me/levels/:levelId/video-progress`
- `POST /api/lms/me/levels/:levelId/attempts`
- `POST /api/lms/me/levels/:levelId/complete`
- `GET /api/lms/me/progress`
- `GET /api/lms/leaderboard/global`
- `GET /api/lms/leaderboard/topics/:topicId`

## 6. Completion and Unlock Rules
Per-level rule config:
- `requireVideoCompletion`
- `minVideoWatchPercent`
- `requireQuizPass`
- `quizPassingPercent`
- `requireReadingAcknowledgement` (optional)

Unlock behavior:
- Next level unlocks only when enabled conditions pass.
- If video is optional for a level, quiz/read rules alone can unlock.

## 7. Gamification (V1)
- XP events:
  - Video completed
  - Quiz passed
  - Level completed
  - Topic completed
- Badge examples:
  - First level complete
  - 3-level streak
  - Topic finisher
  - XP thresholds (100/500/1000)
- Leaderboards:
  - Global (total XP)
  - Topic-wise (topic XP)

## 8. Progress and Analytics
Track and expose:
- Video watch % and watch events
- Level/topic completion
- Attempts, score, pass/fail
- Time spent per level/topic
- Topic completion %

## 9. Execution Checklist

### Phase A - Foundation
- [x] Define Prisma LMS schema additions (additive only).
- [x] Create migration for LMS schema.
- [x] Register LMS router in `src/routes/index.ts`.
- [x] Add LMS route file `src/routes/lms.routes.ts`.
- [x] Add base LMS controller files under `src/controllers`.
- [x] Add base LMS service files under `src/services`.
- [x] Add LMS validation schemas under `src/validations`.
- [x] Add LMS type definitions under `src/types`.

### Phase B - Admin Authoring APIs
- [x] Topic CRUD implementation.
- [x] Level CRUD + ordering.
- [x] Level content APIs (video/readings/attachments/links).
- [x] Question CRUD (single choice, multiple correct, text).
- [x] Publish/unpublish topic workflow.

### Phase C - Learner Runtime APIs
- [x] Topic and level fetch with lock state.
- [x] Video progress ingestion.
- [x] Quiz attempt submission and scoring.
- [x] Level completion evaluator.
- [x] Sequential unlock engine.

### Phase D - Gamification
- [x] XP ledger write logic.
- [x] Badge assignment rules.
- [x] Global leaderboard endpoint.
- [x] Topic leaderboard endpoint.

### Phase E - Analytics
- [ ] Video analytics endpoints.
- [ ] Progress analytics endpoints.
- [ ] Attempt/pass-fail analytics endpoints.

### Phase F - Hardening
- [ ] Integration tests for unlock rules.
- [ ] Race-condition safety for duplicate completion events.
- [ ] API documentation for LMS routes.
- [ ] Structured logs and error taxonomy.

## 10. Current Progress Snapshot
- [x] Planning and architecture document created.
- [x] LMS schema drafted and validated with Prisma.
- [x] Migration generated/applied.
- [x] LMS API scaffolding started.

## 11. Next Step
- Generate migration for LMS schema.
- Then scaffold routes/controllers/services/validations/types in current backend structure.
