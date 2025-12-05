const mongoose = require("mongoose");

const completedLessonSchema = new mongoose.Schema(
  {
    moduleIndex: { type: Number, required: true },
    lessonIndex: { type: Number, required: true },
  },
  { _id: false }
);

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    moduleIndex: { type: Number, required: true },
    link: { type: String }, // Google Drive link
    answerText: { type: String }, // jodi text answer hoy
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["submitted", "reviewed"],
      default: "submitted",
    },
    score: { type: Number }, // optional future use
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    moduleIndex: { type: Number, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["enrolled", "completed"],
      default: "enrolled",
    },
    // ✅ overall progress (0–100)
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // ✅ kon kon lesson complete
    completedLessons: [completedLessonSchema],

    // ✅ assignment submissions (per module)
    assignments: [assignmentSubmissionSchema],

    // ✅ quiz attempts (per module)
    quizzes: [quizAttemptSchema],
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
