const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

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
  bcrypt
    .hash(password, 12)
    .then((hashedPass) => {
      const user = new User({
        name: name,
        email: email,
        password: hashedPass,
      });
      return user.save();
    })
    .then((savedUser) => {
      res.json({ message: "Signup Successfully!", userId: savedUser._id });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("User don't exist.");
        error.statusCode = 401;
        throw error;
      }
      return bcrypt.compare(password, user.password);
    }).then(isEqual=>{
      if (!isEqual){
        const error = new Error("Wrong password");
        error.statusCode = 401;
        throw error;
      }
      //generating JSON web token.
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};
