// src/routes/enrollment.routes.js
const express = require("express");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { protect } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/enrollments
 * @desc    Enroll current user to a course
 * @access  Protected (student/admin sobai enroll korte parbe)
 * Body: { courseId }
 * 
 */
// protect,
router.post("/",  protect, async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    // course exists & published kina check (optional)
    const course = await Course.findOne({ _id: courseId, status: "published" });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unpublished" });
    }

    // jodi age thekei enroll thake
    const existing = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (existing) {
      return res.status(200).json({
        message: "Already enrolled in this course",
        enrollment: existing,
        alreadyEnrolled: true,
      });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
    });

    res.status(201).json({
      message: "Enrolled successfully",
      enrollment,
      alreadyEnrolled: false,
    });
  } catch (err) {
    console.error("Enrollment error:", err);
    next(err);
  }
});

/**
 * @route   GET /api/enrollments/status/:courseId
 * @desc    Check if current user is enrolled in given course
 * @access  Protected
 */
// protect,
router.get("/status/:courseId", protect,  async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    res.json({
      isEnrolled: !!enrollment,
    });
  } catch (err) {
    console.error("Enrollment status error:", err);
    next(err);
  }
});

module.exports = router;
