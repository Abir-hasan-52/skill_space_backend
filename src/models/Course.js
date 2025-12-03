// src/models/Course.js
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    videoUrl: { type: String },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String], // 4 ta option expected
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length === 4;
        },
        message: "Quiz must have exactly 4 options",
      },
    },
    correctIndex: {
      type: Number,
      min: 0,
      max: 3,
      required: true,
    },
  },
  { _id: false }
);

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    // lessons: array of { title, videoUrl }
    lessons: {
      type: [lessonSchema],
      default: [],
    },

    // kon lesson free preview (index)
    freeLessonIndex: {
      type: Number,
      min: 0,
      default: 0,
    },

    // assignment info
    assignmentUrl: { type: String },
    assignmentDescription: { type: String },

    // quiz: multiple questions
    quiz: {
      type: [quizQuestionSchema],
      default: [],
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    // basic info
    title: { type: String, required: true },
    batch: { type: String, required: true },

    category: { type: String },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    language: { type: String, default: "English" },
    duration: { type: String },

    // descriptions
    shortDescription: { type: String },
    description: { type: String },

    // pricing
    price: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },

    // media & instructor
    thumbnail: { type: String },
    instructorName: { type: String },
    instructorTitle: { type: String },

    // learning outcomes
    learningOutcomes: {
      type: [String],
      default: [],
    },

    // course modules
    modules: {
      type: [moduleSchema],
      default: [],
    },

    // status (draft/published)
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    // optional: kon admin create koreche
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
