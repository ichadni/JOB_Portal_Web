// Backend/routes/applications.js
// const express = require("express");
// const router = express.Router();

// Application routes will be implemented here
// GET /api/applications - Get applications (for job posters)
// POST /api/applications - Submit new application
// GET /api/applications/my - Get user's applications
// PUT /api/applications/:id - Update application status

// router.get("/", async (req, res) => {
//   try {
//     res.json({ message: "Applications endpoint - to be implemented" });
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;
const express = require('express');
const { apply, getForJob, upload, getMyApplications } = require('../controllers/recuiterapplicationcontroller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, upload.single('resume'), apply);
router.get('/my-applications', authMiddleware, getMyApplications);
router.get('/job/:jobId', authMiddleware, getForJob);

module.exports = router;
