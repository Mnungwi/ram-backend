const express = require("express");
const router = express.Router();
const lc = require("../controllers/letter.controller");
const upload = require("../middleware/letterUpload");
const { authenticate } = require("../middleware/auth"); // rekebisha jina la middleware kama tofauti

// Jumla (si za project moja)
router.get("/letters", authenticate, lc.listLetters);
router.get("/letters/inbox", authenticate, lc.getInboxLetters);
router.get("/letters/stats", authenticate, lc.getLetterStats);
router.post("/letters", authenticate, upload.any(), lc.createLetter);

// Za project maalum
router.get("/projects/:projectId/letters", authenticate, lc.listLetters);
router.get("/projects/:projectId/letters/inbox", authenticate, lc.getInboxLetters);
router.get("/projects/:projectId/letters/stats", authenticate, lc.getLetterStats);
router.post("/projects/:projectId/letters", authenticate, upload.any(), lc.createLetter);

router.get("/letters/:letterId", authenticate, lc.getLetter);
router.get("/letters/:letterId/preview", lc.previewLetter); // bila authenticate — inatumika kwenye <iframe src>/tab mpya
router.get("/letters/:letterId/pdf", authenticate, lc.downloadLetterPdf);
router.put("/letters/:letterId", authenticate, upload.any(), lc.updateLetter);
router.post("/letters/:letterId/attachment", authenticate, upload.any(), lc.updateAttachment);
router.delete("/letters/:letterId", authenticate, lc.deleteLetter);

router.post("/letters/:letterId/submit", authenticate, lc.submitLetter);
router.post("/letters/:letterId/approve", authenticate, lc.approveLetter);
router.post("/letters/:letterId/send", authenticate, lc.sendLetter);
router.post("/letters/:letterId/archive", authenticate, lc.archiveLetter);
router.get("/letters/:letterId/attachment/file", lc.downloadAttachment);

module.exports = router;

// ══════════════════════════════════════════════════════════════
// USICHOSAHAU
// ══════════════════════════════════════════════════════════════
// 1. npm install nodemailer multer (multer huenda tayari unayo)
// 2. Ongeza SMTP env vars kwenye .env (angalia utils/mailer.js kwa maelezo kamili)
// 3. Kwenye routes index yako kuu, ongeza: router.use("/", require("./letter.routes"));
//    (BADALA ya router ya zamani ya letters.routes.js kama tayari unayo — au unganisha)
// 4. Sync/migrate database — table mpya: official_letters
// 5. Ongeza uploads/letters/ kwenye .gitignore
