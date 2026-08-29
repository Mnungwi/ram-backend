const express = require("express");
const router = express.Router();
const { sequelize } = require("../config/database");
const { authenticate } = require("../middleware/auth");
const { successResponse, errorResponse } = require("../utils/response");
const { v4: uuidv4 } = require("uuid");
const { translateToSw, TRANSLATABLE_JSON_ARRAY_SETTINGS, translateJsonArrayFields } = require("../utils/translate");
const { TRANSLATABLE_SETTING_KEYS } = require("../config/translatableSettings");

// Enforce authentication on all website management endpoints
router.use(authenticate);

// ── GALLERY MANAGEMENT ─────────────────────────────────────

// GET all gallery items
router.get("/gallery", async (req, res, next) => {
  try {
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
    const [gallery] = await sequelize.query(`
      SELECT CONCAT('${publicBaseUrl}/uploads/media/', m.filename) AS imageUrl,
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
    const { title, icon, description, overviewText, benefits, title_sw, description_sw, overviewText_sw } = req.body;
    const id = uuidv4();
    const benefitsJson = JSON.stringify((benefits || '').split('\n').map(s => s.trim()).filter(Boolean));
    const [titleSw, descriptionSw, overviewSw] = await Promise.all([
      title_sw || (await translateToSw(title)),
      description_sw || (await translateToSw(description)),
      overviewText_sw || (await translateToSw(overviewText)),
    ]);
    await sequelize.query(`
      INSERT INTO website_services (id, title, icon, description, overviewText, benefitsJson, title_sw, description_sw, overviewText_sw, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, { replacements: [id, title, icon || 'bi-building', description || '', overviewText || '', benefitsJson, titleSw, descriptionSw, overviewSw] });
    return successResponse(res, { id }, "Service created successfully", 201);
  } catch (err) {
    next(err);
  }
});

router.put("/services/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, icon, description, overviewText, benefits, title_sw, description_sw, overviewText_sw } = req.body;
    const benefitsJson = JSON.stringify((benefits || '').split('\n').map(s => s.trim()).filter(Boolean));
    const [titleSw, descriptionSw, overviewSw] = await Promise.all([
      title_sw || (await translateToSw(title)),
      description_sw || (await translateToSw(description)),
      overviewText_sw || (await translateToSw(overviewText)),
    ]);
    await sequelize.query(`
      UPDATE website_services
      SET title = ?, icon = ?, description = ?, overviewText = ?, benefitsJson = ?,
          title_sw = ?, description_sw = ?, overviewText_sw = ?, updatedAt = NOW()
      WHERE id = ?
    `, { replacements: [title, icon || 'bi-building', description || '', overviewText || '', benefitsJson, titleSw, descriptionSw, overviewSw, id] });
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
    const { title, category, summary, content, image, title_sw, summary_sw, content_sw } = req.body;
    const id = uuidv4();
    const titleSw = title_sw || (await translateToSw(title));
    const summarySw = summary_sw || (await translateToSw(summary));
    const contentSw = content_sw || (await translateToSw(content));
    await sequelize.query(`
      INSERT INTO website_news (id, title, category, summary, content, image, title_sw, summary_sw, content_sw, date, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    `, { replacements: [id, title, category || 'General', summary || '', content || '', image || '', titleSw, summarySw, contentSw] });
    return successResponse(res, { id }, "News article created successfully", 201);
  } catch (err) {
    next(err);
  }
});

router.put("/news/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, summary, content, image, title_sw, summary_sw, content_sw } = req.body;
    const titleSw = title_sw || (await translateToSw(title));
    const summarySw = summary_sw || (await translateToSw(summary));
    const contentSw = content_sw || (await translateToSw(content));
    await sequelize.query(`
      UPDATE website_news
      SET title = ?, category = ?, summary = ?, content = ?, image = ?,
          title_sw = ?, summary_sw = ?, content_sw = ?, updatedAt = NOW()
      WHERE id = ?
    `, { replacements: [title, category || 'General', summary || '', content || '', image || '', titleSw, summarySw, contentSw, id] });
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
    const { question, answer, displayOrder, question_sw, answer_sw } = req.body;
    const id = uuidv4();
    const questionSw = question_sw || (await translateToSw(question));
    const answerSw = answer_sw || (await translateToSw(answer));
    await sequelize.query(`
      INSERT INTO website_faqs (id, question, answer, displayOrder, question_sw, answer_sw, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, { replacements: [id, question, answer, displayOrder || 0, questionSw, answerSw] });
    return successResponse(res, { id }, "FAQ created successfully", 201);
  } catch (err) {
    next(err);
  }
});

router.put("/faqs/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, displayOrder, question_sw, answer_sw } = req.body;
    const questionSw = question_sw || (await translateToSw(question));
    const answerSw = answer_sw || (await translateToSw(answer));
    await sequelize.query(`
      UPDATE website_faqs
      SET question = ?, answer = ?, displayOrder = ?, question_sw = ?, answer_sw = ?, updatedAt = NOW()
      WHERE id = ?
    `, { replacements: [question, answer, displayOrder || 0, questionSw, answerSw, id] });
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
    const upsert = async (key, val) => {
      await sequelize.query(`
        INSERT INTO website_settings (\`key\`, \`value\`, createdAt, updatedAt)
        VALUES (?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE \`value\` = ?, updatedAt = NOW()
      `, { replacements: [key, val, val] });
    };

    for (const [key, val] of Object.entries(body)) {
      // JSON-array settings (hero slider, showcase accordion) — translate
      // each item's prose fields in place and store the enriched array back
      // under the same key, instead of a "<key>_sw" sibling.
      if (TRANSLATABLE_JSON_ARRAY_SETTINGS[key]) {
        const enriched = await translateJsonArrayFields(val, TRANSLATABLE_JSON_ARRAY_SETTINGS[key]);
        await upsert(key, enriched || val);
        continue;
      }

      await upsert(key, val);

      // Auto-translate known prose keys into "<key>_sw" — unless the admin
      // already sent an explicit "<key>_sw" value in this same save (never
      // overwrite a manual translation), and skip anything not on the
      // allowlist (JSON blobs, image paths, emails, phones, URLs).
      const swKey = `${key}_sw`;
      if (TRANSLATABLE_SETTING_KEYS.has(key) && !(swKey in body)) {
        const translated = await translateToSw(val);
        if (translated) await upsert(swKey, translated);
      }
    }
    return successResponse(res, null, "Settings updated successfully");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
