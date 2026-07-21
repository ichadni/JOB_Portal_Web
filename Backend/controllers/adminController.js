

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// Get admin dashboard stats
const getUsersStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    res.json({ totalUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getJobsStats = async (req, res) => {
  try {
    const totalJobs = await Job.count();
    res.json({ totalJobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingJobsStats = async (req, res) => {
  try {
    const pendingCount = await Job.count({ where: { status: 'pending' } });
    res.json({ pendingCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentUsersStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCount = await User.count({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: sevenDaysAgo
        }
      }
    });
    res.json({ recentCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentJobs = async (req, res) => {
  try {
    const recentJobs = await Job.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'company']
    });
    res.json({ jobs: recentJobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserStatusStats = async (req, res) => {
  try {
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = await User.count({ where: { isActive: false } });
    res.json({ active: activeUsers, inactive: inactiveUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const pendingJobs = await Job.count({ where: { status: 'pending' } });
    const count = pendingJobs;

    const list = [];
    if (pendingJobs > 0) {
      list.push({ message: `${pendingJobs} jobs pending approval` });
    }

    res.json({ count, list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users for admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'mobile', 'role', 'createdAt']
    });
    res.json(users);
  } catch (error) {
        console.error('Error fetching users:', error); // <-- log full error

    res.status(500).json({ error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
        await Application.destroy({ where: { user_id: id } });

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, mobile, role } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (role) user.role = role;
    
    await user.save();
    
    res.json({ 
      message: "User updated successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { username, email, mobile, password, role } = req.body;
    
    if (!username || !email || !mobile || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      username,
      email,
      mobile,
      password: passwordHash,
      role: role || 'student'
    });
    
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    await job.update({ status });
    res.json({ message: `Job ${status} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all jobs for admin
const getAllJobs= async (req, res) => {
  try {
    const { filter } = req.query;
    let whereClause = {};
    
    if (filter === 'pending') {
      whereClause.status = 'pending';
    }
    
    const jobs = await Job.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['username', 'email'], as: 'poster' }],
      order: [['id', 'DESC']]
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve job
const getApprovedJobs= async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    await job.update({ status: 'active' });
    
    res.json({ message: "Job approved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update job
const getUpdateJobs= async (req, res) => {
  try {
    const { id } = req.params;
    const { title, company, location, type, salary, description } = req.body;
    
    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    // Update fields
    if (title) job.title = title;
    if (company) job.company = company;
    if (location) job.location = location;
    if (type) job.type = type;
    if (salary) job.salary = salary;
    if (description) job.description = description;
    
    await job.save();
    
    res.json({ 
      message: "Job updated successfully",
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        description: job.description,
        status: job.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete job
const getDeletedJobs= async (req, res) => {
  try {
    const { id } = req.params;
        await Application.destroy({ where: { job_id: id } });

    const job = await Job.findByPk(id);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    await job.destroy();
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single job by ID
const getSingleJobsByID =async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findByPk(id, {
      include: [{ model: User, attributes: ['username', 'email'], as: 'poster' }]
    });
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// Get single job for admin
const getSingleJobs= async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['username', 'email'], as: 'poster' }]
    });
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsersStats,
  getJobsStats,
  getPendingJobsStats,
  getRecentUsersStats,
  getRecentJobs,
  getUserStatusStats,
  getNotifications,
  getAllUsers,
  deleteUser,
  updateUser,
  createUser,
  getAllJobs,
  updateJobStatus,
  getUpdateJobs,
  getApprovedJobs,
  getDeletedJobs,
  getSingleJobsByID ,
getSingleJobs
};