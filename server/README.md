# Task Sync Server

## Description
A server for synchronizing tasks between clients. Supports REST API and WebSocket for real-time task exchange. Authentication via JWT. User data is stored in a lowdb database (`db.json`).

## Usage in Your Project (GitHub)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/task-sync-server.git
   cd task-sync-server
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables (optional):**
   - `PORT` — server port (default: 3001)
   - `JWT_SECRET` — secret for signing JWT (default: 'supersecret')
   - Example `.env` file:
     ```env
     PORT=3001
     JWT_SECRET=your_secret
     ```
4. **Start the server:**
   ```bash
   node index.js
   ```
5. **Integrate with your client:**
   - Use the REST and WebSocket API to synchronize tasks.
   - Example client — see the `client` folder in this repository or implement your own.

## Project Structure
- `index.js` — main server file
- `db.json` — user and task database (created automatically)
- `package.json` — dependencies and scripts
- `README.md` — documentation

## REST API

### POST /login
- Obtain a JWT token for any username (no registration required).
- Request body:
  ```json
  { "username": "your_username" }
  ```
- Response:
  ```json
  { "token": "..." }
  ```

### POST /sync
- Send a list of tasks to the server for synchronization.
- Request body:
  ```json
  { "tasks": [ ... ] }
  ```
- The server merges tasks by `taskId` and `updatedAt` (Last-Write-Wins), returns the current user's task list.
- Response:
  ```json
  { "tasks": [ ... ] }
  ```

### GET /sync
- Get the current user's task list.
- Response:
  ```json
  { "tasks": [ ... ] }
  ```

## WebSocket API
- Connect to: ws://localhost:3001
- After connecting, send:
  ```json
  { "type": "sync_request", "token": "..." }
  ```
- The server responds with:
  - `{ "type": "sync_response", "tasks": [...] }` — current task list
  - `{ "type": "task_update", "tasks": [...] }` — task updates on changes

## Synchronization & Data Storage
- Each user (username) has their own task list stored in `db.json`.
- All read/write operations go through lowdb.
- When a user's tasks change, the server sends updates only to clients with the same username via WebSocket.
- Conflicts are resolved using the `updatedAt` field (Last-Write-Wins).

## Task Example
```json
{
  "taskId": 1,
  "taskName": "string",
  "isCompleted": false,
  "dateBox": "today" | "week" | "later",
  "updatedAt": "2024-06-09T12:00:00Z"
}
```

## Example Requests

### Get a token
```bash
curl -X POST http://localhost:3001/login -H 'Content-Type: application/json' -d '{"username":"user1"}'
```

### Get tasks
```bash
curl http://localhost:3001/sync -H 'Authorization: Bearer <token>'
```

### Synchronize tasks
```bash
curl -X POST http://localhost:3001/sync -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"tasks":[]}'
```

## Production Recommendations
- Use a unique and strong `JWT_SECRET`.
- Deploy the server behind HTTPS.
- For scaling, consider a more robust database (e.g., PostgreSQL).
- Set up regular backups for `db.json`.

## Contributing
PRs and suggestions are welcome! Open issues or create pull requests. 