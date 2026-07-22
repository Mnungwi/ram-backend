const { ProjectGallery, Media } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");

exports.listGalleryItems = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const items = await ProjectGallery.findAll({
      where: { projectId },
      include: [
        {
          model: Media,
          as: "media",
          attributes: ["id", "filename", "originalName", "mimeType", "size", "title", "altText", "createdAt"],
        },
      ],
      order: [
        ["displayOrder", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    return successResponse(res, { items });
  } catch (err) {
    next(err);
  }
};

exports.addGalleryItem = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { mediaId, caption } = req.body;

    if (!mediaId) return errorResponse(res, "mediaId is required", 400);

    // Verify media exists
    const media = await Media.findByPk(mediaId);
    if (!media) return errorResponse(res, "Media item not found in library", 404);

    // Verify if already linked
    const existing = await ProjectGallery.findOne({ where: { projectId, mediaId } });
    if (existing) {
      return errorResponse(res, "This media item is already added to the project gallery", 400);
    }

    // Determine default order (max + 1)
    const maxItem = await ProjectGallery.findOne({
      where: { projectId },
      order: [["displayOrder", "DESC"]],
    });
    const displayOrder = maxItem ? maxItem.displayOrder + 1 : 0;

    const item = await ProjectGallery.create({
      projectId,
      mediaId,
      displayOrder,
      caption: caption || "",
    });

    const fullItem = await ProjectGallery.findByPk(item.id, {
      include: [{ model: Media, as: "media" }],
    });

    return successResponse(res, { item: fullItem }, "Media added to project gallery", 201);
  } catch (err) {
    next(err);
  }
};

exports.updateGalleryItem = async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    const { caption, displayOrder } = req.body;

    const item = await ProjectGallery.findByPk(galleryId);
    if (!item) return errorResponse(res, "Gallery item not found", 404);

    const updates = {};
    if (caption !== undefined) updates.caption = caption;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;

    await item.update(updates);

    const fullItem = await ProjectGallery.findByPk(item.id, {
      include: [{ model: Media, as: "media" }],
    });

    return successResponse(res, { item: fullItem }, "Gallery item updated");
  } catch (err) {
    next(err);
  }
};

exports.removeGalleryItem = async (req, res, next) => {
  try {
    const { galleryId } = req.params;

    const item = await ProjectGallery.findByPk(galleryId);
    if (!item) return errorResponse(res, "Gallery item not found", 404);

    await item.destroy();
    return successResponse(res, null, "Item removed from project gallery");
  } catch (err) {
    next(err);
  }
};

exports.reorderGallery = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { items } = req.body; // Expects array of: { id: UUID, displayOrder: number }

    if (!Array.isArray(items)) {
      return errorResponse(res, "Items must be an array of { id, displayOrder }", 400);
    }

    for (const entry of items) {
      await ProjectGallery.update(
        { displayOrder: entry.displayOrder },
        { where: { id: entry.id, projectId } }
      );
    }

    return successResponse(res, null, "Gallery reordered successfully");
  } catch (err) {
    next(err);
  }
};
