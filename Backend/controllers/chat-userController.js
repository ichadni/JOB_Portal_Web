const db = require('../models/chat-index');

exports.getProfile = async (req, res) => {
  const user = await db.User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const { username, email, mobile } = req.body;
  const user = await db.User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  await user.update({ username, email, mobile });
  res.json(user);
};
