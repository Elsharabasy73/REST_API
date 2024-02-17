const bcrypt = require("bcryptjs");
const validator = require("validator");
const yup = require("yup");

const User = require("../models/user");

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

module.exports = {
  createUser: async function ({ userInput }, req) {
    //Data Validation
    const errorsList = [];
    try {
      await schema.validate(
        { email: userInput.email, password: userInput.password },
        { abortEarly: false }
      );
    } catch (errors) {
      errors.inner.forEach((error) => {
        errorsList.push({ path: error.path, message: error.message });
      });
    }

    if (errorsList.length > 0) {
      const error = new Error("Invalid input1.");
      error.data = errorsList;
      error.code = 422;
      throw error;
    }
    //Checking if user already exist.
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      throw new Error("User already exists");
    }
    
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  hello() {
    return { text: "Hello, World", views: 123 };
  },
};

// module.exports = {
//   createUser: async function ({ userInput }, req) {
//     //   const email = args.userInput.email;
//     const errors = [];
//     const existingUser = await User.findOne({ email: userInput.email });
//     if (existingUser) {
//       const error = new Error("User already exist");
//       throw error;
//     }
//     if (!validator.isEmail(userInput.email)) {
//       errors.push({ message: "Envalid email!" });
//     }
//     if (
//       validator.isEmpty(userInput.password) ||
//       !validator.isLength(userInput.password, { min: 5 })
//     ) {
//       errors.push({ message: "Password too short!" });
//     }
//     console.log(errors);
//     if (errors.length > 0) {
//       const error = new Error("Invalid input1.");
//       error.data = errors;
//       error.code = 422;
//       throw error;
//     }
//     const hashedPw = await bcrypt.hash(userInput.password, 12);
//     const user = new User({
//       email: userInput.email,
//       name: userInput.name,
//       password: hashedPw,
//     });
//     const createdUser = await user.save();
//     return { ...createdUser._doc, _id: createdUser._id.toString() };
//   },
//   hello() {
//     return { text: "Hello, World", views: 123 };
//   },
// };
