const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const notificationHelper = require("../utils/notificationHelper");

// ============================================
// GET STUDENT PROFILE
// ============================================
const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findByPk(userId, { 
      attributes: ["id", "username", "email", "mobile", "role", "full_name", "skills", "education", "experience", "createdAt"] 
    });
    
    if (!user) return res.status(404).json({ error: "Student not found" });
    if (user.role !== 'student') return res.status(403).json({ error: "Access denied" });

    res.json(user);
  } catch (err) {
    console.error("Get student profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ============================================
// UPDATE STUDENT PROFILE
// ============================================
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { username, email, mobile, current_password, new_password, full_name, skills, education, experience } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "Student not found" });
    if (user.role !== 'student') return res.status(403).json({ error: "Access denied" });

    // Validate current password if changing password
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: "Current password is required to change password" });
      }

      const validPassword = await bcrypt.compare(current_password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    }

    // Validate phone number: exactly 11 digits and starts with '01'
    if (mobile && !/^[0][1][0-9]{9}$/.test(mobile)) {
      return res.status(400).json({ error: "Phone number must be exactly 11 digits and start with '01'" });
    }

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (full_name) user.full_name = full_name;
    if (skills) user.skills = skills;
    if (education) user.education = education;
    if (experience !== undefined) user.experience = experience;

    if (new_password) {
      const passwordHash = await bcrypt.hash(new_password, 10);
      user.password = passwordHash;
    }

    await user.save();

    res.json({ 
      message: "Profile updated successfully", 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        mobile: user.mobile, 
        role: user.role,
        full_name: user.full_name,
        skills: user.skills,
        education: user.education,
        experience: user.experience
      } 
    });
  } catch (err) {
    console.error("Update student profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ============================================
// GET STUDENT DASHBOARD
// ============================================
const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Get total jobs count
    const totalJobsResult = await Job.findAndCountAll();
    const totalJobs = totalJobsResult.count;

    // Get user's applications count
    const applicationsResult = await Application.findAndCountAll({
      where: { user_id: userId }
    });
    const totalApplications = applicationsResult.count;

    // Get user profile for completion calculation
    const user = await User.findByPk(userId, {
      attributes: ["full_name", "email", "mobile", "skills", "education", "experience"]
    });

    if (!user) return res.status(404).json({ error: "Student not found" });

    // Calculate profile completion
    const fields = ['full_name', 'email', 'mobile', 'skills', 'education', 'experience'];
    const filled = fields.filter(field => {
      const value = user[field];
      return value && value !== null && value !== undefined && value.toString().trim() !== '';
    });
    const profileCompletion = Math.round((filled.length / fields.length) * 100);

    res.json({
      totalJobs,
      totalApplications,
      profileCompletion,
      user: user
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ============================================
// ✅ GET STUDENT STATS (For Dashboard)
// ============================================
const getStudentStats = async (req, res) => {
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

    // Profile completion
    const user = await User.findByPk(studentId);
    let completion = 0;
    if (user) {
      const fields = ['full_name', 'skills', 'education', 'experience'];
      let filled = 0;
      fields.forEach(field => {
        if (user[field] && user[field].toString().trim() !== '') filled++;
      });
      completion = Math.round((filled / fields.length) * 100);
    }

    // ✅ FIXED: Use 'id' instead of 'created_at'
    const latestApplication = await Application.findOne({
      where: { user_id: studentId },
      order: [['id', 'DESC']]  // ← Changed this line
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
};

// ============================================
// ✅ APPLY FOR JOB (With Notifications)
// ============================================
const applyForJob = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { job_id, cover_letter } = req.body;

    if (!job_id) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    // Check if job exists
    const job = await Job.findByPk(job_id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      where: { user_id: studentId, job_id }
    });

    if (existingApplication) {
      return res.status(400).json({ error: "You have already applied for this job" });
    }

    // Get student info
    const student = await User.findByPk(studentId);

    // Create application
    const application = await Application.create({
      user_id: studentId,
      job_id,
      cover_letter: cover_letter || '',
      status: 'pending',
      full_name: student.full_name || student.username,
      email: student.email
    });

    // ============================================
    // SEND NOTIFICATIONS
    // ============================================

    try {
      // 1. Notify student
      await notificationHelper.sendToUser(
        studentId,
        'Application Submitted ✅',
        `You have successfully applied for "${job.title}" at ${job.company}`,
        'application_status',
        '/Student/applied-jobs.html'
      );

      // 2. Notify recruiter
      if (job.posted_by) {
        await notificationHelper.sendToRecruiter(
          job.posted_by,
          'New Application Received 📩',
          `${student.username || 'A student'} applied for your job: "${job.title}"`,
          'new_application',
          '/Recruiter/applicants.html'
        );
      }

      // 3. Notify admins
      await notificationHelper.sendToAdmins(
        'New Job Application',
        `${student.username || 'A student'} applied for "${job.title}" at ${job.company}`,
        'system',
        '/Admin/applications.html'
      );

      console.log(`✅ Notifications sent for application by student ${studentId}`);
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError.message);
    }

    res.json({
      success: true,
      message: "Application submitted successfully",
      application
    });

  } catch (err) {
    console.error("Apply for job error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};

module.exports = { 
  getStudentProfile, 
  updateStudentProfile, 
  getStudentDashboard,
  getStudentStats,
  applyForJob
};