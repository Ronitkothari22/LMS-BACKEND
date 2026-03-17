# Feature Modules

## Authentication

Files:

- [src/routes/auth.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/auth.routes.ts)
- [src/controllers/auth.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/auth.controller.ts)

Flow:

1. user signs up
2. password is hashed
3. user record is created
4. OTP is generated and emailed
5. user verifies email
6. login returns access token and refresh token
7. protected APIs use JWT auth

Important notes:

- OTP storage is in-memory
- admin signup creates pre-verified admins
- unverified users are blocked from protected routes

## Users And Onboarding

Files:

- [src/routes/user.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/user.routes.ts)
- [src/controllers/user.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/user.controller.ts)
- [src/routes/onboarding.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/onboarding.routes.ts)

Flow:

1. admin creates users or bulk invites them
2. user metadata can be updated later
3. admin can toggle active status

## Sessions

Files:

- [src/routes/session.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/session.routes.ts)
- [src/controllers/session.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/session.controller.ts)

Flow:

1. admin creates session
2. joining code is generated
3. invite emails may be sent
4. participants join using code
5. session becomes the context for all other modules

Key concepts:

- participants
- invited users
- invited emails
- joining code
- state
- isActive

## Quizzes

Files:

- [src/routes/quiz.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/quiz.routes.ts)
- [src/controllers/quiz.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/quiz.controller.ts)

Flow:

1. admin creates quiz in a session
2. questions are attached to the quiz
3. participants access quiz if allowed
4. answers are submitted
5. score and leaderboard data are generated
6. admin can export results

## Polls

Files:

- [src/routes/poll.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/poll.routes.ts)
- [src/controllers/poll.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/poll.controller.ts)
- [src/services/socket.service.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/services/socket.service.ts)

Flow:

1. admin creates a session-based or standalone poll
2. joining code is generated
3. participants join the poll
4. active question state is broadcast over sockets
5. responses are submitted
6. results are aggregated and returned

Important migration note:

- poll code supports both legacy single-question shape and newer multi-question shape

## Content

Files:

- [src/routes/content.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/content.routes.ts)
- [src/controllers/content.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/content.controller.ts)
- [src/services/cloudinary.service.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/services/cloudinary.service.ts)

Flow:

1. admin or session creator uploads file
2. multer validates upload
3. file is sent to Cloudinary
4. content metadata is stored
5. access is controlled through session membership and ACL-like relations

## Teams And Points

Files:

- [src/routes/team.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/team.routes.ts)
- [src/controllers/team.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/team.controller.ts)

Flow:

1. admin creates teams in a session
2. users are assigned to teams
3. admins award team or individual points
4. leaderboard aggregates scores and participation

Important note:

- this is the older session-based `Team` subsystem

## Feedback

Files:

- [src/routes/feedback.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/feedback.routes.ts)
- [src/controllers/feedback.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/feedback.controller.ts)

Flow:

1. admin creates feedback form
2. form contains one or more questions
3. participant submits responses
4. backend stores per-question responses
5. admin fetches aggregated results

## Organization And Survey

Files:

- [src/routes/organization.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/organization.routes.ts)
- [src/controllers/organization.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/organization.controller.ts)
- [src/services/organization.service.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/services/organization.service.ts)
- [src/routes/survey.routes.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/routes/survey.routes.ts)
- [src/controllers/survey.controller.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/controllers/survey.controller.ts)
- [src/services/survey.service.ts](/home/ronit/Documents/Projects/joining_dots_backend/src/services/survey.service.ts)

Organization flow:

1. create organization inside a session
2. create departments
3. create survey teams inside departments
4. assign users to departments and teams
5. bulk assignment can be imported

Survey flow:

1. create survey inside a session
2. add survey questions
3. assign survey to department, team, or individual
4. user submits responses
5. analytics are generated

