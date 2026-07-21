// routes/chat-uploads.js
const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/chat-uploadController');
const { upload } = require('../chat-upload');

// Single file upload
router.post('/', upload.single('file'), uploadFile);

module.exports = router;
