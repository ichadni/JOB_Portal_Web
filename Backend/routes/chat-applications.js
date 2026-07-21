const express = require('express');
const router = express.Router();
const auth = require('../middleware/chat-auth');
const controller = require('../controllers/chat-applicationController');

router.post('/', auth, controller.applyJob);
router.get('/', auth, controller.listApplications);

module.exports = router;
