const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const emailValidator = require("deep-email-validator");
const nodemailer = require("nodemailer");
const User = require("../models/User");

dotenv.config();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }// Backend/controllers/authController.js
,
});

// Helper function to validate email
async function isEmailValid(email) {
  return emailValidator.validate(email);
}

const jwtSecret = process.env.JWT_SECRET || "change_this";
const tokenExpiry = process.env.TOKEN_EXPIRY || "7d";

const register = async (req, res) => {
  try {
    const { username, email, mobile, password, role, redirect } = req.body;
    if (!username || !email || !mobile || !password)
      return res.status(400).json({ error: "All fields are required" });

    // Validate phone number: exactly 11 digits and starts with '01'
    if (!/^[0][1][0-9]{9}$/.test(mobile)) {
      return res.status(400).json({ error: "Phone number must be exactly 11 digits and start with '01'" });
    }

    // Validate email existence
    const { valid, reason, validators } = await isEmailValid(email);
    if (!valid) {
      return res.status(400).json({
        error: "Invalid email address. Please provide a real email account.",
        details: validators[reason]?.reason || reason
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, mobile, role: role || "student", password: passwordHash });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: tokenExpiry });

    const response = {
      token,
      user: { id: user.id, username: user.username, email: user.email, mobile: user.mobile, role: user.role }
    };

    // Include redirect URL if provided
    if (redirect) {
      response.redirect = redirect;
    }

    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role, redirect } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Check if the selected role matches the user's actual role
    if (role && user.role !== role) {
      return res.status(401).json({ error: `Access denied. Please log in as a ${user.role}.` });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: tokenExpiry });

    const response = {
      token,
      user: { id: user.id, username: user.username, email: user.email, mobile: user.mobile, role: user.role }
    };

    // Include redirect URL if provided
    if (redirect) {
      response.redirect = redirect;
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const me = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findByPk(userId, { attributes: ["id", "username", "email", "mobile", "role"] });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const logout = async (req, res) => {
  try {
    // For JWT-based auth, logout is handled client-side by removing the token
    // We can optionally blacklist tokens if needed, but for now just return success
    res.json({ message: "Logout successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const checkEmailExistence = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const { valid, reason, validators } = await isEmailValid(email);

    if (valid) {
      return res.json({ valid: true, message: "Email exists" });
    } else {
      return res.json({
        valid: false,
        message: "Invalid email",
        reason: validators[reason]?.reason || reason
      });
    }
  } catch (err) {
    console.error("Email validation error:", err);
    res.status(500).json({ error: "Server error during email validation" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "Invalid Email Address" });

    // Generate 6-digit code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code - JobPortal",
      text: `Your password reset code is: ${resetToken}`,
    };

    // Attempt to send email
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        res.json({ message: "Reset code sent to email" });
      } else {
        console.warn("Email credentials not found. Printing token to console.");
        console.log(`[DEV] Reset Token for ${email}: ${resetToken}`);
        res.json({ message: "Reset code generated (check console for dev mode)" });
      }
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      // Fallback for dev
      console.log(`[DEV] Reset Token for ${email}: ${resetToken}`);
      res.json({ message: "Reset code generated (check console)" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword)
      return res.status(400).json({ error: "All fields are required" });

    const user = await User.findOne({ where: { email, resetPasswordToken: code } });

    if (!user) return res.status(400).json({ error: "Invalid code or email" });

    if (user.resetPasswordExpires < Date.now()) {
       return res.status(400).json({ error: "Code expired" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.password = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
       console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { username, email, mobile, password, currentPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate current password if changing password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required to change password" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    }

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      user.password = passwordHash;
    }

    await user.save();

    res.json({ message: "Profile updated successfully", user: { id: user.id, username: user.username, email: user.email, mobile: user.mobile, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { register, login, me, logout, checkEmailExistence, forgotPassword, resetPassword, updateProfile };
