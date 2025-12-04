// src/middleware/auth.js
const admin = require("../utils/firebaseAdmin");
const User = require("../models/User");

// 🔒 Protected route for any logged-in user (student/admin)
const protect = async (req, res, next) => {
  let token;

  // Expect: Authorization: Bearer <firebase_id_token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // ✅ Firebase ID token verify
    const decoded = await admin.auth().verifyIdToken(token);
    // decoded e thakbe: uid, email, name, etc.

    // Firebase theke asha user info
    const firebaseUid = decoded.uid;
    const email = decoded.email;

    if (!email) {
      return res.status(401).json({
        message: "Token is valid but email is missing in Firebase token",
      });
    }

    // 🚩 Option 1: User collection e email diye khujbo
    let user = await User.findOne({ email });

    // Jodi DB te user na thake, tahole notun user auto-create (optional)
    if (!user) {
      user = await User.create({
        name: decoded.name || "Unnamed User",
        email,
        role: "student", // default role
        firebaseUid,     // jodi model e field thake, nice add korte paro
      });
    }

    // Request e user object set kore dilam
    req.user = user; // ei user._id, user.role sob pabe

    next();
  } catch (error) {
    console.error("Firebase auth error:", error.message);
    return res
      .status(401)
      .json({ message: "Not authorized, invalid Firebase token" });
  }
};

// 🔑 Only admin access middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};

module.exports = { protect, requireAdmin };
