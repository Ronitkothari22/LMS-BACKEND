# Integrations And Config

## Config Files

- [src/config/env.config.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/config/env.config.ts)
- [src/config/jwt.config.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/config/jwt.config.ts)
- [src/config/cloudinary.config.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/config/cloudinary.config.ts)
- [src/config/email.config.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/config/email.config.ts)
- [src/config/minio.config.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/config/minio.config.ts)

## Important Environment Values

- `DATABASE_URL`
- `PORT`
- `NODE_ENV`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW_MS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- SMTP email variables
- MinIO/S3 variables if that path is used

## Database

- PostgreSQL
- accessed via Prisma
- shared client exists in [src/lib/prisma.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/lib/prisma.ts)

## Storage

### Cloudinary

Primary media/content upload integration.

Files:

- [src/config/cloudinary.config.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/config/cloudinary.config.ts)
- [src/services/cloudinary.service.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/services/cloudinary.service.ts)

### MinIO / S3

Secondary helper implementation exists.

Files:

- [src/config/minio.config.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/config/minio.config.ts)
- [src/services/minio.service.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/services/minio.service.ts)

## Email

Used for:

- email verification
- password reset
- session invitation
- welcome flows

Files:

- [src/config/email.config.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/config/email.config.ts)
- [src/utils/email.util.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/utils/email.util.ts)

## Realtime

- Socket.IO
- mainly for poll rooms, active questions, participant counts, and live responses

Files:

- [src/services/socket.service.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/services/socket.service.ts)

## Validation

- Zod-based request validation

Folder:

- [src/validations](/home/ronit/Documents/Projects/joining_dots_backend/src/validations)

