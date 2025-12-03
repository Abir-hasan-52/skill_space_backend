// src/utils/generateToken.js
const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // 7 din valid
  );
};

module.exports = generateToken;
