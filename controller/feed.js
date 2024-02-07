const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: "1",
        title: "First Post",
        content: "This is my first post.",
        imageUrl: "images/duck.jpeg",
        creator: {
          name: "ElSharabasy",
        },
        createdAt: new Date(),
      },
    ],
  });
};
exports.createPost = (req, res, next) => {
  const { title, content } = req.body;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: "/images/duck.jpeg",
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
    .catch((err) => console.log(err));
};
