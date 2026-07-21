const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuthMiddleware = require('../middleware/adminMiddleware');

// Dashboard stats
router.get('/users/stats', adminAuthMiddleware, adminController.getUsersStats);
router.get('/jobs/stats', adminAuthMiddleware, adminController.getJobsStats);
router.get('/jobs/pending', adminAuthMiddleware, adminController.getPendingJobsStats);
router.get('/users/recent', adminAuthMiddleware, adminController.getRecentUsersStats);
router.get('/jobs/recent', adminAuthMiddleware, adminController.getRecentJobs);
router.get('/users/status', adminAuthMiddleware, adminController.getUserStatusStats);
router.get('/notifications', adminAuthMiddleware, adminController.getNotifications);

// User management
router.get('/users', adminAuthMiddleware, adminController.getAllUsers);
router.delete('/users/:id', adminAuthMiddleware, adminController.deleteUser);
router.put('/users/:id', adminAuthMiddleware, adminController.updateUser);
router.post('/users', adminAuthMiddleware, adminController.createUser);

// Job management
router.get('/jobs', adminAuthMiddleware, adminController.getAllJobs);
router.put('/jobs/:id/status', adminAuthMiddleware, adminController.updateJobStatus);
// Update job details
// Update job details
router.put('/jobs/:id', adminAuthMiddleware, adminController.getUpdateJobs);

// Approve job
router.put('/jobs/:id/approve', adminAuthMiddleware, adminController.getApprovedJobs);

// Delete a job
router.delete('/jobs/:id', adminAuthMiddleware, adminController.getDeletedJobs);






module.exports = router;