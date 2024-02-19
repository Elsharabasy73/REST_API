const bcrypt = require("bcryptjs");
const yup = require("yup");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");

const usrSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const postSchema = yup.object().shape({
  title: yup.string().min(5, "Title must be at least 5 characters.").required('titl is required.'),
  content: yup
    .string('content is required.')
    .min(5, "Content must be at least 5 characters.")
    .required(),
  imageUrl: yup.string().url("Not a valid Url."),
});

module.exports = {
  createUser: async function ({ userInput }, req) {
    console.log(userInput);
    //Data Validation
    const errorsList = [];
    try {
      await usrSchema.validate(
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

  async login({ email, password }, req) {
    const errorsList = [];
    //Data validation
    try {
      await usrSchema.validate({ email, password }, { abortEarly: false });
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
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User dosen't exist!");
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("User and Password don't match");
      error.code = 401;
      throw error;
    }
    //Token generation.
    const token = jwt.sign({ email, password }, "secretKey", {
      expiresIn: "1h",
    });
    return { token, userId: user._id.toString() };
  },
  createPost: async function ({ postInput }, req) {
    //Creating post
    console.log(postInput);
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
    });
    //validation
    const errorsList = [];
    try {
      await postSchema.validate({ ...post });
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
    //Saving post
    const createdPost = await post.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
};
