const { JSONFilePreset } = require('lowdb/node');
const path = require('path');

const dbFile = path.join(__dirname, './db.json');
let db;

async function initDB() {
  db = await JSONFilePreset(dbFile, { userTasks: {}, userRewards: {} });
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

module.exports = { initDB, getDB };
