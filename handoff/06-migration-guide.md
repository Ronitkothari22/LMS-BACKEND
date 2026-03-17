# Migration Guide

## Recommended Migration Order

1. auth and user identity
2. session lifecycle
3. quiz subsystem
4. poll subsystem
5. content subsystem
6. teams and feedback
7. organization and survey subsystem
8. realtime socket layer
9. exports and secondary utilities

## Why This Order

- session and auth are foundational
- most features depend on authenticated users plus session membership
- polls need both HTTP and realtime support
- organization and survey modules can be ported after session foundations are stable

## Important Caveats Before Porting

- Prisma usage is inconsistent across modules
- some modules use shared Prisma client, others instantiate local clients
- CORS configuration is duplicated
- some docs are stale relative to implementation
- OTP storage is in-memory and not horizontally scalable
- poll logic supports both old and new shapes
- there are two different team models:
  - `Team` for older session teams
  - `SurveyTeam` for org/survey hierarchy

## Suggested Target Architecture In The New Stack

- route/controller layer
- service layer
- repository/data access layer
- auth and authorization layer
- storage adapter layer
- email adapter layer
- realtime event layer

## What Must Be Preserved

1. session-centric business model
2. JWT-based auth flow
3. session membership and access control behavior
4. quiz scoring and leaderboard behavior
5. live poll behavior
6. content access rules
7. team/point behavior
8. feedback data model
9. organization/survey assignment logic

## Good Migration Strategy

1. migrate schema and contracts first
2. write endpoint-by-endpoint compatibility map
3. port shared auth and authorization rules
4. port core session flows
5. port feature modules one by one
6. test with real sample data from current database exports

