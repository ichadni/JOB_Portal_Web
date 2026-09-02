const express = require("express");
const router = express.Router();
const { 
  getStudentProfile, 
  updateStudentProfile, 
  getStudentDashboard,
  applyForJob
} = require("../controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");
const Job = require("../models/Job");
const Application = require("../models/Application");

// ============================================
// All routes require authentication
// ============================================
router.use(authMiddleware);

// ============================================
// GET STUDENT STATS
// ============================================
router.get("/stats", async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get total jobs available
    const totalJobs = await Job.count({
      where: { status: 'active' }
    });

    // Get total applications submitted by this student
    const totalApplications = await Application.count({
      where: { user_id: studentId }
    });

    // Get profile completion
    const user = await require("../models/User").findByPk(studentId);
    let completion = 0;
    if (user) {
      const fields = ['full_name', 'skills', 'education', 'experience'];
      let filled = 0;
      fields.forEach(field => {
        if (user[field]) filled++;
      });
      completion = Math.round((filled / fields.length) * 100);
    }

    // ✅ FIXED: Use 'createdAt' instead of 'created_at'
    const latestApplication = await Application.findOne({
      where: { user_id: studentId },
      order: [['createdAt', 'DESC']]  // ← Changed to 'createdAt'
    });

    const applicationStatus = latestApplication ? latestApplication.status : '-';

    res.json({
      success: true,
      totalJobs,
      totalApplications,
      profileCompletion: `${completion}%`,
      applicationStatus
    });

  } catch (err) {
    console.error("Get student stats error:", err);
    res.status(500).json({ error: "Failed to get student stats" });
  }
});

// ============================================
// GET STUDENT APPLICATIONS
// ============================================
router.get("/applications", async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const applications = await Application.findAll({
      where: { user_id: studentId },
      include: [
        { 
          model: Job, 
          attributes: ['id', 'title', 'company', 'location', 'salary', 'type'] 
        }
      ],
      order: [['createdAt', 'DESC']]  // ← Changed to 'createdAt'
    });

    res.json({
      success: true,
      applications
    });

  } catch (err) {
    console.error("Get student applications error:", err);
    res.status(500).json({ error: "Failed to get applications" });
  }
});

// ============================================
// ✅ APPLY FOR JOB (With Notifications)
// ============================================
router.post("/apply", applyForJob);

// ============================================
// GET STUDENT DASHBOARD DATA
// ============================================
router.get("/dashboard", getStudentDashboard);

// ============================================
// GET STUDENT PROFILE
// ============================================
router.get("/profile", getStudentProfile);

// ============================================
// UPDATE STUDENT PROFILE
// ============================================
router.put("/profile", updateStudentProfile);

// ============================================
// UPDATE STUDENT PASSWORD ONLY
// ============================================
router.put("/profile/password", updateStudentProfile);

module.exports = router;