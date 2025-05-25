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
  app = require('../index');
  server = app && app.listen ? app.listen(4000) : null;
});

afterAll(async () => {
  if (server) server.close();
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
});

describe('Task Sync Server', () => {
  let token1, token2;

  it('should login and get JWT token', async () => {
    const res = await request('http://localhost:3001')
      .post('/login')
      .send({ username: 'user1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token1 = res.body.token;
  });

  it('should not allow access to /sync without token', async () => {
    const res = await request('http://localhost:3001').get('/sync');
    expect(res.statusCode).toBe(401);
  });

  it('should allow access to /sync with token and return empty tasks', async () => {
    const res = await request('http://localhost:3001')
      .get('/sync')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBe(0);
  });

  it('should sync tasks for user1', async () => {
    const tasks = [{ taskId: 1, taskName: 't1', isCompleted: false, dateBox: 'today', updatedAt: new Date().toISOString() }];
    const res = await request('http://localhost:3001')
      .post('/sync')
      .set('Authorization', `Bearer ${token1}`)
      .send({ tasks });
    expect(res.statusCode).toBe(200);
    expect(res.body.tasks.length).toBe(1);
    expect(res.body.tasks[0].taskName).toBe('t1');
  });

  it('should isolate tasks between users', async () => {
    // login as user2
    const res2 = await request('http://localhost:3001')
      .post('/login')
      .send({ username: 'user2' });
    token2 = res2.body.token;
    // user2 should have empty tasks
    const res = await request('http://localhost:3001')
      .get('/sync')
      .set('Authorization', `Bearer ${token2}`);
    expect(res.body.tasks.length).toBe(0);
  });
}); 