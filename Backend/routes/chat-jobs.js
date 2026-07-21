const express = require('express');
const router = express.Router();
const auth = require('../middleware/chat-auth');
const controller = require('../controllers/chat-jobControllers');

router.post('/', auth, controller.createJob);
router.get('/', controller.listJobs);
router.get('/:id', controller.getJob);

module.exports = router;
