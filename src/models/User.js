const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      // note: always store HASHED password here
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    // optional fields
    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
    },

    firebaseUid: {
      type: String, // jodi Firebase use koro
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
