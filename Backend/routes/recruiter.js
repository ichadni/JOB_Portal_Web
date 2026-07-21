const express = require("express");
const { createJob, listJobs, getJob, updateJob, deleteJob } = require("../controllers/jobsController");
const { getForJob } = require("../controllers/recuiterapplicationcontroller");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All recruiter routes require authentication
router.use(authMiddleware);

// Create job
router.post("/jobs", createJob);

// List recruiter's jobs
router.get("/jobs", async (req, res) => {
  try {
    const Job = require("../models/Job");
    const jobs = await Job.findAll({
      where: { posted_by: req.user.id },
      order: [["id", "DESC"]]
    });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get jobs count
router.get("/jobs/count", async (req, res) => {
  try {
    const Job = require("../models/Job");
    const count = await Job.count({
      where: { posted_by: req.user.id }
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single job
router.get("/jobs/:id", getJob);

// Update job
router.put("/jobs/:id", updateJob);

// Delete job
router.delete("/jobs/:id", deleteJob);

// GET /api/recruiter/applicants - Get all applicants for recruiter's jobs
router.get("/applicants", async (req, res) => {
  try {
    const Application = require("../models/Application");
    const Job = require("../models/Job");
    const User = require("../models/User");

    const applications = await Application.findAll({
      include: [
        {
          model: Job,
          where: { posted_by: req.user.id },
          attributes: ['id', 'title', 'company']
        },
        {
          model: User,
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [["id", "DESC"]]
    });

    const formattedApps = applications.map(app => ({
      id: app.id,
      name: app.User?.username || 'Unknown',
      email: app.User?.email || 'Unknown',
      job: app.Job?.title || 'Unknown',
      job_id: app.job_id,
      cover_letter: app.cover_letter,
      resume_path: app.resume_path,
      status: app.status || 'pending',
      applied_at: app.createdAt
    }));

    res.json(formattedApps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/recruiter/jobs/:jobId/applicants - Get applicants for specific job
router.get("/jobs/:jobId/applicants", getForJob);

// PUT /api/recruiter/applications/:id/status - Update application status
router.put("/applications/:id/status", async (req, res) => {
  try {
    const Application = require("../models/Application");
    const Job = require("../models/Job");

    const application = await Application.findByPk(req.params.id, {
      include: [{ model: Job }]
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Verify that the job belongs to the current recruiter
    if (application.Job.posted_by !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this application" });
    }

    const { status } = req.body;
    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await application.update({ status });
    res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
