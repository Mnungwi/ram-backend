const express = require('express');
const letterCtrl = require('../controllers/letterController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/letters/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const router = express.Router();
router.use(authenticate);

router.get(  '/',                   authorize(P.PROJECT_VIEW),   letterCtrl.listLetters);
router.get(  '/my',                 authorize(P.PROJECT_VIEW),   letterCtrl.getMyLetters);
router.get(  '/stats',              authorize(P.PROJECT_VIEW),   letterCtrl.getLetterStats);
router.post( '/',                   authorize(P.PROJECT_CREATE), upload.single('file'), letterCtrl.createLetter);
router.get(  '/:letterId',          authorize(P.PROJECT_VIEW),   letterCtrl.getLetter);
router.put(  '/:letterId',          authorize(P.PROJECT_UPDATE), letterCtrl.updateLetter);
router.delete('/:letterId',         authorize(P.PROJECT_DELETE), letterCtrl.deleteLetter);
router.post( '/:letterId/submit',   authorize(P.PROJECT_CREATE), letterCtrl.submitLetter);
router.post( '/:letterId/approve',  authorize(P.PROJECT_UPDATE), letterCtrl.approveLetter);
router.post( '/:letterId/send',     authorize(P.PROJECT_UPDATE), letterCtrl.sendLetter);
router.post( '/:letterId/archive',  authorize(P.PROJECT_UPDATE), letterCtrl.archiveLetter);
router.get(  '/:letterId/preview',  authorize(P.PROJECT_VIEW),   letterCtrl.previewLetter);
router.get(  '/:letterId/download', authorize(P.PROJECT_VIEW),   letterCtrl.downloadLetterPDF);

module.exports = router;
