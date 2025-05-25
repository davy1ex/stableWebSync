const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'testsecret';

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

describe('JWT middleware', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.get('/private', authenticateToken, (req, res) => {
      res.json({ user: req.user });
    });
  });

  it('should allow access with valid token', async () => {
    const token = jwt.sign({ username: 'user1' }, JWT_SECRET);
    const res = await request(app).get('/private').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.username).toBe('user1');
  });

  it('should deny access without token', async () => {
    const res = await request(app).get('/private');
    expect(res.statusCode).toBe(401);
  });

  it('should deny access with invalid token', async () => {
    const res = await request(app).get('/private').set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(403);
  });
}); 