const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const config = require('./config/chat-config');
const db = require('./models/chat-index');
const authRoutes = require('./routes/chat-auth');
const userRoutes = require('./routes/chat-users');
const jobRoutes = require('./routes/chat-jobs');
const appRoutes = require('./routes/chat-applications');
const uploadRoutes = require('./routes/chat-uploads');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:5501', 'http://127.0.0.1:3001', 'http://localhost:3001', 'http://127.0.0.1:8080', 'http://localhost:8080'],
    methods: ['GET', 'POST'],
    credentials: true
  } 
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:5501', 'http://127.0.0.1:3001', 'http://localhost:3001', 'http://127.0.0.1:8080', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/chat-uploads', express.static('chat-uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/uploads', uploadRoutes);

// Socket.IO
const userSockets = new Map();

function addUserSocket(userId, socketId) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
}
function removeUserSocket(userId, socketId) {
  if (!userSockets.has(userId)) return;
  userSockets.get(userId).delete(socketId);
  if (userSockets.get(userId).size === 0) userSockets.delete(userId);
}
function getSocketIds(userId) {
  return userSockets.has(userId) ? Array.from(userSockets.get(userId)) : [];
}

// Get available advisors for students
async function getAvailableAdvisors(studentId) {
  try {
    if (db && db.User) {
      const advisors = await db.User.findAll({
        where: { role: 'advisor' },
        attributes: ['id', 'username']
      });
      return advisors;
    }
    return [];
  } catch (error) {
    console.error('Error fetching advisors:', error);
    return [];
  }
}

// Get assigned advisor for student
async function getAssignedAdvisor(studentId) {
  try {
    if (db && db.User) {
      const student = await db.User.findOne({
        where: { id: studentId, role: 'student' },
        attributes: ['id']
      });
      
      if (student) {
        const advisors = await getAvailableAdvisors(studentId);
        return advisors.length > 0 ? advisors[0] : null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting assigned advisor:', error);
    return null;
  }
}

io.on('connection', (socket) => {
  socket.on('authenticate', ({ userId }) => {
    if (!userId) return socket.emit('auth_error', { message: 'userId required' });
    
    // For demo users, create or accept the ID without database validation
    if (userId.startsWith('demo_user_')) {
      const isStudent = userId.includes('student');
      const isAdvisor = userId.includes('advisor');
      const userRole = isAdvisor ? 'advisor' : (isStudent ? 'student' : 'student');
      
      socket.data.userId = userId;
      socket.data.userRole = userRole;
      addUserSocket(userId, socket.id);
      socket.join(`user:${userId}`);
      socket.join(`role:${userRole}`);
      
      socket.emit('authenticated', { userId, role: userRole });
      console.log(`Demo ${userRole} authenticated: ${userId}`);
    } else {
      // For real users, validate against database
      (async () => {
        try {
          if (db && db.User) {
            const user = await db.User.findOne({
              where: { id: userId },
              attributes: ['id', 'role']
            });
            
            if (user) {
              socket.data.userId = userId;
              socket.data.userRole = user.role;
              addUserSocket(userId, socket.id);
              socket.join(`user:${userId}`);
              socket.join(`role:${user.role}`);
              
              socket.emit('authenticated', { userId, role: user.role });
              console.log(`User authenticated: ${userId} (${user.role})`);
            } else {
              socket.emit('auth_error', { message: 'User not found' });
            }
          } else {
            // Fallback if no database
            socket.data.userId = userId;
            socket.data.userRole = 'student';
            addUserSocket(userId, socket.id);
            socket.join(`user:${userId}`);
            socket.join(`role:student`);
            
            socket.emit('authenticated', { userId, role: 'student' });
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      })();
    }
  });

  socket.on('private_message', async ({ from, to, text, attachment_path, attachment_name }) => {
    try {
      // Create message in database if available
      let message;
      if (db && db.Message && !from.startsWith('demo_user_')) {
        message = await db.Message.create({ from_id: from, to_id: to, text, attachment_path, attachment_name });
      } else {
        // Fallback for demo users
        message = {
          id: Date.now(),
          from_id: from,
          to_id: to,
          text,
          attachment_path,
          attachment_name,
          createdAt: new Date()
        };
      }
      
      // Send to sender
      socket.emit('message_sent', message);
      
      // Send to actual recipient
      getSocketIds(to).forEach(sid => io.to(sid).emit('private_message', message));
      
      // Notify advisors when student sends message
      if (socket.data.userRole === 'student' && !to.startsWith('demo_user_')) {
        io.to('role:advisor').emit('new_student_message', {
          studentId: from,
          message: message
        });
      }
      
    } catch (error) {
      console.error('Error handling private message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Get available advisors
  socket.on('get_advisors', async () => {
    try {
      const advisors = await getAvailableAdvisors(socket.data.userId);
      socket.emit('advisors_list', advisors);
    } catch (error) {
      console.error('Error getting advisors:', error);
      socket.emit('error', { message: 'Failed to get advisors' });
    }
  });

  // Get assigned advisor for student
  socket.on('get_assigned_advisor', async () => {
    try {
      const advisor = await getAssignedAdvisor(socket.data.userId);
      socket.emit('assigned_advisor', advisor);
    } catch (error) {
      console.error('Error getting assigned advisor:', error);
      socket.emit('error', { message: 'Failed to get assigned advisor' });
    }
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (userId) removeUserSocket(userId, socket.id);
  });
});

// Sync DB with error handling
db.sequelize.sync()
  .then(() => {
    console.log('Database synchronized successfully');
    server.listen(config.port, () => {
      console.log(`Chat server running on port ${config.port}`);
      console.log('CORS enabled for: http://localhost:3000, http://127.0.0.1:5500, http://localhost:5500, http://127.0.0.1:5501, http://localhost:5501, http://127.0.0.1:3001, http://localhost:3001, http://127.0.0.1:8080, http://localhost:8080');
    });
  })
  .catch(err => {
    console.error('Failed to synchronize database:', err);
    console.log('Starting server without database...');
    server.listen(config.port, () => {
      console.log(`Chat server running on port ${config.port} (limited functionality)`);
    });
  });

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use`);
  } else {
    console.error('Server error:', err);
  }
});
