const express = require("express");
const router = express.Router();
const gc = require("../controllers/gallery.controller");
const { authenticate } = require("../middleware/auth");

router.get("/projects/:projectId/gallery", authenticate, gc.listGalleryItems);
router.post("/projects/:projectId/gallery", authenticate, gc.addGalleryItem);
router.put("/projects/:projectId/gallery/:galleryId", authenticate, gc.updateGalleryItem);
router.delete("/projects/:projectId/gallery/:galleryId", authenticate, gc.removeGalleryItem);
router.post("/projects/:projectId/gallery/reorder", authenticate, gc.reorderGallery);

module.exports = router;
