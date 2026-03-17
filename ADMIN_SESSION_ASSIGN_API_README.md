# Assign Users Directly to a Session

This short guide documents the new API endpoint that lets an **admin** (or the session creator) add registered users to a session without requiring them to enter the session code.

---

## Endpoint

| Method | URL |
| ------ | ---------------------------------------------- |
| POST   | `/api/sessions/:sessionId/assign` |

* `:sessionId` – UUID of the target session.

### Permissions

* **Admin** users can call this for any session.
* Non-admin users can call it **only** for sessions they created.

---

## Request

```json
{
  "userIds": [
    "<user-uuid-1>",
    "<user-uuid-2>"
  ]
}
```

* `userIds` – array of user UUIDs (must contain at least one element).

### Validation rules

1. All IDs must be valid UUIDs of active users.
2. Users already in the session are skipped with an error.
3. `maxParticipants` limit (if set) is enforced.

---

## Success Response (200)

```json
{
  "success": true,
  "message": "Users successfully assigned to the session",
  "data": {
    "sessionId": "<session-uuid>",
    "participantsCount": 12,
    "participants": [
      {
        "id": "<user-uuid-1>",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "companyPosition": "Manager",
        "department": "Sales"
      },
      "..."
    ]
  }
}
```

---

## Error Responses

| Status | Reason |
| ------ | ----------------------------------------------------------------------------- |
| 400    | Invalid body, user already participant, max participants exceeded, etc. |
| 403    | Caller is neither an admin nor the creator of the session. |
| 404    | Session not found. |

---

## Front-end Usage Tips

1. Display a list/search of registered users and collect their IDs.
2. Send the above POST request after authentication (Bearer token).
3. On success, refresh the participant list in the UI.

---

_Last updated: {{DATE}}_ 