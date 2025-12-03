// src/routes/adminCourse.routes.js
const express = require("express");
const Course = require("../models/Course");
const { protect, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course (with batch, modules, quiz, assignment)
 * @access  Admin (protected)
 */

// (protect, requireAdmin) middleware use kora lagbe
router.post("/", async (req, res, next) => {
  try {
    const payload = req.body;

    // small safety: jodi isFree true hoy, price 0 kore dei
    if (payload.isFree) {
      payload.price = 0;
      payload.discountPrice = 0;
    }

    // creator info add (optional)
    if (req.user?._id) {
      payload.createdBy = req.user._id;
    }

    // modules er quiz data ensure (options/ correctIndex type)
    if (Array.isArray(payload.modules)) {
      payload.modules = payload.modules.map((mod) => {
        const updatedModule = { ...mod };

        if (Array.isArray(mod.quiz)) {
          updatedModule.quiz = mod.quiz.map((q) => ({
            question: q.question,
            options: q.options || [], // frontend theke already 4 option ashar kotha
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

module.exports = router;
