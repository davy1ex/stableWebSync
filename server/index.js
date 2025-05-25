const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const { JSONFilePreset } = require('lowdb/node');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'supersecret'; // Move to env for production
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
  console.log('INCOMING TASKS:', JSON.stringify(clientTasks, null, 2));
  // merge tasks by updatedAt (Last-Write-Wins)
  for (const clientTask of clientTasks) {
    clientTask.isCompleted = !!clientTask.isCompleted;
    clientTask.updatedAt = clientTask.updatedAt || new Date().toISOString();
    const idx = db.data.userTasks[username].findIndex(t => t.taskId === clientTask.taskId);
    if (idx === -1) {
      db.data.userTasks[username].push(clientTask);
    } else {
      const saved = db.data.userTasks[username][idx];
      if (!saved.updatedAt || new Date(clientTask.updatedAt) > new Date(saved.updatedAt)) {
        db.data.userTasks[username][idx] = clientTask;
      }
    }
  }
  await db.write();
  console.log('SAVED TASKS:', JSON.stringify(db.data.userTasks[username], null, 2));
  res.json({ tasks: db.data.userTasks[username] });
  broadcastTasks(username);
  // Explicitly send push to initiator if ws.username is not yet set
  wss.clients.forEach(client => {
    if (client.readyState === 1 && !client.username && client._socket.remoteAddress === req.socket.remoteAddress) {
      client.send(JSON.stringify({ type: 'task_update', tasks: db.data.userTasks[username] || [] }));
    }
  });
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
  // ws.username will be set after sync_request
}); 