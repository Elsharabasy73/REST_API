const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.creatUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { name, email, password } = req.body;

  try {
    const hashedPass = await bcrypt.hash(password, 12);
    const user = new User({
      name: name,
      email: email,
      password: hashedPass,
    });
    const savedUser = await user.save();
    res.json({ message: "Signup Successfully!", userId: savedUser._id });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User don't exist.");
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Wrong password");
      error.statusCode = 401;
      throw error;
    }
    //generating JSON web token.
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id,
      },
      "secret",
      { expiresIn: "1h" }
    );
    res.status(200).json({ token: token, userId: user._id.toString() });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
