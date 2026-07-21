# Chatbot Setup Instructions

## How to Run the Chatbot

### 1. Start the Chat Server
- Run the `start-chat.bat` file to start the chat server on port 5001
- The server will handle Socket.IO connections and file uploads

### 2. Test the Chatbot
- Open `test-chatbot.html` in your browser to test the chatbot
- Or navigate to any page that includes the chatbot

### 3. Features
- Real-time messaging with Socket.IO
- File upload support (images, documents)
- Bot auto-responses
- User authentication
- CORS enabled for local development

### 4. Troubleshooting
- If the chatbot doesn't connect, make sure the chat server is running
- Check that port 5001 is not blocked by firewall
- Ensure all dependencies are installed (`npm install` in Backend folder)

### 5. File Structure
- `Backend/chat-server.js` - Main chat server
- `Frontend/chatbot/` - Chatbot frontend files
- `Backend/routes/chat-*` - API routes for chat functionality
- `Backend/models/chat-*` - Database models for chat

## Fixed Issues
1. ✅ Socket.IO connection established between frontend and backend
2. ✅ CORS configuration for proper communication
3. ✅ Database connection error handling
4. ✅ User authentication flow
5. ✅ File upload functionality
6. ✅ Bot auto-response system