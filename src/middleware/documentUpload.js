// ══════════════════════════════════════════════════════════════
// middleware/documentUpload.js
// Weka faili hii kwenye folder ya middleware/
// ══════════════════════════════════════════════════════════════

const multer = require("multer");
const path = require("path");
const { DOCUMENTS_DIR } = require("../config/uploadPaths");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCUMENTS_DIR);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/dwg",
  "image/vnd.dwg",
  "application/octet-stream", // baadhi ya .dwg files zinakuja na mime hii
  "application/zip",
  "application/x-zip-compressed",
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

module.exports = upload;
