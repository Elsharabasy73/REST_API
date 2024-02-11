const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const tokenHeader = req.get("Authorization");
  if (!tokenHeader) {
    const error = new Error("No access token fetched from frond-end's header");
    error.codeStatus = 401;
    throw error;
  }
  const token = tokenHeader.split(" ")[1];
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
  req.userId = decodedToken.userId;
  next();
};
function throwError(codeStatus, message) {
  const error = new Error(message);
  error.codeStatus = codeStatus;
  throw error;
}
