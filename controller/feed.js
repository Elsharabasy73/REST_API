const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

const Post = require("../models/post");
const User = require("../models/user");
const io = require("../socket");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    let totalItems = await Post.countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      massage: "Fetched posts successfully.",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const { title, content } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    const error = new Error("Validation failed, entered data is incorrect.");
    error.status = 400;
    throw error;
  }

  //image fetch and validation
  if (!req.file) {
    const error = new Error("No jmage provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  try {
    const resultedPost = await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    const userResult = await user.save();
    io.getIO().emit("posts", {action:"create", post:post});
    res.status(201).json({
      message: "Post Created successfully",
      post: post,
      creator: { id: user._id, name: user.name },
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Post id not found");
      error.status = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched.", post: post });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.editPost = async (req, res, next) => {
  const { title, content } = req.body;
  // if no new file were add image path will be sent for ex /image/name.jpg
  const imageUrl = req.body.image;
  const postId = req.params.postId;
  //new image were added
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error(
      "no file were attached nor there is an old image path."
    );
    error.statusCode = 422;
    throw error;
  }
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("postId not found");
      error.statusCode = 422;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      removeImage(post.imageUrl);
    }

    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const postRes = await post.save();
    res
      .status(200)
      .json({ message: "Post updated successfully", post: postRes });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 422;
      throw error;
    }
    removeImage(post.imageUrl);
    const result = await Post.findByIdAndDelete(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    const savedUser = await user.save();
    res.status(200).json({ message: "Post deleted successfully." });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) throwError(500, "User not found in the DB.");
    res
      .status(200)
      .json({ message: "Fetch status successfully", status: user.status });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  const status = req.body.status;
  try {
    const user = await User.findById(req.userId);
    if (!user) throwError(500, "User not found in the DB.");
    user.status = status;
    const result = await user.save();
    res.status(200).json({
      message: "User's status was updated successfully",
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

const removeImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

function throwError(codeStatus, message) {
  const error = new Error(message);
  error.codeStatus = codeStatus;
  throw error;
}
