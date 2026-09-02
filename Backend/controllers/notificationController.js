const Notification = require('../models/Notification');
const User = require('../models/User');

// ✅ Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    const unreadCount = await Notification.count({
      where: { user_id: userId, read: false }
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Create notification
const createNotification = async (userId, title, message, type = 'system', link = null) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      link,
      read: false
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// ✅ Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { read: true },
      { where: { user_id: userId, read: false } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.destroy();

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Clear all notifications
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.destroy({
      where: { user_id: userId }
    });

    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
};