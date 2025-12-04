// src/routes/course.routes.js
const express = require("express");
const Course = require("../models/Course");

const router = express.Router();

/**
 * @route   GET /api/courses
 * @desc    Get all published courses (public) with
 *          - Server-side pagination
 *          - Search (title / instructorName)
 *          - Sort (price low/high)
 *          - Filter (category)
 *
 * Query params:
 *  - page (default: 1)
 *  - limit (default: 9)
 *  - search (optional, title/instructor)
 *  - sort (price_asc | price_desc | newest)
 *  - category (optional)
 */
router.get("/", async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 9,
      search = "",
      sort = "newest",
      category,
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 9;

    const filter = { status: "published" };

    // category filter
    if (category && category !== "all") {
      filter.category = category;
    }

    // search by title or instructorName
    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive
      filter.$or = [{ title: regex }, { instructorName: regex }];
    }

    // sort option
    let sortOption = {};
    if (sort === "price_asc") {
      sortOption.price = 1;
    } else if (sort === "price_desc") {
      sortOption.price = -1;
    } else {
      // newest
      sortOption.createdAt = -1;
    }

    const totalItems = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    const courses = await Course.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      courses,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error("Public get courses error:", err);
    next(err);
  }
});

/**
 * @route   GET /api/courses/:id
 * @desc    Get single published course details
 * @access  Public
 */
router.get("/:id", async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      status: "published",
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ course });
  } catch (err) {
    console.error("Public get course by id error:", err);
    next(err);
  }
});

module.exports = router;
