const express = require("express");
const body_parser = require("body-parser");
const mongoose = require("mongoose");

const feedRouter = require("./router/feed");

const MONGODB_URL =
  // "mongodb+srv://abdomake73:xlsgzIvu2CYeOTrg@cluster0.vclsggt.mongodb.net/shop";
  "mongodb+srv://abdomake73:xlsgzIvu2CYeOTrg@cluster0.vclsggt.mongodb.net/messages?retryWrites=true&w=majority";
// "mongodb://localhost:27017/";

const app = express();

app.use(body_parser.json());

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

mongoose
  .connect(MONGODB_URL)
  .then((res) => {
    console.log("db connected");
    app.listen(8080);
    console.log("listinning on port 8080");
  })
  .catch();
