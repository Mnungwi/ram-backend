const express = require("express");
const router = express.Router();
const mc = require("../controllers/media.controller");
const upload = require("../middleware/mediaUpload");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, mc.listMedia);
router.post("/", authenticate, upload.single("file"), mc.uploadMedia);
router.patch("/:mediaId", authenticate, mc.updateMediaDetails);
router.delete("/:mediaId", authenticate, mc.deleteMedia);

module.exports = router;
