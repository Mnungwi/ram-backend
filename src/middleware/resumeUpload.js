// ══════════════════════════════════════════════════════════════
// middleware/resumeUpload.js
// PDF-only CV/resume upload for the public "Careers — Apply" form.
// Files are stored in RESUMES_DIR (private_uploads/resumes), which is never
// mounted by express.static — see config/uploadPaths.js.
// ══════════════════════════════════════════════════════════════

const multer = require("multer");
const path = require("path");
const { RESUMES_DIR } = require("../config/uploadPaths");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, RESUMES_DIR);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error(`Only PDF resumes are allowed (got ${file.mimetype})`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
