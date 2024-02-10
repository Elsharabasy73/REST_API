const { body } = require("express-validator");
const User = require("../models/user");

exports.signup = [
  body("name").trim().not().isEmpty(),
  body("email", "Please use a valid email.")
    .trim()
    .isEmail()
    .custom((value, { req }) => {
      User.findOne({ email: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject("Email already exists.");
        }
      });
    }),
  body("password").isLength({ min: 5 }),
];
