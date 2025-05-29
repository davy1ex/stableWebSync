const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const { getDB } = require('../db/index');

let wss;

function setupWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'sync_request' && data.token) {
          jwt.verify(data.token, JWT_SECRET, async (err, user) => {
            if (err) return;
            ws.username = user.username;
            const db = getDB();
            await db.read();
            ws.send(JSON.stringify({ type: 'sync_response', tasks: db.data.userTasks[user.username] || [] }));
          });
        }
      } catch {}
    });
  });

  return wss;
}

async function broadcastTasks(username) {
  const db = getDB();
  await db.read();
  
  const data = JSON.stringify({ type: 'task_update', tasks: db.data.userTasks[username] || [] });
    wss.clients.forEach(async (client) => {
      if (client.readyState === 1 && client.username === username) {
        await client.send(data);
    }
  });
}

function getWss() {
  return wss;
}

module.exports = { setupWebSocket, broadcastTasks, getWss };
