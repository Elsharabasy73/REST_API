const express = require("express");

const feedRouter = require("./router/feed");

const app = express();

app.use(feedRouter);

app.listen(8080);
