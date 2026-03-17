# Migration Handoff Brief

## Purpose Of This Document

This document is for the engineer who will migrate the current system into an implementation based on `HTML`, `CSS`, and `JavaScript`.

It explains:

- what the current system does
- what the current tech stack is


## What The System Does

Joining Dots is a session-centric training and engagement backend.
The main business object is `Session`. Most product workflows are built around a session:

- user onboarding and participation
- quizzes
- polls
- content delivery
- teams and points
- feedback
- organizations
- surveys

Typical flow:

1. an admin creates a session
2. users are invited, assigned, or join through a joining code
3. participants interact with session features such as quizzes, polls, content, teams, feedback, and surveys

## Current Tech Stack

The current backend is built with:

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication
- Zod validation
- Socket.IO for realtime poll updates
- Cloudinary for media/content storage
- Nodemailer for email flows

## Migration Target

The migration target is an implementation in:

- HTML
- CSS
- JavaScript

The incoming engineer should translate the current system behavior into that stack while preserving the important product flows and business logic.

## Migration Ownership Expectation

The migration engineer is expected to do most of the implementation work.

Expectation:

- you own around 90% of the migration code
- you should drive the target HTML, CSS, and JavaScript structure, implementation, and delivery
- you should raise questions early when behavior is unclear

This is intentionally not a model where the current owner rewrites the system for you. The expectation is that you lead the coding effort.

## Support Available From Current Owner

My role in the migration is primarily to support understanding, not to do the majority of the implementation.

I will help with:

- explaining the current codebase
- explaining the system architecture
- clarifying business logic and feature behavior
- answering questions when the existing code is hard to follow
- helping identify where specific logic lives in the current backend

If you need context to understand why something exists, how a feature behaves, or which module owns a workflow, I can help with that.
