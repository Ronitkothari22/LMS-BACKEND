# Runtime And Request Flow

## Startup Flow

1. Environment values are loaded.
2. Express app is created in [src/app.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/app.ts).
3. App middleware is attached:
   - `helmet`
   - `cors`
   - `compression`
   - request body parsers
   - logging with `morgan`
   - rate limiting
4. Cloudinary is initialized.
5. API routes are mounted under `/api`.
6. In [src/server.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/server.ts):
   - Prisma connects to the database
   - HTTP server is created
   - Socket.IO service is attached
   - process error/shutdown handlers are registered

## Standard HTTP Request Flow

1. Request enters Express.
2. Global middleware runs.
3. Route file matches the endpoint.
4. Auth middleware may validate JWT and set `req.user`.
5. Validation middleware may parse `body`, `params`, and `query`.
6. Authorization middleware may check admin/session/content/quiz access.
7. Controller runs business logic.
8. Controller reads or writes using Prisma.
9. Response is returned as JSON.
10. Error middleware formats failures if an exception reaches it.

## Realtime Flow

Realtime support is mainly used for polls.

1. Client connects to Socket.IO.
2. Socket auth validates JWT.
3. User joins a poll room.
4. Poll room emits participant and question events.
5. Responses and results are broadcast to connected clients.

Main file: [src/services/socket.service.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/services/socket.service.ts)

## Important Middleware

### Authentication

File: [src/middleware/auth.middleware.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/middleware/auth.middleware.ts)

Purpose:

- validate bearer token
- fetch authenticated user
- attach `req.user`

### Admin Authorization

File: [src/middleware/admin.middleware.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/middleware/admin.middleware.ts)

Purpose:

- restrict endpoints to `ADMIN`

### Generic Validation

File: [src/middleware/validate.middleware.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/middleware/validate.middleware.ts)

Purpose:

- validate route `body`, `params`, and `query` with Zod

### Feature-Specific Access Middleware

Files:

- [src/middleware/content.middleware.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/middleware/content.middleware.ts)
- [src/middleware/quiz.middleware.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/middleware/quiz.middleware.ts)
- [src/middleware/session.middleware.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/middleware/session.middleware.ts)

Purpose:

- enforce resource-specific access rules

