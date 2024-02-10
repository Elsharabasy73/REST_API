const { validationResult } = require("express-validator");
const User = require("../models/user");

exports.creatUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { name, email, password } = req.body;
  res.json({ name, email });
};
