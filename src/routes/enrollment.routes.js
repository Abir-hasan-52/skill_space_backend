const express = require("express");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");
const { protect, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * Helper: recalc progress based on completedLessons & total lessons
 */
async function recalcProgress(enrollment) {
  // course populate na thakle load kore nao
  let course = enrollment.course;
  if (!course || !course.modules) {
    course = await Course.findById(enrollment.course);
  }

  if (!course || !Array.isArray(course.modules)) {
    enrollment.progress = 0;
    return enrollment;
  }

  const totalLessons = course.modules.reduce((sum, mod) => {
    return sum + (Array.isArray(mod.lessons) ? mod.lessons.length : 0);
  }, 0);

  if (!totalLessons) {
    enrollment.progress = 0;
    return enrollment;
  }

  const uniqueKeys = new Set(
    (enrollment.completedLessons || []).map(
      (cl) => `${cl.moduleIndex}-${cl.lessonIndex}`
    )
  );

  const completedCount = uniqueKeys.size;
  const progress = Math.round((completedCount / totalLessons) * 100);

  enrollment.progress = progress;

  if (progress >= 100) {
    enrollment.status = "completed";
  }

  return enrollment;
}

/**
 * @route   POST /api/enrollments
 * @desc    Enroll current user to a course
 * @access  Protected
 * Body: { courseId }
 */
router.post("/", protect, async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const course = await Course.findOne({ _id: courseId, status: "published" });
    if (!course) {
      return res
        .status(404)
        .json({ message: "Course not found or unpublished" });
    }

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
router.get("/status/:courseId", protect, async (req, res, next) => {
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

/**
 * @route   GET /api/enrollments/my
 * @desc    Get all courses enrolled by current logged-in user
 * @access  Protected (student)
 */
router.get("/my", protect, async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: "course",
        select:
          "title thumbnail shortDescription category level duration price discountPrice isFree status",
      })
      .sort({ createdAt: -1 });

    res.json({ enrollments });
  } catch (err) {
    console.error("Get my enrollments error:", err);
    next(err);
  }
});

/**
 * @route   GET /api/enrollments/by-email/:email
 * @desc    Get enrollments by student email (admin view)
 * @access  Admin
 */
router.get(
  "/by-email/:email",
  protect,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { email } = req.params;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "Student not found" });
      }

      const enrollments = await Enrollment.find({ student: user._id })
        .populate({
          path: "course",
          select:
            "title thumbnail shortDescription category level duration price discountPrice isFree status",
        })
        .sort({ createdAt: -1 });

      res.json({
        student: {
          name: user.name,
          email: user.email,
        },
        enrollments,
      });
    } catch (err) {
      console.error("Get enrollments by email error:", err);
      next(err);
    }
  }
);

/**
 * @route   GET /api/enrollments/by-course/:courseId
 * @desc    Admin: view all students enrolled in a specific course
 * @access  Admin
 */
router.get(
  "/by-course/:courseId",
  protect,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { courseId } = req.params;

      const enrollments = await Enrollment.find({ course: courseId })
        .populate({
          path: "student",
          select: "name email role",
        })
        .populate({
          path: "course",
          select: "title batch category level status",
        })
        .sort({ createdAt: -1 });

      res.json({ enrollments });
    } catch (err) {
      console.error("Get enrollments by course error:", err);
      next(err);
    }
  }
);


/**
 * @route   GET /api/enrollments/:courseId/assignments/admin
 * @desc    Admin: view all assignment submissions of a course
 * @access  Admin
 * Query:   ?moduleIndex=0   (optional filter)
 */
router.get(
  "/:courseId/assignments/admin",
  protect,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const moduleIndexFilter = req.query.moduleIndex;

      const enrollments = await Enrollment.find({
        course: courseId,
        "assignments.0": { $exists: true },
      })
        .populate("student", "name email")
        .populate("course", "title batch")
        .sort({ createdAt: -1 });

      const submissions = [];

      enrollments.forEach((enroll) => {
        enroll.assignments.forEach((a) => {
          if (
            moduleIndexFilter !== undefined &&
            Number(moduleIndexFilter) !== a.moduleIndex
          )
            return;

          submissions.push({
            student: enroll.student,
            course: enroll.course,
            moduleIndex: a.moduleIndex,
            link: a.link,
            answerText: a.answerText,
            submittedAt: a.submittedAt,
            status: a.status,
            score: a.score,
          });
        });
      });

      res.json({
        totalSubmissions: submissions.length,
        submissions,
      });
    } catch (error) {
      console.error("Error fetching assignment submissions:", error);
      next(error);
    }
  }
);

/**
 * @route   GET /api/enrollments/course/:courseId
 * @desc    Get course + enrollment details for learning view
 * @access  Protected (student must be enrolled)
 */
router.get("/course/:courseId", protect, async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    }).populate("course");

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course." });
    }

    res.json({
      course: enrollment.course,
      enrollment,
    });
  } catch (err) {
    console.error("Get learning view error:", err);
    next(err);
  }
});

/**
 * @route   POST /api/enrollments/:courseId/lessons/complete
 * @desc    Mark a lesson as completed & update progress
 * @access  Protected
 * Body: { moduleIndex, lessonIndex }
 */
router.post("/:courseId/lessons/complete", protect, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { moduleIndex, lessonIndex } = req.body;

    if (typeof moduleIndex !== "number" || typeof lessonIndex !== "number") {
      return res
        .status(400)
        .json({ message: "moduleIndex and lessonIndex must be numbers." });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course." });
    }

    const exists = enrollment.completedLessons.some(
      (cl) => cl.moduleIndex === moduleIndex && cl.lessonIndex === lessonIndex
    );

    if (!exists) {
      enrollment.completedLessons.push({ moduleIndex, lessonIndex });
    }

    await recalcProgress(enrollment);
    const saved = await enrollment.save();

    res.json({
      message: "Lesson marked as completed.",
      enrollment: saved,
    });
  } catch (err) {
    console.error("Complete lesson error:", err);
    next(err);
  }
});

/**
 * @route   POST /api/enrollments/:courseId/assignments
 * @desc    Submit assignment for a module
 * @access  Protected
 * Body: { moduleIndex, link, answerText }
 */
router.post("/:courseId/assignments", protect, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { moduleIndex, link, answerText } = req.body;

    if (typeof moduleIndex !== "number") {
      return res.status(400).json({ message: "moduleIndex must be a number." });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course." });
    }

    const submission = {
      moduleIndex,
      link,
      answerText,
      submittedAt: new Date(),
      status: "submitted",
    };

    enrollment.assignments.push(submission);
    const saved = await enrollment.save();

    res.status(201).json({
      message: "Assignment submitted successfully.",
      enrollment: saved,
      latestSubmission: submission,
    });
  } catch (err) {
    console.error("Assignment submit error:", err);
    next(err);
  }
});

/**
 * @route   POST /api/enrollments/:courseId/quizzes
 * @desc    Submit quiz answers for a module
 * @access  Protected
 * Body: { moduleIndex, answers: [Number] }
 */
router.post("/:courseId/quizzes", protect, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { moduleIndex, answers } = req.body;

    if (typeof moduleIndex !== "number" || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "moduleIndex must be number and answers must be an array.",
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    }).populate("course");

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course." });
    }

    const course = enrollment.course;
    const module = course.modules?.[moduleIndex];

    if (!module || !Array.isArray(module.quiz)) {
      return res.status(400).json({
        message: "Quiz not found for this module.",
      });
    }

    const total = module.quiz.length;
    const correctAnswers = module.quiz.map((q) => q.correctIndex);

    let score = 0;
    for (let i = 0; i < total; i++) {
      if (Number(answers[i]) === Number(correctAnswers[i])) {
        score++;
      }
    }

    const attempt = {
      moduleIndex,
      score,
      total,
      submittedAt: new Date(),
    };

    enrollment.quizzes.push(attempt);
    const saved = await enrollment.save();

    res.json({
      message: "Quiz submitted.",
      score,
      total,
      correctAnswers,
      enrollment: saved,
    });
  } catch (err) {
    console.error("Quiz submit error:", err);
    next(err);
  }
});

/**
 * @route   GET /api/enrollments/by-course/:courseId
 * @desc    Admin: view all students enrolled in a specific course
 * @access  Admin
 */
router.get(
  "/by-course/:courseId",
  protect,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { courseId } = req.params;

      const enrollments = await Enrollment.find({ course: courseId })
        .populate({
          path: "student",
          select: "name email role",
        })
        .populate({
          path: "course",
          select: "title batch category level status",
        })
        .sort({ createdAt: -1 });

      res.json({ enrollments });
    } catch (err) {
      console.error("Get enrollments by course error:", err);
      next(err);
    }
  }
);

module.exports = router;
