// Backend/routes/jobs.js
// const express = require("express");
// const router = express.Router();

// Job routes will be implemented here
// GET /api/jobs - Get all jobs
// GET /api/jobs/:id - Get job by id
// POST /api/jobs - Create new job (recruiter only)
// PUT /api/jobs/:id - Update job (recruiter only)
// DELETE /api/jobs/:id - Delete job (recruiter only)

// router.get("/", async (req, res) => {
//   try {
//     res.json({ message: "Jobs endpoint - to be implemented" });
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;
const express = require("express");
const { listJobs, getJob } = require("../controllers/jobsController");

const router = express.Router();

// GET /jobs - Get all jobs (for homepage)
//---public--//
router.get("/", listJobs);

// GET /jobs/:id - Get specific job details
router.get("/:id", getJob);

module.exports = router;