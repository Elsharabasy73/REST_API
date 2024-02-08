const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res
        .status(200)
        .json({ massage: "Fetched posts successfully.", posts: posts });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};
exports.createPost = (req, res, next) => {
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
    creator: { name: "temp-Elsharabasy" },
  });
  post
    .save()
    .then((resultedPost) => {
      res.status(201).json({
        message: "Post Created successfully",
        post: resultedPost,
      });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};
exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post id not found");
        error.status = 404;
        throw error;
      }
      res.status(200).json({ message: "Post fetched.", post: post });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.editPost = (req, res, next) => {
  const {title, content } = req.body;
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
    console.log('here', postId);
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error(
          "postId not found"
        );
        error.statusCode = 422;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        removeImage(post.imageUrl);
      }

      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((postRes) => {
      res
        .status(200)
        .json({ message: "Post updated successfully", post: postRes });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

const removeImage = (filePath) => {
  filePath = path.join(__dirname + ".." + filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
