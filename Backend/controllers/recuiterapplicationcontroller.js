const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Application = require('../models/Application');
const Job = require('../models/Job');

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Apply for a job
const apply = async (req, res) => {
  try {
    const jobId = req.body.job_id;
    const fullName = req.body.name;
    const email = req.body.email;
    const coverLetter = req.body.cover_letter;
    const user_id = req.user.id;

    if (!jobId || !fullName || !email || !coverLetter) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check for duplicate application BEFORE processing file
    const exists = await Application.findOne({ where: { job_id: jobId, user_id } });
    if (exists) {
      // If duplicate, delete uploaded file if it exists
      if (req.file) {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: "You have already applied for this job" });
    }

    const resumePath = req.file ? req.file.path : null;


    const applicationData = {
      job_id: jobId,
      user_id,
      full_name: fullName,
      email,
      cover_letter: coverLetter,
      resume_path: resumePath,
      payment_status: 'pending' // default for now
    };

    const application = await Application.create(applicationData);
    res.json({
      applicationId: application.id,
      message: 'Application submitted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get applications for a specific job
const getForJob = async (req, res) => {
  try {
    const job_id = req.params.jobId;
    const apps = await Application.getApplicationsForJob(job_id);
    res.json(apps); // send array directly
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user's applications
const getMyApplications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const apps = await Application.findAll({
      where: { user_id },
      include: [{ model: Job, attributes: ['title', 'company', 'location'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(apps); // send array directly
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  upload,
  apply,
  getForJob,
  getMyApplications
};