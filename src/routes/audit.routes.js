const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const { Op } = require("sequelize");
const { AuditLog, User, Project } = require("../models/index");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");
const { successResponse, errorResponse, paginatedResponse, getPagination } = require("../utils/response");

router.use(authenticate);

const EXPORT_ROW_CAP = 5000;

// Build a Sequelize where-clause from the shared filter query params.
function buildAuditWhere(query) {
  const { search, userId, projectId, action, resource, dateFrom, dateTo } = query;
  const where = {};

  if (userId) where.userId = userId;
  if (projectId) where.projectId = projectId;
  if (action) where.action = action;
  if (resource) where.resource = resource;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(`${dateFrom}T00:00:00`);
    if (dateTo) where.createdAt[Op.lte] = new Date(`${dateTo}T23:59:59`);
  }

  if (search) {
    where[Op.or] = [
      { action: { [Op.like]: `%${search}%` } },
      { resource: { [Op.like]: `%${search}%` } },
      { resourceId: { [Op.like]: `%${search}%` } },
      { ipAddress: { [Op.like]: `%${search}%` } },
    ];
  }

  return where;
}

const includeAssoc = [
  { model: User, as: "user", attributes: ["id", "firstName", "lastName", "email"] },
  { model: Project, as: "project", attributes: ["id", "name"] },
];

// GET /api/audit-logs — system-wide, paginated, filterable
router.get("/", authorize(P.AUDIT_VIEW), async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { count, rows } = await AuditLog.findAndCountAll({
      where: buildAuditWhere(req.query),
      include: includeAssoc,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    return paginatedResponse(res, rows, count, page, limit, "Audit logs retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/audit-logs/meta — distinct action/resource values, for filter dropdowns
router.get("/meta", authorize(P.AUDIT_VIEW), async (req, res, next) => {
  try {
    const actionRows = await AuditLog.findAll({ attributes: ["action"], group: ["action"], raw: true });
    const resourceRows = await AuditLog.findAll({ attributes: ["resource"], group: ["resource"], raw: true });
    return successResponse(res, {
      actions: actionRows.map((r) => r.action).filter(Boolean).sort(),
      resources: resourceRows.map((r) => r.resource).filter(Boolean).sort(),
    }, "Audit log filter options retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/audit-logs/report/csv — full CSV export of the (filtered) audit trail
router.get("/report/csv", authorize(P.AUDIT_EXPORT), async (req, res, next) => {
  try {
    const rows = await AuditLog.findAll({
      where: buildAuditWhere(req.query),
      include: includeAssoc,
      order: [["createdAt", "DESC"]],
      limit: EXPORT_ROW_CAP,
    });

    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Date/Time", "User", "Email", "Action", "Resource", "Resource ID", "Project", "IP Address"];
    const lines = [header.map(esc).join(",")];

    for (const r of rows) {
      const userName = r.user ? `${r.user.firstName || ""} ${r.user.lastName || ""}`.trim() : "System";
      lines.push([
        r.createdAt.toISOString(),
        userName,
        r.user ? r.user.email : "",
        r.action,
        r.resource,
        r.resourceId || "",
        r.project ? r.project.name : "",
        r.ipAddress || "",
      ].map(esc).join(","));
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="audit-report-${Date.now()}.csv"`);
    // BOM so Excel opens UTF-8 correctly
    res.send("﻿" + lines.join("\r\n"));
  } catch (err) {
    next(err);
  }
});

// GET /api/audit-logs/report/pdf — full printable PDF export of the (filtered) audit trail
router.get("/report/pdf", authorize(P.AUDIT_EXPORT), async (req, res, next) => {
  try {
    const rows = await AuditLog.findAll({
      where: buildAuditWhere(req.query),
      include: includeAssoc,
      order: [["createdAt", "DESC"]],
      limit: EXPORT_ROW_CAP,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="audit-report-${Date.now()}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    doc.pipe(res);

    const cols = [
      { key: "date", label: "Date/Time", width: 110 },
      { key: "user", label: "User", width: 130 },
      { key: "action", label: "Action", width: 90 },
      { key: "resource", label: "Resource", width: 110 },
      { key: "resourceId", label: "Resource ID", width: 150 },
      { key: "project", label: "Project", width: 150 },
      { key: "ip", label: "IP Address", width: 90 },
    ];
    const tableLeft = 40;
    const tableWidth = cols.reduce((s, c) => s + c.width, 0);

    const drawHeader = () => {
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827")
        .text("United Ram Construction — Audit Report", tableLeft, 40);
      doc.fontSize(9).font("Helvetica").fillColor("#6b7280")
        .text(`Generated: ${new Date().toLocaleString("en-GB")}  |  Records: ${rows.length}${rows.length >= EXPORT_ROW_CAP ? ` (capped at ${EXPORT_ROW_CAP})` : ""}`, tableLeft, 60);
      doc.moveTo(tableLeft, 78).lineTo(tableLeft + tableWidth, 78).strokeColor("#1a56db").lineWidth(1.5).stroke();

      let x = tableLeft;
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#111827");
      cols.forEach((c) => {
        doc.text(c.label, x, 86, { width: c.width, ellipsis: true });
        x += c.width;
      });
      doc.moveTo(tableLeft, 100).lineTo(tableLeft + tableWidth, 100).strokeColor("#d1d5db").stroke();
      return 106;
    };

    let y = drawHeader();
    doc.fontSize(8).font("Helvetica").fillColor("#374151");

    for (const r of rows) {
      if (y > 555) {
        doc.addPage();
        y = drawHeader();
        doc.fontSize(8).font("Helvetica").fillColor("#374151");
      }

      const userName = r.user ? `${r.user.firstName || ""} ${r.user.lastName || ""}`.trim() : "System";
      const values = {
        date: new Date(r.createdAt).toLocaleString("en-GB"),
        user: userName,
        action: r.action,
        resource: r.resource,
        resourceId: r.resourceId || "-",
        project: r.project ? r.project.name : "-",
        ip: r.ipAddress || "-",
      };

      let x = tableLeft;
      cols.forEach((c) => {
        doc.text(String(values[c.key] ?? "-"), x, y, { width: c.width, ellipsis: true });
        x += c.width;
      });
      y += 16;
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
