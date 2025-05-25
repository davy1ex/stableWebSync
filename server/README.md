# Task Sync Server

A Node.js server for synchronizing tasks between clients. Supports REST API and WebSocket for real-time task exchange. Authentication via JWT. User data is stored in a lowdb database (`db.json`).

## Features

- REST and WebSocket APIs for task synchronization
- JWT-based authentication (username only, no registration)
- Per-user task isolation
- Last-Write-Wins conflict resolution
- Real-time push updates to all connected clients
- Simple file-based persistence (lowdb)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
node index.js
```

The server will run on `http://localhost:3001` by default.

### 3. Environment Variables (optional)
- `PORT` — server port (default: 3001)
- `JWT_SECRET` — secret for signing JWT (default: 'supersecret')

## API Reference

### POST `/login`
- Obtain a JWT token for any username (no registration required).
- Request body:
  ```json
  { "username": "your_username" }
  ```
- Response:
  ```json
  { "token": "..." }
  ```

### GET `/sync`
- Get the current user's task list (requires JWT in `Authorization` header).
- Response:
  ```json
  { "tasks": [ ... ] }
  ```

### POST `/sync`
- Send a list of tasks to the server for synchronization (requires JWT).
- Each task **must** have a unique `taskId` and an `updatedAt` field (ISO8601 string).
- Request body:
  ```json
  { "tasks": [ ... ] }
  ```
- The server merges tasks by `taskId` and `updatedAt` (Last-Write-Wins), returns the current user's task list.
- Response:
  ```json
  { "tasks": [ ... ] }
  ```

## WebSocket API
- Connect to: `ws://localhost:3001`
- After connecting, send:
  ```json
  { "type": "sync_request", "token": "..." }
  ```
- The server responds with:
  - `{ "type": "sync_response", "tasks": [...] }` — current task list
  - `{ "type": "task_update", "tasks": [...] }` — task updates on changes

## Data Model
- Each user (username) has their own task list stored in `db.json`:
  ```json
  {
    "userTasks": {
      "username": [
        {
          "taskId": 1,
          "taskName": "string",
          "isCompleted": false,
          "dateBox": "today" | "week" | "later",
          "updatedAt": "2024-06-09T12:00:00Z"
        }
      ]
    }
  }
  ```
- All read/write operations go through lowdb.
- When a user's tasks change, the server sends updates only to clients with the same username via WebSocket.
- Conflicts are resolved using the `updatedAt` field (Last-Write-Wins).

## Testing

- Unit and integration tests are provided in the `test/` directory.
- To run tests:
  ```bash
  npm test
  ```
- Tests cover:
  - REST API endpoints
  - JWT authentication middleware
  - Utility functions (task merging, date comparison, boolean conversion)

## Production Notes

- Use a unique and strong `JWT_SECRET`.
- Deploy the server behind HTTPS.
- For scaling, consider a more robust database (e.g., PostgreSQL).
- Set up regular backups for `db.json`.

## Troubleshooting

- Ensure every task sent to the server includes a valid `updatedAt` field.
- If you migrate old data, add `updatedAt` to all existing tasks.
- For more details, see the main project [docs/Project.md](../docs/Project.md).
