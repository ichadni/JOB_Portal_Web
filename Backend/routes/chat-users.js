const express = require('express');
const router = express.Router();
const auth = require('../middleware/chat-auth');
const controller = require('../controllers/chat-userController');

router.get('/profile', auth, controller.getProfile);
router.put('/profile', auth, controller.updateProfile);

module.exports = router;
