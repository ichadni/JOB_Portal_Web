const Notification = require('../models/Notification');
const User = require('../models/User');

const notificationHelper = {
  // ✅ Send to a single user
  sendToUser: async (userId, title, message, type = 'system', link = null) => {
    try {
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        console.log(`⚠️ User ${userId} not found, notification not sent`);
        return null;
      }

      const notification = await Notification.create({
        user_id: userId,
        title,
        message,
        type,
        link,
        read: false
      });
      
      console.log(`✅ Notification sent to user ${userId}: "${title}"`);
      return notification;
    } catch (error) {
      console.error('Send to user error:', error);
      return null;
    }
  },

  // ✅ Send to all admins
  sendToAdmins: async (title, message, type = 'system', link = null) => {
    try {
      const admins = await User.findAll({ where: { role: 'admin' } });
      if (admins.length === 0) {
        console.log('⚠️ No admins found to send notification');
        return [];
      }

      const notifications = [];
      for (const admin of admins) {
        const notification = await Notification.create({
          user_id: admin.id,
          title,
          message,
          type,
          link,
          read: false
        });
        notifications.push(notification);
      }
      
      console.log(`✅ Notification sent to ${notifications.length} admins: "${title}"`);
      return notifications;
    } catch (error) {
      console.error('Send to admins error:', error);
      return [];
    }
  },

  // ✅ Send to all students
  sendToStudents: async (title, message, type = 'system', link = null) => {
    try {
      const students = await User.findAll({ where: { role: 'student' } });
      if (students.length === 0) {
        console.log('⚠️ No students found to send notification');
        return [];
      }

      const notifications = [];
      for (const student of students) {
        const notification = await Notification.create({
          user_id: student.id,
          title,
          message,
          type,
          link,
          read: false
        });
        notifications.push(notification);
      }
      
      console.log(`✅ Notification sent to ${notifications.length} students: "${title}"`);
      return notifications;
    } catch (error) {
      console.error('Send to students error:', error);
      return [];
    }
  },

  // ✅ Send to a specific recruiter
  sendToRecruiter: async (recruiterId, title, message, type = 'system', link = null) => {
    try {
      // Check if user exists and is a recruiter
      const user = await User.findByPk(recruiterId);
      if (!user) {
        console.log(`⚠️ Recruiter ${recruiterId} not found`);
        return null;
      }

      if (user.role !== 'recruiter' && user.role !== 'admin') {
        console.log(`⚠️ User ${recruiterId} is not a recruiter`);
        return null;
      }

      const notification = await Notification.create({
        user_id: recruiterId,
        title,
        message,
        type,
        link,
        read: false
      });
      
      console.log(`✅ Notification sent to recruiter ${recruiterId}: "${title}"`);
      return notification;
    } catch (error) {
      console.error('Send to recruiter error:', error);
      return null;
    }
  },

  // ✅ Send to all recruiters
  sendToAllRecruiters: async (title, message, type = 'system', link = null) => {
    try {
      const recruiters = await User.findAll({ where: { role: 'recruiter' } });
      if (recruiters.length === 0) {
        console.log('⚠️ No recruiters found to send notification');
        return [];
      }

      const notifications = [];
      for (const recruiter of recruiters) {
        const notification = await Notification.create({
          user_id: recruiter.id,
          title,
          message,
          type,
          link,
          read: false
        });
        notifications.push(notification);
      }
      
      console.log(`✅ Notification sent to ${notifications.length} recruiters: "${title}"`);
      return notifications;
    } catch (error) {
      console.error('Send to recruiters error:', error);
      return [];
    }
  },

  // ✅ Send to all users (everyone)
  sendToAllUsers: async (title, message, type = 'system', link = null) => {
    try {
      const users = await User.findAll();
      if (users.length === 0) {
        console.log('⚠️ No users found to send notification');
        return [];
      }

      const notifications = [];
      for (const user of users) {
        const notification = await Notification.create({
          user_id: user.id,
          title,
          message,
          type,
          link,
          read: false
        });
        notifications.push(notification);
      }
      
      console.log(`✅ Notification sent to ${notifications.length} users: "${title}"`);
      return notifications;
    } catch (error) {
      console.error('Send to all users error:', error);
      return [];
    }
  },

  // ✅ Send notification to user by role
  sendToRole: async (role, title, message, type = 'system', link = null) => {
    try {
      const users = await User.findAll({ where: { role } });
      if (users.length === 0) {
        console.log(`⚠️ No users found with role ${role}`);
        return [];
      }

      const notifications = [];
      for (const user of users) {
        const notification = await Notification.create({
          user_id: user.id,
          title,
          message,
          type,
          link,
          read: false
        });
        notifications.push(notification);
      }
      
      console.log(`✅ Notification sent to ${notifications.length} users with role ${role}: "${title}"`);
      return notifications;
    } catch (error) {
      console.error(`Send to ${role} error:`, error);
      return [];
    }
  },

  // ✅ Send notification to multiple users
  sendToMultipleUsers: async (userIds, title, message, type = 'system', link = null) => {
    try {
      if (!userIds || userIds.length === 0) {
        console.log('⚠️ No user IDs provided');
        return [];
      }

      const notifications = [];
      for (const userId of userIds) {
        const notification = await Notification.create({
          user_id: userId,
          title,
          message,
          type,
          link,
          read: false
        });
        notifications.push(notification);
      }
      
      console.log(`✅ Notification sent to ${notifications.length} users: "${title}"`);
      return notifications;
    } catch (error) {
      console.error('Send to multiple users error:', error);
      return [];
    }
  }
};

module.exports = notificationHelper;