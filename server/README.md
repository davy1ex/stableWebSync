# Task Sync Client

A modern React client for the Task Synchronization System. Uses Zustand for state management and persistence, and communicates with the backend via REST and WebSocket APIs.

## Features

- Login with any username (JWT-based, no registration)
- Add, complete, and manage tasks
- Real-time updates between all logged-in clients
- Persistent state (localStorage) and optimistic UI
- Modular architecture (FSD2): features, entities, widgets, pages

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm start
```

The app will be available at [http://localhost:8080](http://localhost:8080).

### 3. Build for production

```bash
npm run build
```

## Project Structure

- `src/app/` — App entry point and global styles
- `src/pages/` — Main and Auth pages
- `src/features/` — Auth and AddTask features
- `src/entities/` — Task entity (model, API, UI)
- `src/widgets/` — TaskList, Board, ListColumn widgets

## API Integration

- **REST:** `/login`, `/sync`
- **WebSocket:** Real-time task updates

See [docs/Project.md](../docs/Project.md) for full API details.

## Development Notes

- State is managed with Zustand and persisted in localStorage.
- All user actions are synchronized with the server and other clients.
- The UI is fully driven by the global store for consistency.

## Testing

- Unit and integration tests are set up with Jest and React Testing Library.
- To run tests:
  ```bash
  npm test
  ```

## Troubleshooting

- Ensure the server is running at `http://localhost:3001`.
- JWT tokens are stored in localStorage and used for all API requests.

## License

MIT (or your chosen license)
```