const path = require("path");
const express = require("express");
const body_parser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");

const feedRouter = require("./router/feed");
const authRouter = require("./router/auth");

const MONGODB_URL =
  // "mongodb+srv://abdomake73:xlsgzIvu2CYeOTrg@cluster0.vclsggt.mongodb.net/shop";
  "mongodb+srv://abdomake73:xlsgzIvu2CYeOTrg@cluster0.vclsggt.mongodb.net/messages?retryWrites=true&w=majority";
// "mongodb://localhost:27017/";
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const app = express();
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use(body_parser.json());
//to be able to see our images file in our front end code.
//and requist to /images serive it using this route.
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRouter);
app.use("/auth", authRouter);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message, data: error.data });
});

mongoose
  .connect(MONGODB_URL)
  .then((res) => {
    console.log("db connected");
    app.listen(8080);
    console.log("listinning on port 8080");
  })
  .catch();
