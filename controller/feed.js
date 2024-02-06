exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id:'1',
        title: "First Post",
        content: "This is my first post.",
        imageUrl:'images/duck.jpeg',
        creator:{
          name:"ElSharabasy"
        },
        createdAt: new Date(),
      },
    ],
  });
};
exports.createPost = (req, res, next) => {
  const { title, content } = req.body;

  res.status(201).json({
    message: "Post Created successfully",
    post: {
      id:new Date().toISOString(),
      title: title,
      content: content,
    },
  });
};
