Data
Length
Time
Data	Length	Time	
42["participant-list-updated",{"pollId":"25c60dd2-a988-48df-a207-58a007673076","participants":[{"id":"e62f61c5-185d-477e-9399-90a8e9d65f46","name":"Ronit Kothari","email":"22cs031@charusat.edu.in","profilePhoto":null},{"id":"fc654e25-803b-4285-9b7e-22a1eb9d6dc1","name":"Abhishek Parmar","email":"abhisheknparmar@gmail.com","profilePhoto":null}]}]	347	
17:24:17.920
42["poll-updated",{"action":"new-question","data":{"poll":{"id":"25c60dd2-a988-48df-a207-58a007673076","title":"joiningcodetest3"},"question":{"id":"c50de6f1-5e44-4e86-8176-cca932435c13","question":"what i this ","type":"WORD_CLOUD","timeLimit":30,"options":[]},"startedAt":"2025-06-08T11:54:31.414Z"}}]	303	
17:24:32.974
42["active-question",{"action":"new-question","data":{"poll":{"id":"25c60dd2-a988-48df-a207-58a007673076","title":"joiningcodetest3"},"question":{"id":"c50de6f1-5e44-4e86-8176-cca932435c13","question":"what i this ","type":"WORD_CLOUD","timeLimit":30,"options":[]},"startedAt":"2025-06-08T11:54:31.414Z"}}]	306	
17:24:32.987
2	1	
17:24:40.576
3	1	
17:24:40.576
42["poll-updated",{"action":"new-response","data":{"pollId":"25c60dd2-a988-48df-a207-58a007673076","questionId":"c50de6f1-5e44-4e86-8176-cca932435c13","response":{"id":"374fa3bc-4058-4e75-a31f-e1e498c1bf9b","userId":"e62f61c5-185d-477e-9399-90a8e9d65f46","userName":"Ronit Kothari","answer":"test3","type":"WORD_CLOUD","timestamp":"2025-06-08T11:54:46.385Z","anonymous":false}}}]	379	
17:24:46.387
42["message",{"type":"participant-count-updated","data":{"pollId":"25c60dd2-a988-48df-a207-58a007673076","count":2,"user":{"id":"fc654e25-803b-4285-9b7e-22a1eb9d6dc1","name":"Abhishek Parmar"}}}]	195	
17:24:55.016
42["poll-update",{"type":"participant-count-updated","data":{"pollId":"25c60dd2-a988-48df-a207-58a007673076","count":2,"user":{"id":"fc654e25-803b-4285-9b7e-22a1eb9d6dc1","name":"Abhishek Parmar"}}}]	199	
17:24:55.017
42["participant-count-updated",{"pollId":"25c60dd2-a988-48df-a207-58a007673076","count":2}]	91	
17:24:56.008
42["participant-list-updated",{"pollId":"25c60dd2-a988-48df-a207-58a007673076","participants":[{"id":"e62f61c5-185d-477e-9399-90a8e9d65f46","name":"Ronit Kothari","email":"22cs031@charusat.edu.in","profilePhoto":null},{"id":"fc654e25-803b-4285-9b7e-22a1eb9d6dc1","name":"Abhishek Parmar","email":"abhisheknparmar@gmail.com","profilePhoto":null}]}]	347	
17:24:56.014
42["question-ended",{"pollId":"25c60dd2-a988-48df-a207-58a007673076","timestamp":"2025-06-08T11:55:04.031Z","questionId":"c50de6f1-5e44-4e86-8176-cca932435c13"}]	161	
17:25:04.031
42["poll-updated",{"action":"question-ended","data":{"pollId":"25c60dd2-a988-48df-a207-58a007673076","timestamp":"2025-06-08T11:55:04.031Z","questionId":"c50de6f1-5e44-4e86-8176-cca932435c13"}}]	194	
17:25:04.032
42["poll-updated",{"action":"question-results","data":{"pollId":"25c60dd2-a988-48df-a207-58a007673076","questionId":"c50de6f1-5e44-4e86-8176-cca932435c13","question":"what i this ","type":"WORD_CLOUD","results":{"totalResponses":1,"options":[]},"endedAt":"2025-06-08T11:55:04.031Z","questionStartedAt":"2025-06-08T11:54:31.414Z","isFinalQuestion":true}}]	354	
17:25:04.033
42["poll-updated",{"action":"poll-ended","data":{"pollId":"25c60dd2-a988-48df-a207-58a007673076","endedAt":"2025-06-08T11:55:04.032Z"}}]	136	
17:25:04.039
2	1	
17:25:05.577
3	1	
17:25:05.577
2	1	
17:25:30.585
3	1	
17:25:30.585
42["poll-updated", {action: "question-results",…}]
0
: 
"poll-updated"
1
: 
{action: "question-results",…}
action
: 
"question-results"
data
: 
{pollId: "25c60dd2-a988-48df-a207-58a007673076", questionId: "c50de6f1-5e44-4e86-8176-cca932435c13",…}
endedAt
: 
"2025-06-08T11:55:04.031Z"
isFinalQuestion
: 
true
pollId
: 
"25c60dd2-a988-48df-a207-58a007673076"
question
: 
"what i this "
questionId
: 
"c50de6f1-5e44-4e86-8176-cca932435c13"
questionStartedAt
: 
"2025-06-08T11:54:31.414Z"
results
: 
{totalResponses: 1, options: []}
options
: 
[]
totalResponses
: 
1
type
: 
"WORD_CLOUD"




[ronit@workstation joining_dots_backend]$ pnpm dev

> joining_dots_backend@1.0.0 dev /home/ronit/Documents/Projects/joining_dots_backend
> ts-node-dev --respawn --transpile-only src/server.ts

[INFO] 17:16:57 ts-node-dev ver. 2.0.0 (using ts-node ver. 10.9.2, typescript ver. 5.7.3)
prisma:warn In production, we recommend using `prisma generate --no-engine` (See: `prisma generate --help`)
info: Cloudinary initialized successfully {"service":"joining-dots-backend","timestamp":"2025-06-08T11:46:58.613Z"}
info: Database connection established {"service":"joining-dots-backend","timestamp":"2025-06-08T11:46:58.656Z"}
Socket.IO server initialized
info: Server running on port 8080 in development mode {"service":"joining-dots-backend","timestamp":"2025-06-08T11:46:58.658Z"}
info: API Documentation available at http://localhost:8080/api/docs {"service":"joining-dots-backend","timestamp":"2025-06-08T11:46:58.658Z"}
info: WebSocket server is running {"service":"joining-dots-backend","timestamp":"2025-06-08T11:46:58.658Z"}
info: ::1 - - [08/Jun/2025:11:47:03 +0000] "GET /api/poll?sessionId=fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 200 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:47:03.019Z"}
Socket handshake query: [Object: null prototype] {
  authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYzY1NGUyNS04MDNiLTQyODUtOWI3ZS0yMmExZWI5ZDZkYzEiLCJpYXQiOjE3NDkzODAyMjEsImV4cCI6MTc0OTQ2NjYyMX0.bccxlnJ8qX1m4E85CIRgN_8nE5B4fq1W3_9o3_HOHYU',
  EIO: '4',
  transport: 'websocket'
}
Found token in query.authorization
Verifying token
info: ::1 - - [08/Jun/2025:11:47:04 +0000] "GET /api/poll?sessionId=fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:47:04.120Z"}
User authenticated: Abhishek Parmar
Socket connected: L-4EdDDLaJOhhgsuAAAB
Debug - Received event: join-poll with args: [ 'e0a102ca-904c-479b-a985-ab0c0b8940e5' ]
🔸 DEBUG - Received join-poll event: e0a102ca-904c-479b-a985-ab0c0b8940e5
🔸 DEBUG - From socket: L-4EdDDLaJOhhgsuAAAB
🔸 DEBUG - User: Abhishek Parmar
Socket L-4EdDDLaJOhhgsuAAAB joining poll e0a102ca-904c-479b-a985-ab0c0b8940e5
Poll e0a102ca-904c-479b-a985-ab0c0b8940e5 now has 1 participants
🔸 DEBUG - No active question found for poll: e0a102ca-904c-479b-a985-ab0c0b8940e5
Debug - Received event: join-poll with args: [ 'e0a102ca-904c-479b-a985-ab0c0b8940e5' ]
🔸 DEBUG - Received join-poll event: e0a102ca-904c-479b-a985-ab0c0b8940e5
🔸 DEBUG - From socket: L-4EdDDLaJOhhgsuAAAB
🔸 DEBUG - User: Abhishek Parmar
Socket L-4EdDDLaJOhhgsuAAAB joining poll e0a102ca-904c-479b-a985-ab0c0b8940e5
Poll e0a102ca-904c-479b-a985-ab0c0b8940e5 now has 1 participants
🔸 DEBUG - No active question found for poll: e0a102ca-904c-479b-a985-ab0c0b8940e5
error: 403 - Access denied. Admin privileges required - /api/poll/create - POST - ::1 {"error":"Error: Access denied. Admin privileges required","service":"joining-dots-backend","timestamp":"2025-06-08T11:47:19.123Z"}
info: ::1 - - [08/Jun/2025:11:47:19 +0000] "POST /api/poll/create HTTP/1.1" 403 70 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:47:19.124Z"}
error: 404 - Not Found - /api/auth/refresh - POST - ::1 {"error":"Error: Not Found","service":"joining-dots-backend","timestamp":"2025-06-08T11:47:19.132Z"}
info: ::1 - - [08/Jun/2025:11:47:19 +0000] "POST /api/auth/refresh HTTP/1.1" 404 39 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:47:19.133Z"}
info: ::1 - - [08/Jun/2025:11:47:40 +0000] "POST /api/auth/login HTTP/1.1" 401 33 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:47:40.022Z"}
Socket disconnected: L-4EdDDLaJOhhgsuAAAB
info: ::1 - - [08/Jun/2025:11:47:53 +0000] "POST /api/auth/login HTTP/1.1" 401 33 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:47:53.576Z"}
info: ::1 - - [08/Jun/2025:11:48:22 +0000] "POST /api/auth/login HTTP/1.1" 401 33 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:48:22.129Z"}
info: ::1 - - [08/Jun/2025:11:48:42 +0000] "POST /api/auth/login HTTP/1.1" 200 619 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:48:42.832Z"}
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT COUNT(*) AS "_count._all" FROM (SELECT "public"."Session"."id" FROM "public"."Session" WHERE 1=1 OFFSET $1) AS "sub"
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT "public"."Session"."id", "public"."Session"."title", "public"."Session"."description", "public"."Session"."state"::text, "public"."Session"."invitedEmails", "public"."Session"."joiningCode", "public"."Session"."qrCode", "public"."Session"."startTime", "public"."Session"."endTime", "public"."Session"."expiryDate", "public"."Session"."maxParticipants", "public"."Session"."allowGuests", "public"."Session"."isActive", "public"."Session"."createdById", "public"."Session"."createdAt", "public"."Session"."updatedAt" FROM "public"."Session" WHERE 1=1 ORDER BY "public"."Session"."createdAt" DESC LIMIT $1 OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3) OFFSET $4
prisma:query SELECT "public"."_SessionParticipants"."A", "public"."_SessionParticipants"."B" FROM "public"."_SessionParticipants" WHERE "public"."_SessionParticipants"."A" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31) OFFSET $32
prisma:query SELECT "public"."_SessionInvited"."A", "public"."_SessionInvited"."B" FROM "public"."_SessionInvited" WHERE "public"."_SessionInvited"."A" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33) OFFSET $34
prisma:query SELECT "public"."Quiz"."id", "public"."Quiz"."title", "public"."Quiz"."timeLimitSeconds", "public"."Quiz"."pointsPerQuestion", "public"."Quiz"."passingScore", "public"."Quiz"."sessionId" FROM "public"."Quiz" WHERE "public"."Quiz"."sessionId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) OFFSET $31
prisma:query SELECT "public"."Poll"."id", "public"."Poll"."title", "public"."Poll"."type"::text, "public"."Poll"."sessionId" FROM "public"."Poll" WHERE "public"."Poll"."sessionId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) OFFSET $31
prisma:query SELECT "public"."Content"."id", "public"."Content"."title", "public"."Content"."type"::text, "public"."Content"."url", "public"."Content"."sessionId" FROM "public"."Content" WHERE "public"."Content"."sessionId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) OFFSET $31
info: Retrieved 30 sessions for page 1 {"service":"joining-dots-backend","timestamp":"2025-06-08T11:48:46.250Z"}
info: ::1 - - [08/Jun/2025:11:48:46 +0000] "GET /api/sessions?page=1&limit=50 HTTP/1.1" 200 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:48:46.252Z"}
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT COUNT(*) AS "_count._all" FROM (SELECT "public"."Session"."id" FROM "public"."Session" WHERE 1=1 OFFSET $1) AS "sub"
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT "public"."Session"."id", "public"."Session"."title", "public"."Session"."description", "public"."Session"."state"::text, "public"."Session"."invitedEmails", "public"."Session"."joiningCode", "public"."Session"."qrCode", "public"."Session"."startTime", "public"."Session"."endTime", "public"."Session"."expiryDate", "public"."Session"."maxParticipants", "public"."Session"."allowGuests", "public"."Session"."isActive", "public"."Session"."createdById", "public"."Session"."createdAt", "public"."Session"."updatedAt" FROM "public"."Session" WHERE 1=1 ORDER BY "public"."Session"."createdAt" DESC LIMIT $1 OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3) OFFSET $4
prisma:query SELECT "public"."_SessionParticipants"."A", "public"."_SessionParticipants"."B" FROM "public"."_SessionParticipants" WHERE "public"."_SessionParticipants"."A" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31) OFFSET $32
prisma:query SELECT "public"."_SessionInvited"."A", "public"."_SessionInvited"."B" FROM "public"."_SessionInvited" WHERE "public"."_SessionInvited"."A" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33) OFFSET $34
prisma:query SELECT "public"."Quiz"."id", "public"."Quiz"."title", "public"."Quiz"."timeLimitSeconds", "public"."Quiz"."pointsPerQuestion", "public"."Quiz"."passingScore", "public"."Quiz"."sessionId" FROM "public"."Quiz" WHERE "public"."Quiz"."sessionId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) OFFSET $31
prisma:query SELECT "public"."Poll"."id", "public"."Poll"."title", "public"."Poll"."type"::text, "public"."Poll"."sessionId" FROM "public"."Poll" WHERE "public"."Poll"."sessionId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) OFFSET $31
prisma:query SELECT "public"."Content"."id", "public"."Content"."title", "public"."Content"."type"::text, "public"."Content"."url", "public"."Content"."sessionId" FROM "public"."Content" WHERE "public"."Content"."sessionId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) OFFSET $31
info: Retrieved 30 sessions for page 1 {"service":"joining-dots-backend","timestamp":"2025-06-08T11:48:48.608Z"}
info: ::1 - - [08/Jun/2025:11:48:48 +0000] "GET /api/sessions?page=1&limit=50 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:48:48.610Z"}
info: ::1 - - [08/Jun/2025:11:49:18 +0000] "POST /api/auth/login HTTP/1.1" 401 33 "http://localhost:3001/login" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:18.509Z"}
info: ::1 - - [08/Jun/2025:11:49:22 +0000] "POST /api/auth/login HTTP/1.1" 401 33 "http://localhost:3001/login" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:22.605Z"}
info: ::1 - - [08/Jun/2025:11:49:41 +0000] "POST /api/auth/login HTTP/1.1" 200 614 "http://localhost:3001/login" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:41.703Z"}
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
info: ::1 - - [08/Jun/2025:11:49:47 +0000] "GET /api/dashboard HTTP/1.1" 200 - "http://localhost:3001/dashboard" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:47.918Z"}
prisma:query SELECT "public"."Session"."id", "public"."Session"."title", "public"."Session"."description", "public"."Session"."state"::text, "public"."Session"."invitedEmails", "public"."Session"."joiningCode", "public"."Session"."qrCode", "public"."Session"."startTime", "public"."Session"."endTime", "public"."Session"."expiryDate", "public"."Session"."maxParticipants", "public"."Session"."allowGuests", "public"."Session"."isActive", "public"."Session"."createdById", "public"."Session"."createdAt", "public"."Session"."updatedAt" FROM "public"."Session" WHERE EXISTS(SELECT "t0"."A" FROM "public"."_SessionParticipants" AS "t0" INNER JOIN "public"."User" AS "j0" ON ("j0"."id") = ("t0"."B") WHERE ("j0"."id" = $1 AND ("public"."Session"."id") = ("t0"."A") AND "t0"."A" IS NOT NULL)) ORDER BY "public"."Session"."updatedAt" DESC OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2) OFFSET $3
prisma:query SELECT "public"."_SessionParticipants"."A", "public"."_SessionParticipants"."B" FROM "public"."_SessionParticipants" WHERE "public"."_SessionParticipants"."A" IN ($1,$2,$3,$4,$5,$6)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) OFFSET $14
prisma:query SELECT "public"."Quiz"."id", "public"."Quiz"."title", "public"."Quiz"."timeLimitSeconds", "public"."Quiz"."pointsPerQuestion", "public"."Quiz"."passingScore", "public"."Quiz"."sessionId" FROM "public"."Quiz" WHERE "public"."Quiz"."sessionId" IN ($1,$2,$3,$4,$5,$6) OFFSET $7
prisma:query SELECT "public"."Poll"."id", "public"."Poll"."title", "public"."Poll"."type"::text, "public"."Poll"."sessionId" FROM "public"."Poll" WHERE "public"."Poll"."sessionId" IN ($1,$2,$3,$4,$5,$6) OFFSET $7
prisma:query SELECT "public"."Content"."id", "public"."Content"."title", "public"."Content"."type"::text, "public"."Content"."url", "public"."Content"."sessionId" FROM "public"."Content" WHERE "public"."Content"."sessionId" IN ($1,$2,$3,$4,$5,$6) OFFSET $7
info: Retrieved 6 sessions for user e62f61c5-185d-477e-9399-90a8e9d65f46 {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:48.711Z"}
info: ::1 - - [08/Jun/2025:11:49:48 +0000] "GET /api/sessions/user HTTP/1.1" 200 - "-" "node" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:48.715Z"}
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT "public"."Session"."id", "public"."Session"."title", "public"."Session"."description", "public"."Session"."state"::text, "public"."Session"."invitedEmails", "public"."Session"."joiningCode", "public"."Session"."qrCode", "public"."Session"."startTime", "public"."Session"."endTime", "public"."Session"."expiryDate", "public"."Session"."maxParticipants", "public"."Session"."allowGuests", "public"."Session"."isActive", "public"."Session"."createdById", "public"."Session"."createdAt", "public"."Session"."updatedAt" FROM "public"."Session" WHERE ("public"."Session"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."_SessionParticipants"."A", "public"."_SessionParticipants"."B" FROM "public"."_SessionParticipants" WHERE "public"."_SessionParticipants"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email", "public"."User"."companyPosition", "public"."User"."department" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4) OFFSET $5
prisma:query SELECT "public"."_SessionInvited"."A", "public"."_SessionInvited"."B" FROM "public"."_SessionInvited" WHERE "public"."_SessionInvited"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Quiz"."id", "public"."Quiz"."title", "public"."Quiz"."timeLimitSeconds", "public"."Quiz"."pointsPerQuestion", "public"."Quiz"."passingScore", "public"."Quiz"."sessionId" FROM "public"."Quiz" WHERE "public"."Quiz"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Poll"."id", "public"."Poll"."title", "public"."Poll"."type"::text, "public"."Poll"."sessionId" FROM "public"."Poll" WHERE "public"."Poll"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Content"."id", "public"."Content"."title", "public"."Content"."type"::text, "public"."Content"."url", "public"."Content"."sessionId" FROM "public"."Content" WHERE "public"."Content"."sessionId" IN ($1) OFFSET $2
info: Retrieved details for session fc23903d-5ed3-404b-b3bb-3f782b0a3e4e {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:51.547Z"}
info: ::1 - - [08/Jun/2025:11:49:51 +0000] "GET /api/sessions/fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 200 - "http://localhost:3001/dashboard/sessions/fc23903d-5ed3-404b-b3bb-3f782b0a3e4e" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:51.553Z"}
info: ::1 - - [08/Jun/2025:11:49:51 +0000] "GET /api/dashboard HTTP/1.1" - - "http://localhost:3001/dashboard" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:51.859Z"}
info: ::1 - - [08/Jun/2025:11:49:54 +0000] "GET /api/poll?sessionId=fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 200 - "-" "node" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:49:54.517Z"}
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT COUNT(*) AS "_count._all" FROM (SELECT "public"."Session"."id" FROM "public"."Session" WHERE 1=1 OFFSET $1) AS "sub"
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT "public"."Session"."id", "public"."Session"."title", "public"."Session"."description", "public"."Session"."state"::text, "public"."Session"."invitedEmails", "public"."Session"."joiningCode", "public"."Session"."qrCode", "public"."Session"."startTime", "public"."Session"."endTime", "public"."Session"."expiryDate", "public"."Session"."maxParticipants", "public"."Session"."allowGuests", "public"."Session"."isActive", "public"."Session"."createdById", "public"."Session"."createdAt", "public"."Session"."updatedAt" FROM "public"."Session" WHERE 1=1 ORDER BY "public"."Session"."createdAt" DESC LIMIT $1 OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2) OFFSET $3
prisma:query SELECT "public"."_SessionParticipants"."A", "public"."_SessionParticipants"."B" FROM "public"."_SessionParticipants" WHERE "public"."_SessionParticipants"."A" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9) OFFSET $10
prisma:query SELECT "public"."_SessionInvited"."A", "public"."_SessionInvited"."B" FROM "public"."_SessionInvited" WHERE "public"."_SessionInvited"."A" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) OFFSET $15
prisma:query SELECT "public"."Quiz"."id", "public"."Quiz"."title", "public"."Quiz"."timeLimitSeconds", "public"."Quiz"."pointsPerQuestion", "public"."Quiz"."passingScore", "public"."Quiz"."sessionId" FROM "public"."Quiz" WHERE "public"."Quiz"."sessionId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) OFFSET $11
prisma:query SELECT "public"."Poll"."id", "public"."Poll"."title", "public"."Poll"."type"::text, "public"."Poll"."sessionId" FROM "public"."Poll" WHERE "public"."Poll"."sessionId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) OFFSET $11
prisma:query SELECT "public"."Content"."id", "public"."Content"."title", "public"."Content"."type"::text, "public"."Content"."url", "public"."Content"."sessionId" FROM "public"."Content" WHERE "public"."Content"."sessionId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) OFFSET $11
info: Retrieved 10 sessions for page 1 {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:13.032Z"}
info: ::1 - - [08/Jun/2025:11:50:13 +0000] "GET /api/sessions?page=1&limit=10 HTTP/1.1" 200 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:13.034Z"}
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT "public"."Session"."id", "public"."Session"."title", "public"."Session"."description", "public"."Session"."state"::text, "public"."Session"."invitedEmails", "public"."Session"."joiningCode", "public"."Session"."qrCode", "public"."Session"."startTime", "public"."Session"."endTime", "public"."Session"."expiryDate", "public"."Session"."maxParticipants", "public"."Session"."allowGuests", "public"."Session"."isActive", "public"."Session"."createdById", "public"."Session"."createdAt", "public"."Session"."updatedAt" FROM "public"."Session" WHERE ("public"."Session"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."_SessionParticipants"."A", "public"."_SessionParticipants"."B" FROM "public"."_SessionParticipants" WHERE "public"."_SessionParticipants"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email", "public"."User"."companyPosition", "public"."User"."department" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4) OFFSET $5
prisma:query SELECT "public"."_SessionInvited"."A", "public"."_SessionInvited"."B" FROM "public"."_SessionInvited" WHERE "public"."_SessionInvited"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Quiz"."id", "public"."Quiz"."title", "public"."Quiz"."timeLimitSeconds", "public"."Quiz"."pointsPerQuestion", "public"."Quiz"."passingScore", "public"."Quiz"."sessionId" FROM "public"."Quiz" WHERE "public"."Quiz"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Poll"."id", "public"."Poll"."title", "public"."Poll"."type"::text, "public"."Poll"."sessionId" FROM "public"."Poll" WHERE "public"."Poll"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Content"."id", "public"."Content"."title", "public"."Content"."type"::text, "public"."Content"."url", "public"."Content"."sessionId" FROM "public"."Content" WHERE "public"."Content"."sessionId" IN ($1) OFFSET $2
info: Retrieved details for session fc23903d-5ed3-404b-b3bb-3f782b0a3e4e {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:16.587Z"}
info: ::1 - - [08/Jun/2025:11:50:16 +0000] "GET /api/sessions/fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:16.588Z"}
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT "public"."Session"."id", "public"."Session"."title", "public"."Session"."description", "public"."Session"."state"::text, "public"."Session"."invitedEmails", "public"."Session"."joiningCode", "public"."Session"."qrCode", "public"."Session"."startTime", "public"."Session"."endTime", "public"."Session"."expiryDate", "public"."Session"."maxParticipants", "public"."Session"."allowGuests", "public"."Session"."isActive", "public"."Session"."createdById", "public"."Session"."createdAt", "public"."Session"."updatedAt" FROM "public"."Session" WHERE ("public"."Session"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."_SessionParticipants"."A", "public"."_SessionParticipants"."B" FROM "public"."_SessionParticipants" WHERE "public"."_SessionParticipants"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email", "public"."User"."companyPosition", "public"."User"."department" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4) OFFSET $5
prisma:query SELECT "public"."_SessionInvited"."A", "public"."_SessionInvited"."B" FROM "public"."_SessionInvited" WHERE "public"."_SessionInvited"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Quiz"."id", "public"."Quiz"."title", "public"."Quiz"."timeLimitSeconds", "public"."Quiz"."pointsPerQuestion", "public"."Quiz"."passingScore", "public"."Quiz"."sessionId" FROM "public"."Quiz" WHERE "public"."Quiz"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Poll"."id", "public"."Poll"."title", "public"."Poll"."type"::text, "public"."Poll"."sessionId" FROM "public"."Poll" WHERE "public"."Poll"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Content"."id", "public"."Content"."title", "public"."Content"."type"::text, "public"."Content"."url", "public"."Content"."sessionId" FROM "public"."Content" WHERE "public"."Content"."sessionId" IN ($1) OFFSET $2
info: Retrieved details for session fc23903d-5ed3-404b-b3bb-3f782b0a3e4e {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:17.658Z"}
info: ::1 - - [08/Jun/2025:11:50:17 +0000] "GET /api/sessions/fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:17.660Z"}
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
prisma:query SELECT "public"."Session"."id", "public"."Session"."title", "public"."Session"."description", "public"."Session"."state"::text, "public"."Session"."invitedEmails", "public"."Session"."joiningCode", "public"."Session"."qrCode", "public"."Session"."startTime", "public"."Session"."endTime", "public"."Session"."expiryDate", "public"."Session"."maxParticipants", "public"."Session"."allowGuests", "public"."Session"."isActive", "public"."Session"."createdById", "public"."Session"."createdAt", "public"."Session"."updatedAt" FROM "public"."Session" WHERE ("public"."Session"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."_SessionParticipants"."A", "public"."_SessionParticipants"."B" FROM "public"."_SessionParticipants" WHERE "public"."_SessionParticipants"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email", "public"."User"."companyPosition", "public"."User"."department" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4) OFFSET $5
prisma:query SELECT "public"."_SessionInvited"."A", "public"."_SessionInvited"."B" FROM "public"."_SessionInvited" WHERE "public"."_SessionInvited"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Quiz"."id", "public"."Quiz"."title", "public"."Quiz"."timeLimitSeconds", "public"."Quiz"."pointsPerQuestion", "public"."Quiz"."passingScore", "public"."Quiz"."sessionId" FROM "public"."Quiz" WHERE "public"."Quiz"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Poll"."id", "public"."Poll"."title", "public"."Poll"."type"::text, "public"."Poll"."sessionId" FROM "public"."Poll" WHERE "public"."Poll"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Content"."id", "public"."Content"."title", "public"."Content"."type"::text, "public"."Content"."url", "public"."Content"."sessionId" FROM "public"."Content" WHERE "public"."Content"."sessionId" IN ($1) OFFSET $2
info: Retrieved details for session fc23903d-5ed3-404b-b3bb-3f782b0a3e4e {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:18.409Z"}
info: ::1 - - [08/Jun/2025:11:50:18 +0000] "GET /api/sessions/fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:18.410Z"}
info: ::1 - - [08/Jun/2025:11:50:21 +0000] "GET /api/poll?sessionId=fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:21.998Z"}
info: ::1 - - [08/Jun/2025:11:50:22 +0000] "GET /api/poll?sessionId=fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:22.709Z"}
info: ::1 - - [08/Jun/2025:11:50:38 +0000] "POST /api/poll/create HTTP/1.1" 201 99 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:38.580Z"}
Socket handshake query: [Object: null prototype] {
  authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYzY1NGUyNS04MDNiLTQyODUtOWI3ZS0yMmExZWI5ZDZkYzEiLCJpYXQiOjE3NDkzODMzMjIsImV4cCI6MTc0OTQ2OTcyMn0.6fUnlkNJuhMD1w-xDDryVjsle-x3kw5PlWglqdufgo0',
  EIO: '4',
  transport: 'websocket'
}
Found token in query.authorization
Verifying token
info: ::1 - - [08/Jun/2025:11:50:39 +0000] "GET /api/poll?sessionId=fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 200 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:39.301Z"}
User authenticated: Abhishek Parmar
Socket connected: PMOJs-DeyVZR7RGFAAAD
Debug - Received event: join-poll with args: [ '25c60dd2-a988-48df-a207-58a007673076' ]
🔸 DEBUG - Received join-poll event: 25c60dd2-a988-48df-a207-58a007673076
🔸 DEBUG - From socket: PMOJs-DeyVZR7RGFAAAD
🔸 DEBUG - User: Abhishek Parmar
Socket PMOJs-DeyVZR7RGFAAAD joining poll 25c60dd2-a988-48df-a207-58a007673076
Poll 25c60dd2-a988-48df-a207-58a007673076 now has 1 participants
🔸 DEBUG - No active question found for poll: 25c60dd2-a988-48df-a207-58a007673076
prisma:info Calling https://accelerate.prisma-data.net/6.4.1/71e4984348ffaddb0a68de02ad48558fe8fa7b6eeb4c3339abeb30fe6f6099d8/graphql (n=0)
info: ::1 - - [08/Jun/2025:11:50:40 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 200 484 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:40.385Z"}
prisma:query SELECT "public"."Session"."id", "public"."Session"."title", "public"."Session"."description", "public"."Session"."state"::text, "public"."Session"."invitedEmails", "public"."Session"."joiningCode", "public"."Session"."qrCode", "public"."Session"."startTime", "public"."Session"."endTime", "public"."Session"."expiryDate", "public"."Session"."maxParticipants", "public"."Session"."allowGuests", "public"."Session"."isActive", "public"."Session"."createdById", "public"."Session"."createdAt", "public"."Session"."updatedAt" FROM "public"."Session" WHERE ("public"."Session"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."_SessionParticipants"."A", "public"."_SessionParticipants"."B" FROM "public"."_SessionParticipants" WHERE "public"."_SessionParticipants"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email", "public"."User"."companyPosition", "public"."User"."department" FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2,$3,$4) OFFSET $5
prisma:query SELECT "public"."_SessionInvited"."A", "public"."_SessionInvited"."B" FROM "public"."_SessionInvited" WHERE "public"."_SessionInvited"."A" IN ($1)
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Quiz"."id", "public"."Quiz"."title", "public"."Quiz"."timeLimitSeconds", "public"."Quiz"."pointsPerQuestion", "public"."Quiz"."passingScore", "public"."Quiz"."sessionId" FROM "public"."Quiz" WHERE "public"."Quiz"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Poll"."id", "public"."Poll"."title", "public"."Poll"."type"::text, "public"."Poll"."sessionId" FROM "public"."Poll" WHERE "public"."Poll"."sessionId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Content"."id", "public"."Content"."title", "public"."Content"."type"::text, "public"."Content"."url", "public"."Content"."sessionId" FROM "public"."Content" WHERE "public"."Content"."sessionId" IN ($1) OFFSET $2
info: Retrieved details for session fc23903d-5ed3-404b-b3bb-3f782b0a3e4e {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:40.506Z"}
info: ::1 - - [08/Jun/2025:11:50:40 +0000] "GET /api/sessions/fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 200 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:40.507Z"}
info: ::1 - - [08/Jun/2025:11:50:41 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:41.243Z"}
info: ::1 - - [08/Jun/2025:11:50:41 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:50:41.970Z"}
info: ::1 - - [08/Jun/2025:11:51:09 +0000] "GET /api/poll?sessionId=fc23903d-5ed3-404b-b3bb-3f782b0a3e4e HTTP/1.1" 200 - "-" "node" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:51:09.587Z"}
🔍 DEBUG - joinPoll called
🔍 DEBUG - User ID: e62f61c5-185d-477e-9399-90a8e9d65f46
🔍 DEBUG - User Name: Ronit Kothari
🔍 DEBUG - Request body: { joiningCode: 'ZZ96IK' }
🔍 DEBUG - Joining code: ZZ96IK
🔍 DEBUG - Poll found: Yes
🔍 DEBUG - Poll ID: 25c60dd2-a988-48df-a207-58a007673076
🔍 DEBUG - Current participants: []
🔍 DEBUG - Is already participant: false
🔍 DEBUG - Adding user to poll participants
🔍 DEBUG - Poll updated successfully
🔍 DEBUG - Updated participants: [
  { id: 'e62f61c5-185d-477e-9399-90a8e9d65f46', name: 'Ronit Kothari' }
]
🔍 DEBUG - Participant count: 1
🔍 DEBUG - Broadcasting poll update via socket
🔹 DEBUG - Socket: Broadcasting update for poll 25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Room exists: true
🔹 DEBUG - Socket: Room size: 1
🔹 DEBUG - Socket: Update action: undefined
🔹 DEBUG - Socket: Emitting poll-updated to room poll:25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Broadcast complete
🔍 DEBUG - Returning success response
info: ::1 - - [08/Jun/2025:11:51:25 +0000] "POST /api/poll/join HTTP/1.1" 200 238 "-" "node" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:51:25.304Z"}
Socket handshake query: [Object: null prototype] {
  authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNjJmNjFjNS0xODVkLTQ3N2UtOTM5OS05MGE4ZTlkNjVmNDYiLCJpYXQiOjE3NDkzODMzODEsImV4cCI6MTc0OTQ2OTc4MX0.sfSbBrXz8Sf5StmcV3zJxdWER0EHgjq1mYAiPT_pI4w',
  EIO: '4',
  transport: 'websocket'
}
Found token in query.authorization
Verifying token
Socket handshake query: [Object: null prototype] {
  authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNjJmNjFjNS0xODVkLTQ3N2UtOTM5OS05MGE4ZTlkNjVmNDYiLCJpYXQiOjE3NDkzODMzODEsImV4cCI6MTc0OTQ2OTc4MX0.sfSbBrXz8Sf5StmcV3zJxdWER0EHgjq1mYAiPT_pI4w',
  EIO: '4',
  transport: 'websocket'
}
Found token in query.authorization
Verifying token
Socket handshake query: [Object: null prototype] {
  authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNjJmNjFjNS0xODVkLTQ3N2UtOTM5OS05MGE4ZTlkNjVmNDYiLCJpYXQiOjE3NDkzODMzODEsImV4cCI6MTc0OTQ2OTc4MX0.sfSbBrXz8Sf5StmcV3zJxdWER0EHgjq1mYAiPT_pI4w',
  EIO: '4',
  transport: 'websocket'
}
Found token in query.authorization
Verifying token
User authenticated: Ronit Kothari
Socket connected: lc1vH6SN6woJEn0-AAAF
User authenticated: Ronit Kothari
Socket connected: 5SPrSZSDdSK-XFn-AAAJ
Debug - Received event: join-poll with args: [ '25c60dd2-a988-48df-a207-58a007673076' ]
🔸 DEBUG - Received join-poll event: 25c60dd2-a988-48df-a207-58a007673076
🔸 DEBUG - From socket: 5SPrSZSDdSK-XFn-AAAJ
🔸 DEBUG - User: Ronit Kothari
Socket 5SPrSZSDdSK-XFn-AAAJ joining poll 25c60dd2-a988-48df-a207-58a007673076
Poll 25c60dd2-a988-48df-a207-58a007673076 now has 2 participants
🔸 DEBUG - No active question found for poll: 25c60dd2-a988-48df-a207-58a007673076
Debug - Received event: join-poll with args: [ '25c60dd2-a988-48df-a207-58a007673076' ]
🔸 DEBUG - Received join-poll event: 25c60dd2-a988-48df-a207-58a007673076
🔸 DEBUG - From socket: 5SPrSZSDdSK-XFn-AAAJ
🔸 DEBUG - User: Ronit Kothari
Socket 5SPrSZSDdSK-XFn-AAAJ joining poll 25c60dd2-a988-48df-a207-58a007673076
Poll 25c60dd2-a988-48df-a207-58a007673076 now has 2 participants
🔸 DEBUG - No active question found for poll: 25c60dd2-a988-48df-a207-58a007673076
User authenticated: Ronit Kothari
Socket connected: mpkofAgwwba1u7CMAAAH
Debug - Received event: join-poll with args: [ '25c60dd2-a988-48df-a207-58a007673076' ]
🔸 DEBUG - Received join-poll event: 25c60dd2-a988-48df-a207-58a007673076
🔸 DEBUG - From socket: 5SPrSZSDdSK-XFn-AAAJ
🔸 DEBUG - User: Ronit Kothari
Socket 5SPrSZSDdSK-XFn-AAAJ joining poll 25c60dd2-a988-48df-a207-58a007673076
Poll 25c60dd2-a988-48df-a207-58a007673076 now has 2 participants
🔸 DEBUG - No active question found for poll: 25c60dd2-a988-48df-a207-58a007673076
Debug - Received event: join-poll with args: [ '25c60dd2-a988-48df-a207-58a007673076' ]
🔸 DEBUG - Received join-poll event: 25c60dd2-a988-48df-a207-58a007673076
🔸 DEBUG - From socket: 5SPrSZSDdSK-XFn-AAAJ
🔸 DEBUG - User: Ronit Kothari
Socket 5SPrSZSDdSK-XFn-AAAJ joining poll 25c60dd2-a988-48df-a207-58a007673076
Poll 25c60dd2-a988-48df-a207-58a007673076 now has 2 participants
🔸 DEBUG - No active question found for poll: 25c60dd2-a988-48df-a207-58a007673076
info: ::1 - - [08/Jun/2025:11:51:41 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 200 552 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:51:41.963Z"}
info: ::1 - - [08/Jun/2025:11:51:43 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:51:43.193Z"}
Debug - Received event: leave-poll with args: [ { pollId: '25c60dd2-a988-48df-a207-58a007673076' } ]
Received leave-poll event: { pollId: '25c60dd2-a988-48df-a207-58a007673076' }
Socket PMOJs-DeyVZR7RGFAAAD leaving poll [object Object]
Poll [object Object] now has 0 participants
Error fetching poll participants: PrismaClientValidationError: 
Invalid `prisma.poll.findUnique()` invocation in
/home/ronit/Documents/Projects/joining_dots_backend/src/services/socket.service.ts:175:48

  172 private async getPollParticipants(pollId: string): Promise<Participant[]> {
  173   try {
  174     // Fetch actual participants from database who joined via REST API
→ 175     const dbParticipants = await prisma.poll.findUnique({
            where: {
              id: {
                pollId: "25c60dd2-a988-48df-a207-58a007673076"
              }
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            },
            include: {
              participants: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profilePhoto: true
                }
              }
            }
          })

Argument `id`: Invalid value provided. Expected String, provided Object.
    at Pn (/home/ronit/Documents/Projects/joining_dots_backend/node_modules/.pnpm/@prisma+client@6.4.1_prisma@6.4.1_typescript@5.7.3__typescript@5.7.3/node_modules/@prisma/client/runtime/library.js:29:1363)
    at Un.handleRequestError (/home/ronit/Documents/Projects/joining_dots_backend/node_modules/.pnpm/@prisma+client@6.4.1_prisma@6.4.1_typescript@5.7.3__typescript@5.7.3/node_modules/@prisma/client/runtime/library.js:121:7090)
    at Un.handleAndLogRequestError (/home/ronit/Documents/Projects/joining_dots_backend/node_modules/.pnpm/@prisma+client@6.4.1_prisma@6.4.1_typescript@5.7.3__typescript@5.7.3/node_modules/@prisma/client/runtime/library.js:121:6771)
    at Un.request (/home/ronit/Documents/Projects/joining_dots_backend/node_modules/.pnpm/@prisma+client@6.4.1_prisma@6.4.1_typescript@5.7.3__typescript@5.7.3/node_modules/@prisma/client/runtime/library.js:121:6478)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at l (/home/ronit/Documents/Projects/joining_dots_backend/node_modules/.pnpm/@prisma+client@6.4.1_prisma@6.4.1_typescript@5.7.3__typescript@5.7.3/node_modules/@prisma/client/runtime/library.js:130:9644)
    at SocketService.getPollParticipants (/home/ronit/Documents/Projects/joining_dots_backend/src/services/socket.service.ts:175:30)
    at SocketService.emitParticipantUpdates (/home/ronit/Documents/Projects/joining_dots_backend/src/services/socket.service.ts:227:26) {
  clientVersion: '6.4.1'
}
info: ::1 - - [08/Jun/2025:11:53:28 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:53:28.062Z"}
info: ::1 - - [08/Jun/2025:11:53:48 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:53:48.811Z"}
info: ::1 - - [08/Jun/2025:11:53:51 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:53:51.804Z"}
info: ::1 - - [08/Jun/2025:11:53:53 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:53:53.495Z"}
Socket disconnected: lc1vH6SN6woJEn0-AAAF
Socket disconnected: 5SPrSZSDdSK-XFn-AAAJ
Socket disconnected: mpkofAgwwba1u7CMAAAH
Socket handshake query: [Object: null prototype] {
  authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNjJmNjFjNS0xODVkLTQ3N2UtOTM5OS05MGE4ZTlkNjVmNDYiLCJpYXQiOjE3NDkzODMzODEsImV4cCI6MTc0OTQ2OTc4MX0.sfSbBrXz8Sf5StmcV3zJxdWER0EHgjq1mYAiPT_pI4w',
  EIO: '4',
  transport: 'websocket'
}
Found token in query.authorization
Verifying token
User authenticated: Ronit Kothari
Socket connected: tL0IwFZf_JDyVGqvAAAL
Debug - Received event: join-poll with args: [ '25c60dd2-a988-48df-a207-58a007673076' ]
🔸 DEBUG - Received join-poll event: 25c60dd2-a988-48df-a207-58a007673076
🔸 DEBUG - From socket: tL0IwFZf_JDyVGqvAAAL
🔸 DEBUG - User: Ronit Kothari
Socket tL0IwFZf_JDyVGqvAAAL joining poll 25c60dd2-a988-48df-a207-58a007673076
Poll 25c60dd2-a988-48df-a207-58a007673076 now has 2 participants
🔸 DEBUG - No active question found for poll: 25c60dd2-a988-48df-a207-58a007673076
Debug - Received event: join-poll with args: [ '25c60dd2-a988-48df-a207-58a007673076' ]
🔸 DEBUG - Received join-poll event: 25c60dd2-a988-48df-a207-58a007673076
🔸 DEBUG - From socket: tL0IwFZf_JDyVGqvAAAL
🔸 DEBUG - User: Ronit Kothari
Socket tL0IwFZf_JDyVGqvAAAL joining poll 25c60dd2-a988-48df-a207-58a007673076
Poll 25c60dd2-a988-48df-a207-58a007673076 now has 2 participants
🔸 DEBUG - No active question found for poll: 25c60dd2-a988-48df-a207-58a007673076
info: ::1 - - [08/Jun/2025:11:54:16 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 200 552 "-" "node" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:54:16.946Z"}
🔍 DEBUG - Adding poll question - Socket service exists: true
🔍 DEBUG - Broadcasting new question for poll: 25c60dd2-a988-48df-a207-58a007673076
🔍 DEBUG - Poll room size: 2
🔍 DEBUG - Event data being sent: {"action":"new-question","data":{"poll":{"id":"25c60dd2-a988-48df-a207-58a007673076","title":"joiningcodetest3"},"question":{"id":"c50de6f1-5e44-4e86-8176-cca932435c13","question":"what i this ","type":"WORD_CLOUD","timeLimit":30,"options":[]},"startedAt":"2025-06-08T11:54:31.414Z"}}
🔹 DEBUG - Socket: Broadcasting update for poll 25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Room exists: true
🔹 DEBUG - Socket: Room size: 2
🔹 DEBUG - Socket: Update action: new-question
🔹 DEBUG - Socket: Setting active question for poll 25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Question started at: 2025-06-08T11:54:31.414Z
🔹 DEBUG - Socket: Emitting poll-updated to room poll:25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Emitting active-question to room poll:25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Broadcast complete
🔍 DEBUG - Setting timer to end question after 30 seconds
info: ::1 - - [08/Jun/2025:11:54:32 +0000] "POST /api/poll/question HTTP/1.1" 201 166 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:54:32.975Z"}
info: ::1 - - [08/Jun/2025:11:54:33 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 200 549 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:54:33.605Z"}
info: ::1 - - [08/Jun/2025:11:54:35 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:54:35.220Z"}
🔍 DEBUG - Submitting poll response
🔍 DEBUG - Question type: WORD_CLOUD
🔍 DEBUG - Response type: WORD_CLOUD, Answer: test3
🔍 DEBUG - Broadcasting response via WebSocket
🔹 DEBUG - Socket: Broadcasting update for poll 25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Room exists: true
🔹 DEBUG - Socket: Room size: 2
🔹 DEBUG - Socket: Update action: new-response
🔹 DEBUG - Socket: Emitting poll-updated to room poll:25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Broadcast complete
🔍 DEBUG - Response broadcast completed
info: ::1 - - [08/Jun/2025:11:54:46 +0000] "POST /api/poll/25c60dd2-a988-48df-a207-58a007673076/response HTTP/1.1" 201 336 "-" "node" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:54:46.388Z"}
info: ::1 - - [08/Jun/2025:11:54:48 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 200 549 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:54:48.226Z"}
info: ::1 - - [08/Jun/2025:11:54:49 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:54:49.911Z"}
Debug - Received event: join-poll with args: [ '25c60dd2-a988-48df-a207-58a007673076' ]
🔸 DEBUG - Received join-poll event: 25c60dd2-a988-48df-a207-58a007673076
🔸 DEBUG - From socket: PMOJs-DeyVZR7RGFAAAD
🔸 DEBUG - User: Abhishek Parmar
Socket PMOJs-DeyVZR7RGFAAAD joining poll 25c60dd2-a988-48df-a207-58a007673076
🔸 DEBUG - Sending active question to new participant: PMOJs-DeyVZR7RGFAAAD
Poll 25c60dd2-a988-48df-a207-58a007673076 now has 2 participants
🔸 DEBUG - Sending active question to new participant: PMOJs-DeyVZR7RGFAAAD
info: ::1 - - [08/Jun/2025:11:54:56 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:54:56.742Z"}
info: ::1 - - [08/Jun/2025:11:54:58 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:54:58.030Z"}
🔍 DEBUG - Timer expired for poll 25c60dd2-a988-48df-a207-58a007673076. Ending question automatically.
🔍 DEBUG - Current poll: {
  id: '25c60dd2-a988-48df-a207-58a007673076',
  title: 'joiningcodetest3',
  question: '',
  sessionId: 'fc23903d-5ed3-404b-b3bb-3f782b0a3e4e',
  joiningCode: 'ZZ96IK',
  type: 'SINGLE_CHOICE',
  isLive: true,
  showResults: false,
  isPublic: true,
  maxVotes: null,
  timeLimit: 30,
  responseLimit: null,
  moderationEnabled: false,
  autoRefresh: true,
  createdAt: 2025-06-08T11:50:38.283Z,
  updatedAt: 2025-06-08T11:54:32.005Z,
  _count: { questions: 1 }
}
🔍 DEBUG - Active question: {
  action: 'new-question',
  data: {
    poll: {
      id: '25c60dd2-a988-48df-a207-58a007673076',
      title: 'joiningcodetest3'
    },
    question: {
      id: 'c50de6f1-5e44-4e86-8176-cca932435c13',
      question: 'what i this ',
      type: 'WORD_CLOUD',
      timeLimit: 30,
      options: []
    },
    startedAt: '2025-06-08T11:54:31.414Z'
  },
  startedAt: '2025-06-08T11:54:31.414Z'
}
🔍 DEBUG - Poll is still live, proceeding with auto-end
🔹 DEBUG - Socket: Ending active question for poll 25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Active question exists: true
🔹 DEBUG - Socket: Active question data: {
  action: 'new-question',
  data: {
    poll: {
      id: '25c60dd2-a988-48df-a207-58a007673076',
      title: 'joiningcodetest3'
    },
    question: {
      id: 'c50de6f1-5e44-4e86-8176-cca932435c13',
      question: 'what i this ',
      type: 'WORD_CLOUD',
      timeLimit: 30,
      options: []
    },
    startedAt: '2025-06-08T11:54:31.414Z'
  },
  startedAt: '2025-06-08T11:54:31.414Z'
}
🔹 DEBUG - Socket: Emitting question-ended event to room poll:25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Room exists: true
🔹 DEBUG - Socket: Room size: 2
🔹 DEBUG - Socket: Question ended event emitted
🔹 DEBUG - Socket: Broadcasting update for poll 25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Room exists: true
🔹 DEBUG - Socket: Room size: 2
🔹 DEBUG - Socket: Update action: question-results
🔹 DEBUG - Socket: Broadcasting question results for poll 25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Question type: WORD_CLOUD
🔹 DEBUG - Socket: Total responses: 1
🔹 DEBUG - Socket: Emitting poll-updated to room poll:25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Broadcast complete
🔹 DEBUG - Socket: Broadcasting update for poll 25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Room exists: true
🔹 DEBUG - Socket: Room size: 2
🔹 DEBUG - Socket: Update action: poll-ended
🔹 DEBUG - Socket: Emitting poll-updated to room poll:25c60dd2-a988-48df-a207-58a007673076
🔹 DEBUG - Socket: Broadcast complete
🔍 DEBUG - Question ended automatically after time limit
info: ::1 - - [08/Jun/2025:11:55:05 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 200 549 "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:55:05.223Z"}
info: ::1 - - [08/Jun/2025:11:55:06 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:55:06.552Z"}
info: ::1 - - [08/Jun/2025:11:55:07 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:55:07.272Z"}
info: ::1 - - [08/Jun/2025:11:55:07 +0000] "GET /api/poll/25c60dd2-a988-48df-a207-58a007673076 HTTP/1.1" 304 - "http://localhost:3000/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" {"service":"joining-dots-backend","timestamp":"2025-06-08T11:55:07.989Z"}