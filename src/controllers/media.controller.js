const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const { Media, ProjectGallery } = require("../models");
const { successResponse, errorResponse, getPagination, paginatedResponse } = require("../utils/response");
const { Op } = require("sequelize");
const { MEDIA_DIR } = require("../config/uploadPaths");

function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
}

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, "No file uploaded", 400);
    }

    const filePath = req.file.path;
    const fileHash = await getFileHash(filePath);

    // Check if exact same file hash exists
    const existing = await Media.findOne({ where: { hash: fileHash } });
    if (existing) {
      // Delete newly uploaded file from disk (since it's a duplicate)
      fs.unlink(filePath, () => {});
      return successResponse(res, { media: existing, isDuplicate: true }, "Media already exists in library (reused)", 200);
    }

    // Save to DB
    const media = await Media.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      hash: fileHash,
      title: req.body.title || path.parse(req.file.originalname).name,
      altText: req.body.altText || "",
      createdById: req.userId || null,
    });

    return successResponse(res, { media, isDuplicate: false }, "File uploaded successfully", 201);
  } catch (err) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
};

exports.listMedia = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { originalName: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Media.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

exports.updateMediaDetails = async (req, res, next) => {
  try {
    const media = await Media.findByPk(req.params.mediaId);
    if (!media) return errorResponse(res, "Media not found", 404);

    const { title, altText } = req.body;
    await media.update({ title, altText });

    return successResponse(res, { media }, "Media details updated");
  } catch (err) {
    next(err);
  }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findByPk(req.params.mediaId);
    if (!media) return errorResponse(res, "Media not found", 404);

    // Prevent deletion if media is currently referenced by any project gallery items
    const usageCount = await ProjectGallery.count({ where: { mediaId: media.id } });
    if (usageCount > 0) {
      return errorResponse(res, `Cannot delete media. It is currently linked to ${usageCount} project gallery items.`, 400);
    }

    // Delete file from storage disk
    const filePath = path.join(MEDIA_DIR, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }

    await media.destroy();
    return successResponse(res, null, "Media deleted from library");
  } catch (err) {
    next(err);
  }
};
