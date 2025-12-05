// src/routes/user.routes.js
const express = require("express");
const User = require("../models/User");
// const { protect, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   GET /api/users/role/:email
 * @desc    Check user role (admin/student) by email
 * @access  Public (chaile protect/requireAdmin use korte paro)
 *
 * Response:
 *  - 200: { exists: true, role: "admin" | "student", user: { name, email, role } }
 *  - 404: { exists: false, message: "User not found" }
 */
router.get("/role/:email", async (req, res, next) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required", exists: false });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", exists: false });
    }

    return res.json({
      exists: true,
      role: user.role, // "admin" or "student"
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Check role error:", err);
    next(err);
  }
});

module.exports = router;
