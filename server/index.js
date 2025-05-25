const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const { JSONFilePreset } = require('lowdb/node');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'supersecret'; // Вынести в env для продакшена
const dbFile = path.join(__dirname, 'db.json');
let db;

app.use(cors());
app.use(express.json());

// initialise database
async function initDB() {
  db = await JSONFilePreset(dbFile, { userTasks: {} });
}
initDB();

// JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// REST API
app.post('/sync', authenticateToken, async (req, res) => {
  await db.read();
  const username = req.user.username;
  db.data ||= { userTasks: {} };
  db.data.userTasks[username] ||= [];
  const { tasks: clientTasks } = req.body;
  // merge tasks by updatedAt (Last-Write-Wins)
  for (const clientTask of clientTasks) {
    const idx = db.data.userTasks[username].findIndex(t => t.taskId === clientTask.taskId);
    if (idx === -1) {
      db.data.userTasks[username].push(clientTask);
    } else {
      if (new Date(clientTask.updatedAt) > new Date(db.data.userTasks[username][idx].updatedAt)) {
        db.data.userTasks[username][idx] = clientTask;
      }
    }
  }
  await db.write();
  res.json({ tasks: db.data.userTasks[username] });
  broadcastTasks(username);
});

app.get('/sync', authenticateToken, async (req, res) => {
  await db.read();
  const username = req.user.username;
  res.json({ tasks: db.data.userTasks[username] || [] });
});

// example of login endpoint (dev only)
app.post('/login', (req, res) => {
  const { username } = req.body;
  // in real project - check user
  const user = { username };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// WebSocket
const wss = new WebSocketServer({ server });

function broadcastTasks(username) {
  db.read().then(() => {
    const data = JSON.stringify({ type: 'task_update', tasks: db.data.userTasks[username] || [] });
    wss.clients.forEach(client => {
      if (client.readyState === 1 && client.username === username) {
        client.send(data);
      }
    });
  });
}

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'sync_request' && data.token) {
        jwt.verify(data.token, JWT_SECRET, async (err, user) => {
          if (err) return;
          ws.username = user.username;
          await db.read();
          ws.send(JSON.stringify({ type: 'sync_response', tasks: db.data.userTasks[user.username] || [] }));
        });
      }
    } catch (e) {}
  });
  // ws.username будет установлен после sync_request
}); 