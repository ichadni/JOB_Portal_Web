const sequelize = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@test.com' } });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'Admin',
      email: 'admin@test.com',
      mobile: '1234567890',
      password: passwordHash,
      role: 'admin'
    });
    
    console.log('✅ Admin user created:', { id: admin.id, username: admin.username, email: admin.email });
    
    // Create some test users and jobs
    const testUser = await User.create({
      username: 'Test Student',
      email: 'student@test.com',
      mobile: '9876543210',
      password: passwordHash,
      role: 'student'
    });
    
    const testRecruiter = await User.create({
      username: 'Test Recruiter',
      email: 'recruiter@test.com',
      mobile: '5555555555',
      password: passwordHash,
      role: 'recruiter'
    });
    
    console.log('✅ Test users created');
    
    // Create some test jobs
    const Job = require('./models/Job');
    await Job.create({
      title: 'Software Developer',
      company: 'Tech Corp',
      location: 'New York',
      type: 'Full-time',
      salary: '$80,000 - $120,000',
      description: 'A great software developer position',
      posted_by: testRecruiter.id,
      status: 'pending'
    });
    
    await Job.create({
      title: 'Frontend Developer',
      company: 'Web Solutions',
      location: 'San Francisco',
      type: 'Full-time',
      salary: '$90,000 - $130,000',
      description: 'Frontend developer role',
      posted_by: testRecruiter.id,
      status: 'active'
    });
    
    console.log('✅ Test jobs created');
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAdminUser();