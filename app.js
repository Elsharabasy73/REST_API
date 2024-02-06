const express = require("express");
const body_parser = require("body-parser");

const feedRouter = require("./router/feed");

const app = express();

app.use(body_parser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", 'Content-Type, Authorization');
  next();
});

app.use("/feed", feedRouter);

app.listen(8080);
console.log("listenning");
