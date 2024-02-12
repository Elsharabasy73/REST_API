const jwt = require("jsonwebtoken");
const User = require("../models/user");
module.exports = (req, res, next) => {
  //get token from header
  const tokenHeader = req.get("Authorization");
  if (!tokenHeader) {
    const error = new Error("No access token fetched from frond-end's header");
    error.codeStatus = 401;
    throw error;
  }
  const token = tokenHeader.split(" ")[1];
  //decode the token
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "secret");
  } catch (err) {
    err.codeStatus = 500;
    throw err;
  }
  if (!decodedToken) {
    throwError(401, "Token can't be decoded.");
  }
  //validate the userId extracted fro the token
  const userId = decodedToken.userId;
  const email = decodedToken.email;
  User.find({ _id: req.userId, email: req.email })
    .then((user) => {
      if (!user)
        throwError(401, "The authintication token you provide is not valid!");
      req.userId = userId;
      req.email = email;
      next();
    })
    .catch((err) => {
      if (!err.codeStatus) {
        err.codeStatus = 500;
      }
      next(err);
    });
};
function throwError(codeStatus, message) {
  const error = new Error(message);
  error.codeStatus = codeStatus;
  throw error;
}
