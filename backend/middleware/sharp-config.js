const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

module.exports = (req, res, next) => {
  if (!req.file) return next();

  const { filename } = req.file;
  const tempFilePath = path.join(__dirname, "../images/temp_" + filename);
  const outputPath = path.join(__dirname, "../images", filename);

  sharp(req.file.path)
    .resize(800)
    .toFormat("jpeg")
    .jpeg({ quality: 80 })
    .toFile(tempFilePath)
    .then(() => {
      console.log(`Image processed to temporary path: ${tempFilePath}`);
      fs.renameSync(tempFilePath, outputPath);
      console.log(`Image renamed to: ${outputPath}`);
      fs.unlinkSync(req.file.path);
      console.log(`Original image file deleted: ${req.file.path}`);
      next();
    })
    .catch((err) => {
      console.error("Error processing image:", err);
      res.status(400).json({ error: err.message });
    });
};
