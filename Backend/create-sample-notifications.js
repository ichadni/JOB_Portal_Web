const db = require('./config/db');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function createSampleNotifications() {
  try {
    await db.sync();
    
    // Get a sample student user
    const student = await User.findOne({ where: { role: 'student' } });
    
    if (!student) {
      console.log('No student user found. Please create a student account first.');
      return;
    }

    // Create sample notifications
    const notifications = [
      {
        user_id: student.id,
        title: 'Welcome to the Student Portal!',
        message: 'Your profile has been successfully created. Start exploring job opportunities now.',
        type: 'system'
      },
      {
        user_id: student.id,
        title: 'New Job Alert',
        message: 'A new Software Developer position at Tech Corp has been posted that matches your skills.',
        type: 'job_alert'
      },
      {
        user_id: student.id,
        title: 'Profile Update Reminder',
        message: 'Complete your profile by adding your education and experience to increase your chances of getting hired.',
        type: 'profile_update'
      }
    ];

    for (const notif of notifications) {
      await Notification.create(notif);
    }

    console.log('Sample notifications created successfully!');
  } catch (error) {
    console.error('Error creating sample notifications:', error);
  } finally {
    await db.close();
  }
}

createSampleNotifications();