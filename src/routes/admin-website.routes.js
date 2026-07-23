const express = require("express");
const router = express.Router();
const { sequelize } = require("../config/database");
const { authenticate } = require("../middleware/auth");
const { successResponse, errorResponse } = require("../utils/response");
const { v4: uuidv4 } = require("uuid");

// Enforce authentication on all website management endpoints
router.use(authenticate);

// ── GALLERY MANAGEMENT ─────────────────────────────────────

// GET all gallery items
router.get("/gallery", async (req, res, next) => {
  try {
    const [gallery] = await sequelize.query(`
      SELECT CONCAT('http://localhost:3000/uploads/media/', m.filename) AS imageUrl, 
             g.caption, g.type, g.visibility, g.displayOrder, g.id, p.name AS projectName
      FROM project_gallery g
      JOIN media_library m ON g.mediaId = m.id
      JOIN projects p ON g.projectId = p.id
      ORDER BY g.displayOrder ASC, g.createdAt DESC
    `);
    return successResponse(res, gallery, "Gallery retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// POST is not needed as media is uploaded via Projects > Gallery tab.
// But we keep it as a fallback dummy endpoint that logs it.
router.post("/gallery", async (req, res, next) => {
  return errorResponse(res, "Please add gallery items inside the project detail's Gallery tab.", 400);
});

// PUT update gallery item
router.put("/gallery/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { caption, type, visibility, displayOrder } = req.body;

    const [exists] = await sequelize.query(`SELECT id FROM project_gallery WHERE id = ?`, { replacements: [id] });
    if (!exists || exists.length === 0) return errorResponse(res, "Gallery item not found", 404);

    await sequelize.query(`
      UPDATE project_gallery 
      SET caption = ?, type = ?, visibility = ?, displayOrder = ?, updatedAt = NOW()
      WHERE id = ?
    `, {
      replacements: [caption || '', type || 'photo', visibility || 'public', displayOrder || 0, id]
    });

    return successResponse(res, null, "Gallery item updated successfully");
  } catch (err) {
    next(err);
  }
});

// DELETE gallery item
router.delete("/gallery/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [exists] = await sequelize.query(`SELECT id FROM project_gallery WHERE id = ?`, { replacements: [id] });
    if (!exists || exists.length === 0) return errorResponse(res, "Gallery item not found", 404);

    await sequelize.query(`DELETE FROM project_gallery WHERE id = ?`, { replacements: [id] });
    return successResponse(res, null, "Gallery item deleted successfully");
  } catch (err) {
    next(err);
  }
});

// ── SEO MANAGEMENT ─────────────────────────────────────────

// GET all SEO settings
router.get("/seo", async (req, res, next) => {
  try {
    const [seo] = await sequelize.query(`
      SELECT * FROM seo_settings 
      ORDER BY pageKey ASC
    `);
    return successResponse(res, seo, "SEO settings retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// PUT update SEO setting
router.put("/seo/:pageKey", async (req, res, next) => {
  try {
    const { pageKey } = req.params;
    const { title, description, keywords } = req.body;

    const [exists] = await sequelize.query(`SELECT id FROM seo_settings WHERE pageKey = ?`, { replacements: [pageKey] });
    if (!exists || exists.length === 0) return errorResponse(res, "SEO setting not found", 404);

    await sequelize.query(`
      UPDATE seo_settings 
      SET title = ?, description = ?, keywords = ?, updatedAt = NOW()
      WHERE pageKey = ?
    `, {
      replacements: [title, description || '', keywords || '', pageKey]
    });

    return successResponse(res, null, "SEO settings updated successfully");
  } catch (err) {
    next(err);
  }
});

// ── SERVICES MANAGEMENT ────────────────────────────────────

router.get("/services", async (req, res, next) => {
  try {
    const [services] = await sequelize.query("SELECT * FROM website_services ORDER BY title ASC");
    return successResponse(res, services, "Services retrieved successfully");
  } catch (err) {
    next(err);
  }
});

router.post("/services", async (req, res, next) => {
  try {
    const { title, icon, description } = req.body;
    const id = uuidv4();
    await sequelize.query(`
      INSERT INTO website_services (id, title, icon, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, { replacements: [id, title, icon || 'bi-building', description || ''] });
    return successResponse(res, { id }, "Service created successfully", 201);
  } catch (err) {
    next(err);
  }
});

router.put("/services/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, icon, description } = req.body;
    await sequelize.query(`
      UPDATE website_services 
      SET title = ?, icon = ?, description = ?, updatedAt = NOW()
      WHERE id = ?
    `, { replacements: [title, icon || 'bi-building', description || '', id] });
    return successResponse(res, null, "Service updated successfully");
  } catch (err) {
    next(err);
  }
});

router.delete("/services/:id", async (req, res, next) => {
  try {
    await sequelize.query("DELETE FROM website_services WHERE id = ?", { replacements: [req.params.id] });
    return successResponse(res, null, "Service deleted successfully");
  } catch (err) {
    next(err);
  }
});

// ── NEWS MANAGEMENT ────────────────────────────────────────

router.get("/news", async (req, res, next) => {
  try {
    const [news] = await sequelize.query("SELECT * FROM website_news ORDER BY date DESC");
    return successResponse(res, news, "News articles retrieved successfully");
  } catch (err) {
    next(err);
  }
});

router.post("/news", async (req, res, next) => {
  try {
    const { title, category, summary, content, image } = req.body;
    const id = uuidv4();
    await sequelize.query(`
      INSERT INTO website_news (id, title, category, summary, content, image, date, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    `, { replacements: [id, title, category || 'General', summary || '', content || '', image || '', ] });
    return successResponse(res, { id }, "News article created successfully", 201);
  } catch (err) {
    next(err);
  }
});

router.put("/news/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, summary, content, image } = req.body;
    await sequelize.query(`
      UPDATE website_news 
      SET title = ?, category = ?, summary = ?, content = ?, image = ?, updatedAt = NOW()
      WHERE id = ?
    `, { replacements: [title, category || 'General', summary || '', content || '', image || '', id] });
    return successResponse(res, null, "News article updated successfully");
  } catch (err) {
    next(err);
  }
});

router.delete("/news/:id", async (req, res, next) => {
  try {
    await sequelize.query("DELETE FROM website_news WHERE id = ?", { replacements: [req.params.id] });
    return successResponse(res, null, "News article deleted successfully");
  } catch (err) {
    next(err);
  }
});

// ── CAREERS MANAGEMENT ─────────────────────────────────────

router.get("/careers", async (req, res, next) => {
  try {
    const [jobs] = await sequelize.query("SELECT * FROM website_careers ORDER BY title ASC");
    return successResponse(res, jobs, "Jobs retrieved successfully");
  } catch (err) {
    next(err);
  }
});

router.post("/careers", async (req, res, next) => {
  try {
    const { title, department, location, type, description, status } = req.body;
    const id = uuidv4();
    await sequelize.query(`
      INSERT INTO website_careers (id, title, department, location, type, description, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, { replacements: [id, title, department, location, type || 'Full-time', description || '', status || 'active'] });
    return successResponse(res, { id }, "Job created successfully", 201);
  } catch (err) {
    next(err);
  }
});

router.put("/careers/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, department, location, type, description, status } = req.body;
    await sequelize.query(`
      UPDATE website_careers 
      SET title = ?, department = ?, location = ?, type = ?, description = ?, status = ?, updatedAt = NOW()
      WHERE id = ?
    `, { replacements: [title, department, location, type || 'Full-time', description || '', status || 'active', id] });
    return successResponse(res, null, "Job updated successfully");
  } catch (err) {
    next(err);
  }
});

router.delete("/careers/:id", async (req, res, next) => {
  try {
    await sequelize.query("DELETE FROM website_careers WHERE id = ?", { replacements: [req.params.id] });
    return successResponse(res, null, "Job deleted successfully");
  } catch (err) {
    next(err);
  }
});

// ── FAQs MANAGEMENT ────────────────────────────────────────

router.get("/faqs", async (req, res, next) => {
  try {
    const [faqs] = await sequelize.query("SELECT * FROM website_faqs ORDER BY displayOrder ASC");
    return successResponse(res, faqs, "FAQs retrieved successfully");
  } catch (err) {
    next(err);
  }
});

router.post("/faqs", async (req, res, next) => {
  try {
    const { question, answer, displayOrder } = req.body;
    const id = uuidv4();
    await sequelize.query(`
      INSERT INTO website_faqs (id, question, answer, displayOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, { replacements: [id, question, answer, displayOrder || 0] });
    return successResponse(res, { id }, "FAQ created successfully", 201);
  } catch (err) {
    next(err);
  }
});

router.put("/faqs/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, displayOrder } = req.body;
    await sequelize.query(`
      UPDATE website_faqs 
      SET question = ?, answer = ?, displayOrder = ?, updatedAt = NOW()
      WHERE id = ?
    `, { replacements: [question, answer, displayOrder || 0, id] });
    return successResponse(res, null, "FAQ updated successfully");
  } catch (err) {
    next(err);
  }
});

router.delete("/faqs/:id", async (req, res, next) => {
  try {
    await sequelize.query("DELETE FROM website_faqs WHERE id = ?", { replacements: [req.params.id] });
    return successResponse(res, null, "FAQ deleted successfully");
  } catch (err) {
    next(err);
  }
});

// ── SETTINGS MANAGEMENT (General Content Settings) ─────────

router.get("/settings", async (req, res, next) => {
  try {
    const [settings] = await sequelize.query("SELECT `key`, `value` FROM website_settings");
    const dict = {};
    for (const row of settings) {
      dict[row.key] = row.value;
    }
    return successResponse(res, dict, "Settings retrieved successfully");
  } catch (err) {
    next(err);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    const body = req.body; // Expect key-value pairs
    for (const [key, val] of Object.entries(body)) {
      // Upsert key-value
      await sequelize.query(`
        INSERT INTO website_settings (\`key\`, \`value\`, createdAt, updatedAt)
        VALUES (?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE \`value\` = ?, updatedAt = NOW()
      `, { replacements: [key, val, val] });
    }
    return successResponse(res, null, "Settings updated successfully");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
