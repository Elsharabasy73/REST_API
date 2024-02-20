const jwt = require("jsonwebtoken");
const User = require("../models/user");
module.exports = async (req, res, next) => {
  //get token from header
  const tokenHeader = req.get("Authorization");
  if (!tokenHeader) {
    req.isAuth = false;
    return next();
  }
  const token = tokenHeader.split(" ")[1];
  //decode the token
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "secret");
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  //validate the userId extracted fro the token
  const userId = decodedToken.userId;
  const email = decodedToken.email;
  let user;
  try {
    user = await User.findOne({ _id: userId, email: email });
    if (!user) {
      req.isAuth = false;
      return next();
    }
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  req.userId = userId;
  req.user = user;
  req.isAuth = true;
  console.log("1req.user:", req.user);

  next();
};
function throwError(codeStatus, message) {
  const error = new Error(message);
  error.codeStatus = codeStatus;
  throw error;
}
