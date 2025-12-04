// src/routes/auth.routes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Student registration (password ashbe backend e)
 * @access  Public
 *
 * Flow:
 *  1) Firebase signup in frontend
 *  2) Backend POST /register → hash password, store user
 */
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    // Hash password (backend memory)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
    });

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
 *
 * Backend password check is OPTIONAL now
 * because Firebase already verified password.
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
