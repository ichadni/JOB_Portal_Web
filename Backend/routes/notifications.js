const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // ✅ Fixed import
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notificationController');

// All routes require authentication
router.use(auth);

// Get all notifications
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Mark all as read
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Clear all notifications
router.delete('/clear-all', clearAllNotifications);

module.exports = router;