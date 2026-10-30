# Opsentra Business OS API

Base URL:

```text
http://localhost:5001
```

Production API:

```text
https://nexora-api-hw00.onrender.com
```

## Authentication

Opsentra uses JWT-based authentication with the token stored in an HTTP-only cookie named `token`.

The login cookie expires after 7 days.

Protected requests must include the authentication cookie.

---

## Auth Endpoints

### Register User

```http
POST /api/auth/register
```

Request body:

```json
{
  "name": "Jayesh Thakur",
  "email": "jayesh@example.com",
  "password": "strongpassword"
}
```

Rules:

- `name` is required
- `email` is required
- `email` must be valid
- `password` is required
- `password` must contain at least 8 characters
- email addresses are normalized to lowercase

Success response:

```http
201 Created
```

```json
{
  "user": {
    "id": "USER_ID",
    "name": "Jayesh Thakur",
    "email": "jayesh@example.com"
  }
}
```

Possible errors:

```http
400 Bad Request
```

```json
{
  "message": "Name, email, and password are required"
}
```

```json
{
  "message": "Password must be at least 8 characters long"
}
```

```json
{
  "message": "Please enter a valid email address"
}
```

```http
409 Conflict
```

```json
{
  "message": "User with this email already exists"
}
```

---

### Login User

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "jayesh@example.com",
  "password": "strongpassword"
}
```

Success response:

```http
200 OK
```

```json
{
  "user": {
    "id": "USER_ID",
    "name": "Jayesh Thakur",
    "email": "jayesh@example.com"
  }
}
```

A successful login also sets the HTTP-only `token` cookie.

Possible errors:

```http
400 Bad Request
```

```json
{
  "message": "Email and password are required"
}
```

```http
401 Unauthorized
```

```json
{
  "message": "Invalid email or password"
}
```

---

### Get Current User

```http
GET /api/auth/me
```

Authentication required.

Success response:

```http
200 OK
```

```json
{
  "user": {
    "id": "USER_ID",
    "name": "Jayesh Thakur",
    "email": "jayesh@example.com"
  }
}
```

Possible response when the authenticated user no longer exists:

```http
401 Unauthorized
```

```json
{
  "message": "User no longer exists"
}
```

---

### Logout User

```http
POST /api/auth/logout
```

Clears the authentication cookie.

Success response:

```http
200 OK
```

```json
{
  "message": "Logged out successfully"
}
```

---

## Project Endpoints

All `/api/projects` routes require authentication.

Projects are scoped to the authenticated user. A user can only access projects owned by their own account.

### Project Fields

```json
{
  "name": "Retail Expansion Program",
  "client": "Meridian Retail Pvt. Ltd.",
  "status": "In Progress",
  "priority": "High",
  "deadline": "2026-10-15",
  "budget": 850000,
  "progress": 70,
  "description": "Expansion and refurbishment initiative."
}
```

Field rules:

| Field         | Type   | Rules                                                |
| ------------- | ------ | ---------------------------------------------------- |
| `name`        | String | Required                                             |
| `client`      | String | Required                                             |
| `status`      | String | `Planning`, `In Progress`, `On Hold`, or `Completed` |
| `priority`    | String | `Low`, `Medium`, or `High`                           |
| `deadline`    | Date   | Required                                             |
| `budget`      | Number | Required, minimum `1`                                |
| `progress`    | Number | Minimum `0`, maximum `100`                           |
| `description` | String | Optional                                             |

Defaults:

```text
status   = Planning
priority = Medium
progress = 0
```

The `owner` field is assigned by the server from the authenticated user and cannot be reassigned through project updates.

---

### Get All Projects

```http
GET /api/projects
```

Returns only projects owned by the authenticated user.

Success response:

```http
200 OK
```

```json
{
  "projects": [
    {
      "_id": "PROJECT_ID",
      "name": "Retail Expansion Program",
      "client": "Meridian Retail Pvt. Ltd.",
      "status": "In Progress",
      "priority": "High",
      "deadline": "2026-10-15T00:00:00.000Z",
      "budget": 850000,
      "progress": 70,
      "description": "Expansion and refurbishment initiative.",
      "owner": "USER_ID"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### Create Project

```http
POST /api/projects
```

Request body:

```json
{
  "name": "Retail Expansion Program",
  "client": "Meridian Retail Pvt. Ltd.",
  "status": "In Progress",
  "priority": "High",
  "deadline": "2026-10-15",
  "budget": 850000,
  "progress": 70,
  "description": "Expansion and refurbishment initiative."
}
```

Success response:

```http
201 Created
```

Returns the created project.

Validation error:

```http
400 Bad Request
```

```json
{
  "message": "Project validation failed",
  "errors": {
    "progress": "Path `progress` (120) is more than maximum allowed value (100)."
  }
}
```

---

### Get Project By ID

```http
GET /api/projects/:projectId
```

Returns the project only when it belongs to the authenticated user.

Success response:

```http
200 OK
```

Invalid MongoDB ID:

```http
400 Bad Request
```

```json
{
  "message": "Invalid project ID"
}
```

Project not found or not owned by the authenticated user:

```http
404 Not Found
```

```json
{
  "message": "Project not found"
}
```

---

### Update Project

```http
PATCH /api/projects/:projectId
```

Only the fields included in the request body are updated.

Example request:

```json
{
  "status": "Completed",
  "progress": 100
}
```

Success response:

```http
200 OK
```

Returns the updated project.

The `owner` field is ignored if it is included in the request body.

Invalid project ID:

```http
400 Bad Request
```

```json
{
  "message": "Invalid project ID"
}
```

Validation failure:

```http
400 Bad Request
```

```json
{
  "message": "Project validation failed",
  "errors": {
    "progress": "Path `progress` (120) is more than maximum allowed value (100)."
  }
}
```

Project not found or not owned by the authenticated user:

```http
404 Not Found
```

```json
{
  "message": "Project not found"
}
```

---

### Delete Project

```http
DELETE /api/projects/:projectId
```

Deletes the project only when it belongs to the authenticated user.

Success response:

```http
200 OK
```

```json
{
  "message": "Project deleted successfully",
  "project": {
    "_id": "PROJECT_ID"
  }
}
```

Invalid project ID:

```http
400 Bad Request
```

```json
{
  "message": "Invalid project ID"
}
```

Project not found or not owned by the authenticated user:

```http
404 Not Found
```

```json
{
  "message": "Project not found"
}
```

---

## Task Endpoints

All task endpoints require authentication. Users can only access tasks belonging to their own projects.

### Create Task

`POST /api/projects/:projectId/tasks`

Request:

```json
{
  "title": "Design dashboard",
  "description": "Create dashboard UI",
  "status": "To Do",
  "priority": "High",
  "dueDate": "2026-11-10"
}
```

Success: `201 Created`

Returns the created task.

### Get Project Tasks

`GET /api/projects/:projectId/tasks`

Success: `200 OK`

```json
{
  "tasks": [
    {
      "_id": "TASK_ID",
      "title": "Design dashboard",
      "description": "Create dashboard UI",
      "project": "PROJECT_ID",
      "status": "To Do",
      "priority": "High",
      "dueDate": "2026-11-10T00:00:00.000Z"
    }
  ]
}
```

### Update Task

`PATCH /api/projects/:projectId/tasks/:taskId`

Request:

```json
{
  "status": "Completed"
}
```

Success: `200 OK`

Returns the updated task.

### Delete Task

`DELETE /api/projects/:projectId/tasks/:taskId`

Success: `200 OK`

```json
{
  "message": "Task deleted successfully"
}
```

### Task Validation and Errors

- `title`: Required for creation, 1–120 characters.
- `description`: Optional, maximum 2000 characters.
- `status`: To Do, In Progress, Completed.
- `priority`: Low, Medium, High.
- `dueDate`: Optional, valid date.

Possible error responses:

- `400 Bad Request` — Invalid ID or request data.
- `401 Unauthorized` — Authentication required.
- `404 Not Found` — Project or task not found, or project not owned by user.
- `500 Internal Server Error` — Server failure.

---

## Health Check

```http
GET /api/health
```

Success response:

```http
200 OK
```

```json
{
  "status": "ok"
}
```
