const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const path = require('path');
const { initDB } = require('./db/index');
const { setupWebSocket } = require('./ws/index');

require('dotenv').config();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET; // Move to env for production

const app = express();

app.use(cors());
app.use(express.json());

app.use('/rewards', require('./routes/rewards'));
app.use('/tasks', require('./routes/tasks'));
app.use('/', require('./routes/auth'));
app.use('/sync', require('./routes/sync'));



// initialise database
initDB()
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
setupWebSocket(server);