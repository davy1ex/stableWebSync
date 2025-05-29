// routes/tasks.js
const express = require('express');
const router = express.Router();
const {authenticateToken} = require('../middleware/auth');
const { getDB } = require('../db/index');
const { broadcastTasks, getWss } = require('../ws/index');

router.get('/', authenticateToken, async (req, res) => {
  const db = getDB();
  await db.read();
  const username = req.user.username;
  res.json({ tasks: db.data.userTasks[username] || [] });
});

router.patch('/:taskId', authenticateToken, async (req, res) => {
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
  
router.delete('/:taskId', authenticateToken, async (req, res) => {
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

module.exports = router;
