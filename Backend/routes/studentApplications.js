const express = require("express");
const router = express.Router();
const { getStudentApplications } = require("../controllers/studentApplicationsController");
const authMiddleware = require("../middleware/authMiddleware");

// Get student's applied jobs
router.get("/applied-jobs", authMiddleware, getStudentApplications);

module.exports = router;