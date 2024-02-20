const path = require("path");
const fs = require("fs");
module.exports = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};
