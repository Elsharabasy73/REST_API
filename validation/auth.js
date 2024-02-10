const { body } = require("express-validator");
const User = require("../models/user");

exports.signup = [
  body("name").trim().not().isEmpty(),
  body("email", "Please use a valid email.")
    .trim()
    .isEmail()
    .withMessage("email not valid")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject("Email already exists.");
        }
      });
    }),
  body("password")
    .isLength({ min: 5 })
    .withMessage("Password length must be bigger that 4"),
];
exports.login = [
  body("email").trim().isEmail(),
  body("password").isLength({ min: 5 }),
];
