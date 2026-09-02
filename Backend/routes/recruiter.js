const express = require("express");
const { createJob, listJobs, getJob, updateJob, deleteJob } = require("../controllers/jobsController");
const { getForJob } = require("../controllers/recuiterapplicationcontroller");
const authMiddleware = require("../middleware/authMiddleware");
const notificationHelper = require("../utils/notificationHelper");

const router = express.Router();

// All recruiter routes require authentication
router.use(authMiddleware);

// ============================================
// ✅ GET RECRUITER STATS
// ============================================
router.get("/stats", async (req, res) => {
  try {
    const Job = require("../models/Job");
    const Application = require("../models/Application");
    const { Op } = require("sequelize");

    const recruiterId = req.user.id;

    // Get total jobs posted by this recruiter
    const totalJobs = await Job.count({
      where: { posted_by: recruiterId }
    });

    // Get all job IDs for this recruiter
    const jobs = await Job.findAll({
      where: { posted_by: recruiterId },
      attributes: ['id']
    });

    const jobIds = jobs.map(job => job.id);

    // Get total applicants
    let totalApplicants = 0;
    if (jobIds.length > 0) {
      totalApplicants = await Application.count({
        where: { job_id: { [Op.in]: jobIds } }
      });
    }

    res.json({
      success: true,
      totalJobs,
      totalApplicants
    });

  } catch (err) {
    console.error("Get recruiter stats error:", err);
    res.status(500).json({ error: "Failed to get recruiter stats" });
  }
});

// ============================================
// CREATE JOB
// ============================================
router.post("/jobs", createJob);

// ============================================
// LIST RECRUITER'S JOBS
// ============================================
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

// ============================================
// GET JOBS COUNT
// ============================================
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

// ============================================
// GET SINGLE JOB
// ============================================
router.get("/jobs/:id", getJob);

// ============================================
// UPDATE JOB
// ============================================
router.put("/jobs/:id", updateJob);

// ============================================
// DELETE JOB
// ============================================
router.delete("/jobs/:id", deleteJob);

// ============================================
// GET ALL APPLICANTS FOR RECRUITER'S JOBS
// ============================================
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

// ============================================
// GET APPLICANTS FOR SPECIFIC JOB
// ============================================
router.get("/jobs/:jobId/applicants", getForJob);

// ============================================
// UPDATE APPLICATION STATUS (with Notification)
// ============================================
router.put("/applications/:id/status", async (req, res) => {
  try {
    const Application = require("../models/Application");
    const Job = require("../models/Job");
    const User = require("../models/User");

    const application = await Application.findByPk(req.params.id, {
      include: [
        { model: Job },
        { model: User }
      ]
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Verify that the job belongs to the current recruiter
    if (application.Job.posted_by !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this application" });
    }

    const { status } = req.body;
    if (!['pending', 'reviewed', 'shortlisted', 'interview', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await application.update({ status });

    // ============================================
    // SEND NOTIFICATION TO STUDENT
    // ============================================
    
    const statusMessages = {
      'pending': 'is being reviewed',
      'reviewed': 'has been reviewed',
      'shortlisted': 'has been shortlisted 🎉',
      'interview': 'has been scheduled for an interview 📅',
      'accepted': 'has been accepted 🎉',
      'rejected': 'has been rejected'
    };

    const statusEmojis = {
      'pending': '⏳',
      'reviewed': '📋',
      'shortlisted': '⭐',
      'interview': '📅',
      'accepted': '🎉',
      'rejected': '❌'
    };

    const message = statusMessages[status] || `status changed to ${status}`;
    const emoji = statusEmojis[status] || '📝';

    // Send notification to the student
    await notificationHelper.sendToUser(
      application.user_id,
      `${emoji} Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your application for "${application.Job.title}" at ${application.Job.company} ${message}`,
      'application_status',
      '/Student/applied-jobs.html'
    );

    res.json({ 
      success: true, 
      status,
      message: `Application status updated to ${status}`
    });

  } catch (err) {
    console.error("Update application status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;