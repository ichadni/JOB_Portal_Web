// Backend/routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/check-email", authController.checkEmailExistence);router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Protected routes
router.get("/me", authMiddleware, authController.me);
router.post("/logout", authMiddleware, authController.logout);
router.put("/update-profile", authMiddleware, authController.updateProfile);

module.exports = router;