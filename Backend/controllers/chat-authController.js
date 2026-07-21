const db = require('../models/chat-index');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/chat-config');

exports.register = async (req, res) => {
  const { username, email, mobile, password, role } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.User.create({ username, email, mobile, password: hashed, role });
    const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' });

  try {
    const user = await db.User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
