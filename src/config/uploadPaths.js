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

// Hakikisha folders zote zipo
[UPLOADS_ROOT, DOCUMENTS_DIR, LETTERS_DIR, MEDIA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ uploadPaths.js: imeunda folder ${dir}`);
  }
});

console.log("📁 uploadPaths.js: DOCUMENTS_DIR =", DOCUMENTS_DIR);
console.log("📁 uploadPaths.js: LETTERS_DIR   =", LETTERS_DIR);
console.log("📁 uploadPaths.js: MEDIA_DIR     =", MEDIA_DIR);

module.exports = { UPLOADS_ROOT, DOCUMENTS_DIR, LETTERS_DIR, MEDIA_DIR };
