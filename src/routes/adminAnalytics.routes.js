// src/routes/adminAnalytics.routes.js
const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { protect, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   GET /api/admin/analytics/summary
 * @desc    Basic admin dashboard summary stats
 * @access  Admin
 *
 * Response:
 * {
 *   totalStudents,
 *   totalAdmins,
 *   totalCourses,
 *   totalEnrollments,
 *   activeBatches
 * }
 */
router.get("/summary", protect, requireAdmin, async (req, res, next) => {
  try {
    const [studentsCount, adminsCount, coursesCount, enrollmentsCount] =
      await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "admin" }),
        Course.countDocuments({}),
        Enrollment.countDocuments({}),
      ]);

    // Active batches: distinct batch name from published courses
    const activeBatchNames = await Course.distinct("batch", {
      status: "published",
    });

    res.json({
      totalStudents: studentsCount,
      totalAdmins: adminsCount,
      totalCourses: coursesCount,
      totalEnrollments: enrollmentsCount,
      activeBatches: activeBatchNames.length,
    });
  } catch (err) {
    console.error("Admin summary analytics error:", err);
    next(err);
  }
});

/**
 * @route   GET /api/admin/analytics/enrollments-over-time
 * @desc    Enrollments count grouped by date
 * @access  Admin
 *
 * Query params:
 *   range = "7d" | "30d" | "90d" (default: 30d)
 *
 * Response:
 * {
 *   data: [
 *     { date: "2025-12-01", count: 5 },
 *     { date: "2025-12-02", count: 8 },
 *     ...
 *   ]
 * }
 */
router.get(
  "/enrollments-over-time",
  protect,
  requireAdmin,
  async (req, res, next) => {
    try {
      const range = req.query.range || "30d";

      let days = 30;
      if (range === "7d") days = 7;
      else if (range === "90d") days = 90;

      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - days + 1); // last N days

      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1,
          },
        },
      ];

      const aggResult = await Enrollment.aggregate(pipeline);

      const data = aggResult.map((item) => {
        const { year, month, day } = item._id;
        const dateObj = new Date(year, month - 1, day);
        return {
          date: dateObj.toISOString(), // frontend e ami label convert kore nicchi
          count: item.count,
        };
      });

      res.json({ data });
    } catch (err) {
      console.error("Enrollments-over-time analytics error:", err);
      next(err);
    }
  }
);

module.exports = router;
