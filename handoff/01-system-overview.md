# System Overview

## Purpose

This backend powers a session-centric training and engagement platform called Joining Dots.

The main business object is `Session`. Most product capabilities are attached to a session:

- quizzes
- polls
- content
- teams
- feedback
- surveys
- organizations

## Core Idea

An admin creates a session, invites or assigns users, and participants join using a joining code. Once users are part of the session, they can take quizzes, answer polls, access content, join teams, receive points, submit feedback, and answer surveys.

## Architecture Style

The codebase has two architectural generations:

- older modules: controller-heavy, business logic directly inside controllers, many direct Prisma calls

## Major Technical Stack

- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication
- Zod validation
- Cloudinary for content/media handling
- Nodemailer for email flows
- Socket.IO for realtime poll updates

## Main Source Files

- app setup: [src/app.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/app.ts)
- server setup: [src/server.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/server.ts)
- route root: [src/routes/index.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/index.ts)
- database schema: [prisma/schema.prisma](/home/ronit/Documents/Projects/joining_dots_backend/prisma/schema.prisma)

## Main Route Groups

- `/auth`
- `/users`
- `/onboarding`
- `/sessions`
- `/quizzes`
- `/poll`
- `/dashboard`
- `/content`
- `/teams`
- `/feedback`
- `/organization`
- `/survey`

