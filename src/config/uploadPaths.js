// ══════════════════════════════════════════════════════════════
// config/uploadPaths.js
// Weka faili hii kwenye folder ya config/ (karibu na database.js yako)
//
// Chanzo KIMOJA cha ukweli cha wapi files zinahifadhiwa — middleware na
// controller ZOTE zinatakiwa kuagiza (require) path kutoka hapa, badala ya
// kila moja kukokotoa __dirname yake yenyewe (hilo ndilo lilokuwa
// linasababisha ENOENT — middleware na controller walikuwa wanapata
// __dirname tofauti kidogo kutegemea structure ya folder).
// ══════════════════════════════════════════════════════════════

const path = require("path");
const fs = require("fs");

// process.cwd() = folder unapoendesha "node server.js" kutoka (root ya backend)
// Hii ni ya kuaminika zaidi kuliko __dirname katika miundo mingi ya project.
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const DOCUMENTS_DIR = path.join(UPLOADS_ROOT, "documents");
const LETTERS_DIR = path.join(UPLOADS_ROOT, "letters");
const MEDIA_DIR = path.join(UPLOADS_ROOT, "media");
const AVATARS_DIR = path.join(UPLOADS_ROOT, "avatars");
// Resumes/CVs contain personal data. server.js mounts express.static() on the
// ENTIRE `uploads/` root, so anything under UPLOADS_ROOT is guessable/public —
// resumes therefore live in a SEPARATE, never-statically-mounted directory and
// are only ever served through the authenticated download route in
// routes/inquiries.routes.js.
const PRIVATE_ROOT = path.join(process.cwd(), "private_uploads");
const RESUMES_DIR = path.join(PRIVATE_ROOT, "resumes");

// Hakikisha folders zote zipo
[UPLOADS_ROOT, DOCUMENTS_DIR, LETTERS_DIR, MEDIA_DIR, AVATARS_DIR, PRIVATE_ROOT, RESUMES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ uploadPaths.js: imeunda folder ${dir}`);
  }
});

console.log("📁 uploadPaths.js: DOCUMENTS_DIR =", DOCUMENTS_DIR);
console.log("📁 uploadPaths.js: LETTERS_DIR   =", LETTERS_DIR);
console.log("📁 uploadPaths.js: MEDIA_DIR     =", MEDIA_DIR);
console.log("📁 uploadPaths.js: AVATARS_DIR   =", AVATARS_DIR);
console.log("📁 uploadPaths.js: RESUMES_DIR   =", RESUMES_DIR);

module.exports = { UPLOADS_ROOT, DOCUMENTS_DIR, LETTERS_DIR, MEDIA_DIR, AVATARS_DIR, RESUMES_DIR };
