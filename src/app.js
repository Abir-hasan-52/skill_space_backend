// src/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");

// env load
dotenv.config();

// DB connect
connectDB();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);

// test route
app.get("/", (req, res) => {
  res.send("SkillSpace API is running");
});

// ekhane por e add korbo routes gula:
// app.use("/api/auth", require("./routes/auth.routes"));
// app.use("/api/courses", require("./routes/course.routes"));

module.exports = app;
