const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

let server;
let app;
const JWT_SECRET = 'supersecret';
const dbFile = path.join(__dirname, '../db.json');

beforeAll(async () => {
  // Clear base before tests
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  // Require app AFTER dbFile might be cleared and BEFORE server starts
  // This ensures lowdb initializes with a clean or non-existent db.json if that's its behavior
  const appModule = require('../index'); 
  app = appModule.app; // Assuming your ../index.js exports { app, server } or just app
  server = appModule.server || app.listen(4000); // Use exported server or start a new one
});

afterAll(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
});

describe('Task Sync Server', () => {
  let token1, token2;
  const testApi = request('http://localhost:3001'); // Use a common agent

  it('should login and get JWT token', async () => {
    const res = await testApi
      .post('/login')
      .send({ username: 'user1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token1 = res.body.token;
  });

  it('should not allow access to /tasks without token', async () => {
    const res = await testApi.get('/tasks'); // Changed from /sync
    expect(res.statusCode).toBe(401);
  });

  it('should allow access to /tasks with token and return empty tasks', async () => {
    const res = await testApi
      .get('/tasks') // Changed from /sync
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBe(0);
  });

  it('should sync tasks for user1 via POST /sync', async () => {
    const tasks = [{ taskId: 1, taskName: 't1', isCompleted: false, columnId: 'inbox1', order: 1, updatedAt: new Date().toISOString() }];
    const res = await testApi
      .post('/sync')
      .set('Authorization', `Bearer ${token1}`)
      .send({ tasks });
    expect(res.statusCode).toBe(200);
    expect(res.body.tasks.length).toBe(1);
    expect(res.body.tasks[0].taskName).toBe('t1');
  });

  it('should isolate tasks between users', async () => {
    // login as user2
    const res2 = await testApi
      .post('/login')
      .send({ username: 'user2' });
    token2 = res2.body.token;
    // user2 should have empty tasks
    const res = await testApi
      .get('/tasks') // Changed from /sync
      .set('Authorization', `Bearer ${token2}`);
    expect(res.body.tasks.length).toBe(0);
  });
}); 

// Placeholder for new tests
describe('PATCH /tasks/:taskId', () => {
  let userToken;
  const testApi = request('http://localhost:3001');
  let initialTask;

  beforeAll(async () => {
    // Login user and get token
    const loginRes = await testApi.post('/login').send({ username: 'patchUser' });
    userToken = loginRes.body.token;
  });

  beforeEach(async () => {
    // Create an initial task for this user to be updated by tests
    const taskToCreate = {
        taskId: Date.now(), // Ensure unique ID for each test run if tests run in parallel or share state across runs
        taskName: 'Initial Task for PATCH',
        isCompleted: false,
        columnId: 'inbox1',
        order: 1,
        updatedAt: new Date().toISOString()
    };
    const syncRes = await testApi
        .post('/sync')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ tasks: [taskToCreate] });
    initialTask = syncRes.body.tasks[0];
    expect(initialTask).toBeDefined();
  });

  it('should successfully update a task name', async () => {
    const newName = 'Updated Task Name';
    const res = await testApi
      .patch(`/tasks/${initialTask.taskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ taskName: newName });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.taskId).toBe(initialTask.taskId);
    expect(res.body.taskName).toBe(newName);
    expect(res.body.isCompleted).toBe(initialTask.isCompleted);
    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(new Date(initialTask.updatedAt).getTime());

    // Verify with a GET request
    const getRes = await testApi.get('/tasks').set('Authorization', `Bearer ${userToken}`);
    const updatedTaskInList = getRes.body.tasks.find(t => t.taskId === initialTask.taskId);
    expect(updatedTaskInList.taskName).toBe(newName);
  });

  it('should successfully update task completion status', async () => {
    const newCompletedStatus = true;
    const res = await testApi
      .patch(`/tasks/${initialTask.taskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ isCompleted: newCompletedStatus });

    expect(res.statusCode).toBe(200);
    expect(res.body.isCompleted).toBe(newCompletedStatus);
    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(new Date(initialTask.updatedAt).getTime());
  });

  it('should return 404 if task ID does not exist', async () => {
    const nonExistentTaskId = 999999999;
    const res = await testApi
      .patch(`/tasks/${nonExistentTaskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ taskName: 'Try to update non-existent' });
    expect(res.statusCode).toBe(404);
  });

  it('should return 401 if no token is provided', async () => {
    const res = await testApi
      .patch(`/tasks/${initialTask.taskId}`)
      .send({ taskName: 'No Auth' });
    expect(res.statusCode).toBe(401);
  });

  it('should return 403 if token is invalid', async () => {
    const res = await testApi
      .patch(`/tasks/${initialTask.taskId}`)
      .set('Authorization', 'Bearer invalidtoken')
      .send({ taskName: 'Invalid Auth' });
    expect(res.statusCode).toBe(403);
  });

}); 