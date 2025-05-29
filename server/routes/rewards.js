const express = require('express');
const { getDB } = require('../db/index');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const db = getDB();
  await db.read();
  const username = req.user.username;
  const data = db.data.userRewards[username] ||= [];

  res.json({ rewards: data })
})

router.post('/', authenticateToken, async (req, res) => {
  const db = getDB();
  await db.read();
  const username = req.user.username;
  db.data.userRewards[username] ||= [];

  try {
    const { reward } = req.body;
    console.log("newReward", reward);
    db.data.userRewards[username].push(reward);
    console.log("db.data.userRewards[username]", db.data.userRewards[username]);
    await db.write();
  }
  catch (e) {
    console.error('Error adding reward:', e);
    return res.status(400).json({ message: 'Invalid reward data' });
  }


  res.json({ rewards: db.data.userRewards[username] });
});

router.delete('/:rewardId', authenticateToken, async (req, res) => {
  const db = getDB();
  await db.read();

  const username = req.user.username;
  const rewardId = Number(req.params.rewardId);
  const rewardToDelete = db.data.userRewards[username].find(reward => reward.rewardId == rewardId)
  
  db.data.userRewards[username] = db.data.userRewards[username].filter(reward => reward.rewardId !== rewardId)
  await db.write();
  
  res.json({ reward: rewardToDelete });

  try {
  }
  catch (e) {
    console.error('Error adding reward:', e);
    return res.status(400).json({ message: 'Invalid reward data' });
  }


})

router.patch('/', authenticateToken, async (req, res) => {
  const db = getDB();
  await db.read();
  const username = req.user.username;
  const { rewards } = req.body;
  db.data.userRewards[username] = rewards;
  await db.write();
  res.json({ rewards: db.data.userRewards[username] });
})

router.patch('/:rewardId', authenticateToken, async (req, res) => {
  const db = getDB();
  await db.read();
  const username = req.user.username;
  const rewardId = Number(req.params.rewardId);
  const { reward } = req.body;
  
  const rewardToUpdate = db.data.userRewards[username].find(reward => reward.rewardId == rewardId)
  if (!rewardToUpdate) {
    return res.status(404).json({ message: 'Reward not found' });
  }
  rewardToUpdate.rewardName = reward.rewardName || rewardToUpdate.rewardName;
  rewardToUpdate.rewardPoints = reward.rewardPoints || rewardToUpdate.rewardPoints;
  rewardToUpdate.order = reward.order || rewardToUpdate.order; 
  await db.write();
  res.json({ reward: rewardToUpdate });
})

module.exports = router;
