// src/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const adminCourseRoutes = require("./routes/adminCourse.routes"); // 👈 new

const errorHandler = require("./middleware/errorHandler");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SkillSpace API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin/courses", adminCourseRoutes); // 👈 here

app.use(errorHandler);

module.exports = app;
