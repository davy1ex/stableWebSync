## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/task-sync-system.git
cd task-sync-system
```

### 2. Start the server

```bash
cd server
npm install
node index.js
```

The server will run on `http://localhost:3001` by default.

### 3. Start the client

```bash
cd ../client
npm install
npm start
```

The client will run on `http://localhost:8080` (or as configured).

## Technologies

- **Client:** React, TypeScript, Zustand, FSD2, Webpack
- **Server:** Node.js, Express, WebSocket, JWT, lowdb

