const path = require("path");
const express = require("express");
const body_parser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const { createHandler } = require("graphql-http/lib/use/express");
const playground = require("graphql-playground-middleware-express").default;

const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");
const auth = require("./middleware/auth");
const removeImage = require("./utility/remove-images");

const MONGODB_URL =
  // "mongodb+srv://abdomake73:xlsgzIvu2CYeOTrg@cluster0.vclsggt.mongodb.net/shop";
  // "mongodb+srv://abdomake73:xlsgzIvu2CYeOTrg@cluster0.vclsggt.mongodb.net/messages?retryWrites=true&w=majority";
  "mongodb://localhost:27017/message";
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

// app.use(body_parser.json());
//to be able to see our images file in our front end code.
//and requist to /images serive it using this route.
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
// app.use(cors());

app.get("/playground", playground({ endpoint: "/graphql" }));

app.use(auth);

app.put("/post-image", (req, res, next) => {
  console.log("+++++++++++++++++++++++++++++");
  if (!req.isAuth) {
    throw new Error("Not authenticated to upload an image.");
  }
  if (!req.file) {
    res.status(200).json({ message: "No file provided." });
  }
  console.log('req.body.oldPath:',req.body.oldPath);
  if (req.body.oldPath) {
    removeImage(req.body.oldPath);
  }
  return res
    .status(201)
    .json({ message: "File stored", filePath: req.file.path });
});

app.use(
  "/graphql",
  createHandler({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true,
    context: (req) => ({ req }),
    formatError(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || "An error occured.";
      const code = err.originalError.code || 500;
      console.log(err);
      return { message: message, status: code, data: data };
    },
  })
);
app.use("/test", (req, res, next) => {
  res.status(200).json({ message: "test work!" });
});

app.use((error, req, res, next) => {
  console.log("app.js", error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message, data: error.data });
});

mongoose
  .connect(MONGODB_URL)
  .then(async (res) => {
    console.log("db connected");
    const server = await app.listen(8080);
    console.log("listinning on port 8080,server:8080");
  })
  .catch((err) => {
    console.log("listingerror" + err);
  });
