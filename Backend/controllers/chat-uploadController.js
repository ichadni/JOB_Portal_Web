// controllers/chat-uploadController.js
const { upload, UPLOAD_DIR } = require('../chat-upload'); // import multer instance and upload directory
const path = require('path');

exports.uploadFile = (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

  // Construct URL to serve the file
  const url = `/chat-uploads/${req.file.filename}`;

  res.json({ 
    success: true,
    url, 
    filename: req.file.originalname, 
    filePath: req.file.filename 
  });
};
