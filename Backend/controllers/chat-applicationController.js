const db = require('../models/chat-index');

exports.applyJob = async (req, res) => {
  const { job_id, cover_letter, resume_path, full_name, email, phone, education, experience, skills } = req.body;
  try {
    const application = await db.Application.create({
      job_id,
      user_id: req.user.id,
      cover_letter,
      resume_path,
      full_name,
      email,
      phone,
      education,
      experience,
      skills
    });
    res.json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listApplications = async (req, res) => {
  const applications = await db.Application.findAll({ where: { user_id: req.user.id } });
  res.json(applications);
};
