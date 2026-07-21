const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");

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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

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

module.exports = { getStudentProfile, updateStudentProfile, getStudentDashboard };