const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadButton = document.querySelector("#file-upload");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

let userFile = null;
let socket = null;
let currentUserId = null;
let currentUserRole = null;
let isAuthenticated = false;
let availableAdvisors = [];
let assignedAdvisor = null;

// Create message element
function createMessageElement(content, classes = []) {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

// Initialize Socket.IO connection
function initializeSocket() {
  socket = io('http://localhost:5002');
  
  socket.on('connect', () => {
    console.log('Connected to chat server');
    authenticateUser();
  });
  
  socket.on('authenticated', (data) => {
    isAuthenticated = true;
    currentUserId = data.userId;
    currentUserRole = data.role;
    console.log('Authenticated as user:', data.userId, 'Role:', data.role);
    
    // Clear any previous authentication messages
    const existingAuthMsg = document.querySelector('.bot-message');
    if (existingAuthMsg && existingAuthMsg.textContent.includes('Please wait for authentication')) {
      existingAuthMsg.remove();
    }
    
    // Get advisors if student
    if (currentUserRole === 'student') {
      socket.emit('get_advisors');
      socket.emit('get_assigned_advisor');
      addMessage('Welcome! Connecting you with available advisors...', 'bot-message');
    } else if (currentUserRole === 'advisor') {
      addMessage('Welcome Advisor! You can help students with their questions.', 'bot-message');
    } else {
      addMessage('Welcome! How can I help you today?', 'bot-message');
    }
  });
  
  socket.on('auth_error', (error) => {
    console.error('Authentication error:', error.message);
    addMessage('Authentication failed. Please refresh the page.', 'bot-message');
  });
  
  socket.on('private_message', (message) => {
    displayMessage(message);
  });
  
  socket.on('message_sent', (message) => {
    displayMessage(message);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from chat server');
    isAuthenticated = false;
    currentUserRole = null;
  });

  socket.on('advisors_list', (advisors) => {
    availableAdvisors = advisors;
    if (advisors.length > 0) {
      addMessage(`Available advisors: ${advisors.map(a => a.username).join(', ')}`, 'bot-message');
    } else {
      addMessage('No advisors available at the moment.', 'bot-message');
    }
  });

  socket.on('assigned_advisor', (advisor) => {
    assignedAdvisor = advisor;
    if (advisor) {
      addMessage(`You are connected with advisor: ${advisor.username}`, 'bot-message');
    }
  });

  socket.on('new_student_message', (data) => {
    if (currentUserRole === 'advisor') {
      addMessage(`New message from student ${data.studentId}`, 'bot-message');
    }
  });
}

// Authenticate user
function authenticateUser() {
  const storedUserId = localStorage.getItem('userId');
  const storedRole = localStorage.getItem('userRole');
  
  let userId, role;
  
  if (storedUserId && storedRole) {
    userId = storedUserId;
    role = storedRole;
  } else {
    // Create demo user with role selection
    const isStudent = confirm('Are you a student? (OK for Student, Cancel for Advisor)');
    role = isStudent ? 'student' : 'advisor';
    userId = `demo_user_${role}_${Math.random().toString(36).substr(2, 9)}`;
    
    localStorage.setItem('userId', userId);
    localStorage.setItem('userRole', role);
  }
  
  if (socket) {
    socket.emit('authenticate', { userId });
  }
}

// Display message in chat
function displayMessage(message) {
  const isFromCurrentUser = message.from_id === currentUserId;
  const messageClass = isFromCurrentUser ? 'user-message' : 'bot-message';
  
  let messageContent = '';
  if (message.text) {
    messageContent += `<div class="message-text">${message.text}</div>`;
  }
  
  if (message.attachment_path && message.attachment_name) {
    if (message.attachment_name.match(/\.(jpg|jpeg|png|gif)$/i)) {
      messageContent += `<img src="http://localhost:5002/chat-uploads/${message.attachment_path}" class="attachment" />`;
    } else {
      messageContent += `<a href="http://localhost:5002/chat-uploads/${message.attachment_path}" download="${message.attachment_name}" class="attachment">${message.attachment_name}</a>`;
    }
  }
  
  const messageDiv = createMessageElement(messageContent, [messageClass]);
  chatBody.appendChild(messageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
}

// Send message
function sendMessage(e) {
  e.preventDefault();
  const text = messageInput.value.trim();
  
  if (!isAuthenticated) {
    addMessage('Please wait for authentication...', 'bot-message');
    return;
  }
  
  if (!text && !userFile) return;

  let recipientId;
  
  if (currentUserRole === 'student') {
    // Student sends to assigned advisor or first available
    recipientId = assignedAdvisor ? assignedAdvisor.id : (availableAdvisors.length > 0 ? availableAdvisors[0].id : null);
    if (!recipientId) {
      addMessage('No advisors available. Please try again later.', 'bot-message');
      return;
    }
  } else if (currentUserRole === 'advisor') {
    // Advisor needs to specify which student (for demo, send to first student)
    addMessage('Please select a student to message.', 'bot-message');
    return;
  } else {
    // Default behavior for other roles
    recipientId = 'bot_user';
  }

  // Handle file upload first
  if (userFile) {
    uploadFileAndSendMessage(userFile.file, text, recipientId);
    userFile = null;
  } else if (text) {
    // Send text message
    socket.emit('private_message', {
      from: currentUserId,
      to: recipientId,
      text: text
    });
  }

  messageInput.value = "";
}

// Upload file and send message
function uploadFileAndSendMessage(file, text, recipientId) {
  const formData = new FormData();
  formData.append('file', file);
  
  fetch('http://localhost:5002/api/uploads/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      socket.emit('private_message', {
        from: currentUserId,
        to: recipientId,
        text: text,
        attachment_path: data.filePath,
        attachment_name: file.name
      });
    } else {
      addMessage('File upload failed', 'bot-message');
    }
  })
  .catch(error => {
    console.error('Upload error:', error);
    addMessage('File upload failed', 'bot-message');
  });
}

// Add message to chat (for system messages)
function addMessage(text, messageClass) {
  const messageDiv = createMessageElement(`<div class="message-text">${text}</div>`, [messageClass]);
  chatBody.appendChild(messageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
}

// Event listeners
sendMessageButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) sendMessage(e);
});

// File upload
fileUploadButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  userFile = { file, type: file.type };
});

// Toggle chatbot
chatbotToggler.addEventListener("click", () => {
  document.body.classList.toggle("show-chatbot");
  if (document.body.classList.contains("show-chatbot") && !socket) {
    initializeSocket();
  }
});

closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Add Socket.IO script
  const script = document.createElement('script');
  script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
  script.onload = () => {
    console.log('Socket.IO library loaded');
  };
  document.head.appendChild(script);
});
