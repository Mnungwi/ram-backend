const multer = require("multer");
const path = require("path");
const { LETTERS_DIR } = require("../config/uploadPaths");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, LETTERS_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

module.exports = upload;
