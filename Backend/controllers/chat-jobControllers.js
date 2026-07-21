const db = require('../models/chat-index');

exports.createJob = async (req, res) => {
  const { title, company, location, type, salary, description } = req.body;
  try {
    const job = await db.Job.create({ title, company, location, type, salary, description, posted_by: req.user.id });
    res.json(job);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listJobs = async (req, res) => {
  const jobs = await db.Job.findAll();
  res.json(jobs);
};

exports.getJob = async (req, res) => {
  const job = await db.Job.findByPk(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
};
