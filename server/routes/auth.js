const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    console.log(req.body );
    const { username } = req.body;
    // in real project - check user // TODO: add user check
    const user = { username };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

module.exports = router;