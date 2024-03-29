const bcrypt = require("bcryptjs");
const yup = require("yup");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");
const removeImage = require("../utility/remove-images");

const ITEMS_PER_PAGE = 2;

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
  title: yup
    .string()
    .min(5, "Title must be at least 5 characters.")
    .required("titl is required."),
  content: yup
    .string("content is required.")
    .min(5, "Content must be at least 5 characters.")
    .required(),
  imageUrl: yup.string().url("Not a valid Url."),
});

module.exports = {
  createUser: async function ({ userInput }, req) {
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
    const token = jwt.sign({ email, userId: user._id }, "secret", {
      expiresIn: "1h",
    });
    return { token, userId: user._id.toString() };
  },
  createPost: async function ({ postInput }, { req }) {
    AuthenticationHandler(req);
    const user = req.raw.user;
    //Creating post
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
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

    //Pushing the post to the users list
    await user.posts.push(post);
    //Saving post
    const createdPost = await post.save();
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  getStatus: async function (parent, { req }) {
    AuthenticationHandler(req);
    const user = req.raw.user;
    // return { message: "Fetch status successfully", status: user.status };
    return user.status;
  },
  updateStatus: async function ({ status }, { req }) {
    //authenticaoin
    AuthenticationHandler(req);
    const user = req.raw.user;
    user.status = status;
    const savedUser = await user.save();
    return { ...savedUser._doc, _id: savedUser._id.toString() };
  },
  posts: async function ({ page }, { req }) {
    AuthenticationHandler(req);
    //validating data
    if (!page) page = 1;
    const user = req.raw.user;
    const userId = req.raw.userId;
    //featching posts
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("creator")
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    const totalPosts = await Post.countDocuments();
    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },
  post: async function ({ id }, { req }) {
    //authenticaoin
    AuthenticationHandler(req);
    //fetching post data
    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No post found!");
      error.code = 404;
      throw error;
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  updatePost: async function ({ id, postData }, { req }) {
    //authenticaoin
    AuthenticationHandler(req);
    const user = req.raw.user;
    const userId = req.raw.userId;
    const post = await Post.findById(id).populate("creator");
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
    //Making sure user edit his post
    if (!post) {
      const error = new Error("No past found!");
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== userId.toString()) {
      const error = new Error(
        "Not authorized, This is not your post to edit!!!"
      );
      error.code = 403;
      throw error;
    }
    //updating data
    post.title = postData.title;
    post.content = postData.content;
    if (postData.imageUrl !== "undefined") post.imageUrl = postData.imageUrl;
    const createdPost = await post.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  deletePost: async function ({ id }, { req }) {
    //authenticaoin
    AuthenticationHandler(req);
    const user = req.raw.user;
    const userId = req.raw.userId;
    const post = await Post.findById(id);
    if (!post) {
      const error = new Error("No post found!");
      error.code = 404;
      throw error;
    }
    if (userId.toString() !== post.creator.toString()) {
      const error = new Error(
        "Not authorized, This is not your post to delete!!!"
      );
      error.code = 403;
      throw error;
    }
    const deletedPost = await Post.findByIdAndDelete(id);
    if (deletedPost) {
      removeImage(deletedPost.imageUrl);
      const user = await User.findById(userId);
      user.posts.pull(id);
      await user.save();
      return true;
    } else {
      const error = new Error("Deletion failed some thing whent wrong.");
      error.code = 500;
      throw error;
    }
  },
};

const AuthenticationHandler = (req) => {
  //checking user Authenticatication.
  const isAuth = req.raw.isAuth;
  if (!isAuth) {
    const error = new Error("Not authenticatedd!");
    error.code = 401;
    throw error;
  }
};
