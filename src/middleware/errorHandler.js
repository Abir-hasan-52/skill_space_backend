// src/middleware/errorHandler.js

// Global error handling middleware
// jodi kono route / controller e error throw hoy
// ekhane dhore nice simple json response pathabo

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Server error",
    // TODO: production e stack send na korleo hoy
    // stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
