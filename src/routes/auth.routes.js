// src/routes/auth.routes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Student registration (password ashbe backend e)
 * @access  Public
 */
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1) Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // 2) Existing user check
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    // 3) Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4) Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
    });

    // 5) Send welcome email (non-blocking or await – duitar ekta)
    const dashboardUrl =
      process.env.FRONTEND_DASHBOARD_URL || "http://localhost:5173/dashboard";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <h2>Welcome to SkillSpace, ${name}!</h2>
          <p>Your account has been successfully created.</p>
          <p>We’re excited to have you on board. Start learning and grow your skills.</p>
          <p>
            <a href="${dashboardUrl}" style="
              display:inline-block;
              padding:8px 16px;
              background:#2563eb;
              color:#ffffff;
              border-radius:999px;
              text-decoration:none;
              font-size:14px;
            ">
              Go to your dashboard
            </a>
          </p>
          <p style="font-size:12px;color:#6b7280;">
            If the button doesn't work, copy and paste this URL in your browser:<br/>
            <span style="color:#2563eb;">${dashboardUrl}</span>
          </p>
          <p>Best regards,<br/>SkillSpace Team</p>
        </body>
      </html>
    `;

    // ei line await সহ রাখলে mail error hole catch e dhora porbe:
    sendEmail(email, "Welcome to SkillSpace 🎉", htmlContent);

    // 6) Response
    res.status(201).json({
      message: "Registration successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    next(err);
  }
});

/**
 * @route   POST /api/auth/admin-register
 * @desc    Admin registration with secret key
 * @access  Public
 */
router.post("/admin-register", async (req, res, next) => {
  try {
    const { name, email, password, adminSecretKey } = req.body;

    if (!name || !email || !password || !adminSecretKey) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    // optional: admin keo mail dite chao hole ekhane sendEmail call korte paro

    res.status(201).json({
      message: "Admin registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Sync user after Firebase login
 * @access  Public
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User does not exist in backend, please register",
      });
    }

    res.json({
      message: "Login sync successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get logged-in user (Firebase token required)
 * @access  Private
 */
router.get("/me", protect, async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
