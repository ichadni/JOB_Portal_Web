const express = require('express');
const { apply, getForJob, upload, getMyApplications } = require('../controllers/recuiterapplicationcontroller');
const authMiddleware = require('../middleware/authMiddleware');
const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');

const router = express.Router();

// ============================================
// EXISTING ROUTES
// ============================================

// POST /api/applications – Submit a new application (student only)
router.post('/', authMiddleware, upload.single('resume'), apply);

// GET /api/applications/my-applications – Get current user's applications
router.get('/my-applications', authMiddleware, getMyApplications);

// GET /api/applications/job/:jobId – Get applications for a specific job (recruiter)
router.get('/job/:jobId', authMiddleware, getForJob);

// ============================================
// NEW ROUTE FOR ADMIN DASHBOARD
// ============================================

// GET /api/applications – Get all applications (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Check if the logged-in user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Fetch all applications with associated user and job details
    const applications = await Application.findAll({
      include: [
        { model: User, attributes: ['id', 'username', 'email'] },
        { model: Job, attributes: ['id', 'title', 'company'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ applications });
  } catch (err) {
    console.error('Error fetching all applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

module.exports = router;