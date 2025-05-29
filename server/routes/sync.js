const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { broadcastTasks, getWss } = require('../ws/index');
const { getDB } = require('../db/index');

router.post('/', authenticateToken, async (req, res) => {
    const db = getDB();
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
    const wss = getWss();
    wss.clients.forEach(async (client) => {
        const db = getDB();
        await db.read(); // TODO: check if this is needed
        if (client.readyState === 1 && !client.username && client._socket.remoteAddress === req.socket.remoteAddress) {
            client.send(JSON.stringify({ type: 'task_update', tasks: db.data.userTasks[username] || [] }));
      }
    });
  });

module.exports = router;