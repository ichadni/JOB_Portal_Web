const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const emailValidator = require("deep-email-validator");
const nodemailer = require("nodemailer");
const User = require("../models/User");

dotenv.config();

// ✅ Configure Nodemailer (Fixed)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to validate email
async function isEmailValid(email) {
  return emailValidator.validate({
    email,
    validateRegex: true,
    validateMx: true,
    validateTypo: true,
    validateDisposable: true,
    validateSMTP: false,
  });
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

    if (role && user.role !== role) {
      return res.status(401).json({ error: `Access denied. Please log in as a ${user.role}.` });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: tokenExpiry });

    const response = {
      token,
      user: { id: user.id, username: user.username, email: user.email, mobile: user.mobile, role: user.role }
    };

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

// ✅ FORGOT PASSWORD - Sends 6-digit code to email
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

    // ✅ Email HTML Template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #6a1b9a; padding-bottom: 15px; }
          .header h2 { color: #6a1b9a; margin: 0; }
          .code { font-size: 36px; font-weight: bold; color: #6a1b9a; text-align: center; padding: 20px; background: #f5f0ff; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
          .warning { color: #e74c3c; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Password Reset</h2>
          </div>
          <p>Hello ${user.username},</p>
          <p>You requested to reset your password. Use the 6-digit code below:</p>
          <div class="code">${resetToken}</div>
          <p>This code will expire in <strong>1 hour</strong>.</p>
          <p class="warning">⚠️ If you didn't request this, please ignore this email.</p>
          <div class="footer">
            <p>Job Portal App &copy; 2024</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔐 Password Reset Code - JobPortal",
      text: `Your password reset code is: ${resetToken}`,
      html: htmlTemplate,
    };

    // ✅ Send Email
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      res.json({ message: "Reset code sent to your email" });
    } catch (emailErr) {
      console.error("❌ Email send error:", emailErr);
      // Fallback: Show code in console for development
      console.log(`📧 [DEV] Reset Token for ${email}: ${resetToken}`);
      res.json({ message: "Reset code generated. Check console for dev mode." });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ RESET PASSWORD - Verifies code and updates password
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

    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required to change password" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    }

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