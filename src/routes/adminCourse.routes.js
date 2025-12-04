// src/routes/adminCourse.routes.js
const express = require("express");
const Course = require("../models/Course");
const User = require("../models/User"); // get-by-email er jonno
const { protect, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course (with batch, modules, quiz, assignment)
 * @access  Admin
 */
// protect, requireAdmin, 
router.post("/", protect, async (req, res, next) => {
  try {
    const payload = req.body;

    // Free course hole price 0 kore dao
    if (payload.isFree) {
      payload.price = 0;
      payload.discountPrice = 0;
    }

    // kon admin create korse
    if (req.user?._id) {
      payload.createdBy = req.user._id;
    }

    // modules.quiz er correctIndex ensure number
    if (Array.isArray(payload.modules)) {
      payload.modules = payload.modules.map((mod) => {
        const updatedModule = { ...mod };

        if (Array.isArray(mod.quiz)) {
          updatedModule.quiz = mod.quiz.map((q) => ({
            question: q.question,
            options: q.options || [],
            correctIndex:
              typeof q.correctIndex === "string"
                ? Number(q.correctIndex)
                : q.correctIndex,
          }));
        }

        return updatedModule;
      });
    }

    const course = await Course.create(payload);

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (err) {
    console.error("Create course error:", err);
    next(err);
  }
});

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses (admin view) - draft + published
 * @access  Admin
 */
router.get("/", protect, requireAdmin, async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ courses });
  } catch (err) {
    console.error("Get all courses error:", err);
    next(err);
  }
});

/**
 * @route   GET /api/admin/courses/my
 * @desc    Get courses created by logged-in admin
 * @access  Admin
 */
router.get("/my", protect, requireAdmin, async (req, res, next) => {
  try {
    const courses = await Course.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ courses });
  } catch (err) {
    console.error("Get my courses error:", err);
    next(err);
  }
});

/**
 * @route   GET /api/admin/courses/by-email/:email
 * @desc    Get courses created by admin email
 * @access  Admin
 *
 * NOTE:
 *  - Prothome User collection theke email diye admin khuje,
 *    pore tar _id diye course filter kortechi
 */
router.get("/by-email/:email", protect, requireAdmin, async (req, res, next) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email, role: "admin" });
    if (!user) {
      return res.status(404).json({ message: "Admin with this email not found" });
    }

    const courses = await Course.find({ createdBy: user._id }).sort({
      createdAt: -1,
    });

    res.json({ courses });
  } catch (err) {
    console.error("Get courses by email error:", err);
    next(err);
  }
});

/**
 * @route   GET /api/admin/courses/:id
 * @desc    Get single course by id (admin) - can see draft/published
 * @access  Admin
 */
router.get("/:id", protect, requireAdmin, async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ course });
  } catch (err) {
    console.error("Get course by id error:", err);
    next(err);
  }
});

/**
 * @route   PUT /api/admin/courses/:id
 * @desc    Update a course
 * @access  Admin
 */
router.put("/:id", protect, requireAdmin, async (req, res, next) => {
  try {
    const payload = req.body;

    if (payload.isFree) {
      payload.price = 0;
      payload.discountPrice = 0;
    }

    // correctIndex number kore nicchi
    if (Array.isArray(payload.modules)) {
      payload.modules = payload.modules.map((mod) => {
        const updatedModule = { ...mod };

        if (Array.isArray(mod.quiz)) {
          updatedModule.quiz = mod.quiz.map((q) => ({
            question: q.question,
            options: q.options || [],
            correctIndex:
              typeof q.correctIndex === "string"
                ? Number(q.correctIndex)
                : q.correctIndex,
          }));
        }

        return updatedModule;
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (err) {
    console.error("Update course error:", err);
    next(err);
  }
});

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Delete a course
 * @access  Admin
 */
router.delete("/:id", protect, requireAdmin, async (req, res, next) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "Course deleted successfully",
    });
  } catch (err) {
    console.error("Delete course error:", err);
    next(err);
  }
});

module.exports = router;
