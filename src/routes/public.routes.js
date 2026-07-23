const express = require("express");
const router = express.Router();
const { Project, Media, ProjectGallery } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/response");

// GET /api/public/projects
router.get("/projects", async (req, res, next) => {
  try {
    const { status, type, showOnHomePage } = req.query;
    const where = { visibility: "public" };
    
    if (status) where.status = status;
    if (showOnHomePage === "true") where.showOnHomePage = true;

    const projects = await Project.findAll({
      where,
      order: [["displayOrder", "ASC"], ["createdAt", "DESC"]]
    });
    
    return successResponse(res, projects, "Public projects retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/projects/:projectId
router.get("/projects/:projectId", async (req, res, next) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.projectId, visibility: "public" }
    });
    
    if (!project) {
      return errorResponse(res, "Project not found or private", 404);
    }
    
    return successResponse(res, project, "Project details retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/services
router.get("/services", async (req, res, next) => {
  try {
    const { sequelize } = require("../config/database");
    const [services] = await sequelize.query(`
      SELECT * FROM website_services 
      ORDER BY title ASC
    `);
    return successResponse(res, services, "Services retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/news
router.get("/news", async (req, res, next) => {
  try {
    const { sequelize } = require("../config/database");
    const [news] = await sequelize.query(`
      SELECT * FROM website_news 
      ORDER BY date DESC
    `);
    return successResponse(res, news, "News articles retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// POST /api/public/contact
router.post("/contact", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    console.log("Public contact message received:", { name, email, subject, message });
    return successResponse(res, {}, "Message received successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/careers
router.get("/careers", async (req, res, next) => {
  try {
    const { sequelize } = require("../config/database");
    const [jobs] = await sequelize.query(`
      SELECT * FROM website_careers 
      WHERE status = 'active'
      ORDER BY title ASC
    `);
    return successResponse(res, jobs, "Active job listings retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/faqs
router.get("/faqs", async (req, res, next) => {
  try {
    const { sequelize } = require("../config/database");
    const [faqs] = await sequelize.query(`
      SELECT * FROM website_faqs 
      ORDER BY displayOrder ASC
    `);
    return successResponse(res, faqs, "FAQs retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/settings
router.get("/settings", async (req, res, next) => {
  try {
    const { sequelize } = require("../config/database");
    const [settings] = await sequelize.query("SELECT `key`, `value` FROM website_settings");
    // Convert array of [{key, value}] to a dictionary object
    const dict = {};
    for (const row of settings) {
      dict[row.key] = row.value;
    }
    return successResponse(res, dict, "Website settings retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// POST /api/public/careers/apply
router.post("/careers/apply", async (req, res, next) => {
  try {
    const { name, email, position } = req.body;
    console.log("Public career application received for:", { name, email, position });
    return successResponse(res, {}, "Career application received successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/gallery
router.get("/gallery", async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const { sequelize } = require("../config/database");
    let query = `
      SELECT CONCAT('http://localhost:3000/uploads/media/', m.filename) AS imageUrl, 
             g.caption, g.type, g.visibility, g.displayOrder, g.id, g.projectId
      FROM project_gallery g
      JOIN media_library m ON g.mediaId = m.id
      WHERE g.visibility = 'public'
    `;
    const replacements = [];
    if (projectId) {
      query += ` AND g.projectId = ?`;
      replacements.push(projectId);
    }
    query += ` ORDER BY g.displayOrder ASC, g.createdAt DESC`;
    const [gallery] = await sequelize.query(query, { replacements });
    return successResponse(res, gallery, "Gallery retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/seo
router.get("/seo", async (req, res, next) => {
  try {
    const { pageKey } = req.query;
    const { sequelize } = require("../config/database");
    const [seo] = await sequelize.query(`
      SELECT title, description, keywords 
      FROM seo_settings 
      WHERE pageKey = ?
    `, { replacements: [pageKey || 'home'] });
    
    if (seo && seo.length > 0) {
      return successResponse(res, seo[0], "SEO settings retrieved successfully");
    }
    return successResponse(res, {
      title: 'United Ram Construction - Premium Construction Company',
      description: 'United Ram Construction Company is a premier contractor in Zanzibar.',
      keywords: 'construction, united ram'
    }, "Default SEO settings returned");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
