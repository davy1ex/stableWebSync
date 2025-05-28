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
  // console.log('INCOMING TASKS:', JSON.stringify(clientTasks, null, 2));
  
  // Create a map of existing tasks for faster lookup
  const existingTasks = new Map(
    db.data.userTasks[username].map(task => [task.taskId, task])
  );

  // Create a map of incoming tasks with their orders
  const incomingTaskOrders = new Map(
    clientTasks.map(task => [task.taskId, task.order])
  );

  // Merge incoming tasks with existing ones
  for (const clientTask of clientTasks) {
    clientTask.isCompleted = !!clientTask.isCompleted;
    clientTask.updatedAt = clientTask.updatedAt || new Date().toISOString();
    clientTask.taskName = clientTask.taskName || existingTask.taskName;
    
    const existingTask = existingTasks.get(clientTask.taskId);
    if (!existingTask) {
      // New task, add to map
      existingTasks.set(clientTask.taskId, clientTask);
    } else {
      // Update existing task if newer
      if (!existingTask.updatedAt || new Date(clientTask.updatedAt) > new Date(existingTask.updatedAt)) {
        existingTasks.set(clientTask.taskId, clientTask);
      }
    }
  }

  // Convert map back to array and sort by order from incoming tasks
  db.data.userTasks[username] = Array.from(existingTasks.values())
    .map(task => ({
      ...task,
      // Use incoming order if available, otherwise keep existing order
      order: incomingTaskOrders.has(task.taskId) ? incomingTaskOrders.get(task.taskId) : task.order
    }))
    .sort((a, b) => a.order - b.order);
  
  await db.write();
  // console.log('SAVED TASKS:', JSON.stringify(db.data.userTasks[username], null, 2));
  res.json({ tasks: db.data.userTasks[username] });
  broadcastTasks(username);
  // Explicitly send push to initiator if ws.username is not yet set
  wss.clients.forEach(client => {
    if (client.readyState === 1 && !client.username && client._socket.remoteAddress === req.socket.remoteAddress) {
      client.send(JSON.stringify({ type: 'task_update', tasks: db.data.userTasks[username] || [] }));
    }
  });
});

app.patch('/tasks/:taskId', authenticateToken, async (req, res) => {
  await db.read();
  const username = req.user.username;
  const taskId = req.params.taskId; // Note: taskId from client is number, params are string
  const updates = req.body;

  db.data ||= { userTasks: {} };
  db.data.userTasks[username] ||= [];

  const taskIndex = db.data.userTasks[username].findIndex(task => task.taskId.toString() === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Update the task
  db.data.userTasks[username][taskIndex] = {
    ...db.data.userTasks[username][taskIndex],
    ...updates,
    updatedAt: new Date().toISOString() // Always set a new timestamp on update
  };

  // Ensure tasks remain sorted by order if order is not part of the update
  // or if other tasks' orders are affected. For simplicity, re-sort.
  db.data.userTasks[username].sort((a, b) => a.order - b.order);

  await db.write();
  const updatedTask = db.data.userTasks[username][taskIndex];
  console.log('PATCHED TASK:', JSON.stringify(updatedTask, null, 2));
  res.json(updatedTask); // Send back the updated task
  broadcastTasks(username);
});

app.delete('/tasks/:taskId', authenticateToken, async (req, res) => {
  await db.read();
  const username = req.user.username;
  const taskId = req.params.taskId;
  const taskToDelete = db.data.userTasks[username].find(task => task.taskId.toString() === taskId);
  
  db.data.userTasks[username] = db.data.userTasks[username].filter(task => task.taskId.toString() !== taskId)
  await db.write();
  console.log('DELETED TASK:', JSON.stringify(db.data.userTasks[username], null, 2));
  broadcastTasks(username);

  res.json(taskToDelete);
});

app.get('/tasks', authenticateToken, async (req, res) => { // Renamed from /sync
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