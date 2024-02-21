const path = require("path");
const fs = require("fs");
module.exports = (filePath) => {
  if (!filePath) {
    throw new Error("failded to Delete the image. currupted path.");
  }
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};
