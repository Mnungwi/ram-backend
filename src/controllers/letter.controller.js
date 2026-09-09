const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { LETTERS_DIR, DOCUMENTS_DIR, MEDIA_DIR, UPLOADS_ROOT } = require("../config/uploadPaths");
const { OfficialLetter, LetterComment } = require("../models/letter.model");
const { Document } = require("../models/document.model");
const { User, Stakeholder, Project } = require("../models/index");
const { sequelize } = require("../config/database");
const { sendLetterEmail } = require("../utils/mailer");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { audit } = require("../utils/audit");
const { Op } = require("sequelize");

// The Letters PDF/preview letterhead used to be 100% hardcoded to a fake
// company ("UNITED" / "United Construction Group" / a Dar es Salaam
// address that isn't this company's) — completely disconnected from the
// real, DB-driven branding (website_settings) used everywhere else in the
// app (Contact page, Website Content admin). Cached briefly since this
// runs on every preview/download and rarely changes.
let brandingCache = null;
let brandingCacheAt = 0;
async function getCompanyBranding() {
  if (brandingCache && Date.now() - brandingCacheAt < 60000) return brandingCache;
  try {
    const [rows] = await sequelize.query("SELECT `key`, `value` FROM website_settings");
    const dict = {};
    for (const row of rows) dict[row.key] = row.value;
    brandingCache = {
      name: dict.site_title || "United Ram Construction Company Limited",
      logo: dict.site_logo || null,
      address: dict.contact_address || "Mbweni, Zanzibar, Tanzania",
      phone: dict.contact_phone || "+255 777 412 337",
      email: dict.contact_email || "info@unitedram.com",
    };
    brandingCacheAt = Date.now();
  } catch (e) {
    brandingCache = {
      name: "United Ram Construction Company Limited",
      logo: null,
      address: "Mbweni, Zanzibar, Tanzania",
      phone: "+255 777 412 337",
      email: "info@unitedram.com",
    };
  }
  return brandingCache;
}

function resolveAttachmentPath(filePath) {
  if (!filePath) return null;
  let fullPath = path.join(LETTERS_DIR, filePath);
  if (fs.existsSync(fullPath)) return fullPath;
  fullPath = path.join(DOCUMENTS_DIR, filePath);
  if (fs.existsSync(fullPath)) return fullPath;
  fullPath = path.join(MEDIA_DIR, filePath);
  if (fs.existsSync(fullPath)) return fullPath;
  fullPath = path.join(UPLOADS_ROOT, filePath);
  if (fs.existsSync(fullPath)) return fullPath;
  return null;
}


async function processLetterAttachments(reqFiles, reqFile, bodyAttachments, projectId, userId) {
  const finalAttachments = [];
  const seen = new Set();

  // 1. Process uploaded physical file(s) -> save each to Document Library (project_documents_v2)
  const filesToProcess = [];
  if (Array.isArray(reqFiles) && reqFiles.length > 0) {
    filesToProcess.push(...reqFiles);
  } else if (reqFile) {
    filesToProcess.push(reqFile);
  }

  for (const f of filesToProcess) {
    const srcPath = f.path;
    const targetPath = path.join(DOCUMENTS_DIR, f.filename);
    if (fs.existsSync(srcPath) && !fs.existsSync(targetPath)) {
      try { fs.copyFileSync(srcPath, targetPath); } catch (e) {}
    }

    const newDoc = await Document.create({
      projectId: projectId || null,
      category: "Correspondence",
      title: f.originalname,
      fileName: f.originalname,
      filePath: f.filename,
      fileSize: f.size,
      mimeType: f.mimetype,
      uploadedById: userId || null,
      status: "Completed",
      version: "1.0",
    });

    const entry = {
      documentId: newDoc.id,
      fileName: newDoc.fileName,
      filePath: newDoc.filePath,
      title: newDoc.title,
    };
    seen.add(newDoc.id);
    if (f.filename) seen.add(f.filename);
    finalAttachments.push(entry);
  }

  // 2. Process attachments passed in body (e.g. selected from gallery modal)
  let rawList = [];
  if (bodyAttachments) {
    try {
      rawList = typeof bodyAttachments === "string" ? JSON.parse(bodyAttachments) : bodyAttachments;
    } catch (e) {
      rawList = [];
    }
  }
  if (!Array.isArray(rawList)) rawList = [];

  const uploadedOriginalNames = filesToProcess.map(f => f.originalname);

  for (const item of rawList) {
    let docId = null;
    let fileName = null;
    let filePath = null;
    let title = null;

    if (typeof item === "string") {
      docId = item;
    } else if (item && typeof item === "object") {
      docId = item.documentId || item.id;
      fileName = item.fileName || item.title;
      filePath = item.filePath;
      title = item.title || item.fileName;
    }

    // Skip placeholder item if this item has no documentId and matches an uploaded file's original name
    if (!docId && (uploadedOriginalNames.includes(fileName) || uploadedOriginalNames.includes(filePath))) {
      continue;
    }

    if (docId && seen.has(docId)) continue;
    if (filePath && seen.has(filePath)) continue;

    if (docId) {
      const dbDoc = await Document.findByPk(docId);
      if (dbDoc) {
        fileName = dbDoc.fileName;
        filePath = dbDoc.filePath;
        title = dbDoc.title;
        docId = dbDoc.id;
      }
    } else if (filePath) {
      let dbDoc = await Document.findOne({ where: { filePath } });
      if (!dbDoc) {
        dbDoc = await Document.create({
          projectId: projectId || null,
          category: "Correspondence",
          title: fileName || filePath,
          fileName: fileName || filePath,
          filePath: filePath,
          uploadedById: userId || null,
          status: "Completed",
          version: "1.0",
        });
      }
      docId = dbDoc.id;
      fileName = dbDoc.fileName;
      filePath = dbDoc.filePath;
      title = dbDoc.title;
    }

    const key = docId || filePath || fileName;
    if (key && !seen.has(key)) {
      seen.add(key);
      if (docId) seen.add(docId);
      if (filePath) seen.add(filePath);
      finalAttachments.push({
        documentId: docId || null,
        fileName: fileName || "",
        filePath: filePath || "",
        title: title || fileName || "",
      });
    }
  }

  return finalAttachments;
}

const USER_INCLUDES = [
  { model: User, as: "createdBy", attributes: ["id", "firstName", "lastName"] },
  { model: User, as: "approvedBy", attributes: ["id", "firstName", "lastName"] },
  { model: User, as: "sentBy", attributes: ["id", "firstName", "lastName"] },
  { model: User, as: "sender", attributes: ["id", "firstName", "lastName", "email", "jobTitle", "department", "signatureImage"] },
  { model: Stakeholder, as: "recipient", attributes: ["id", "name", "organization", "jobTitle", "email", "phone"] },
  { model: Project, as: "project", attributes: ["id", "name", "projectCode"] },
  { model: User, as: "forwardedTo", attributes: ["id", "firstName", "lastName", "email"] },
  { model: User, as: "forwardedBy", attributes: ["id", "firstName", "lastName"] },
];

// Extra includes only needed on the single-letter detail view (list views skip these for speed)
const DETAIL_INCLUDES = [
  ...USER_INCLUDES,
  {
    model: LetterComment,
    as: "comments",
    include: [{ model: User, as: "user", attributes: ["id", "firstName", "lastName"] }],
    separate: true,
    order: [["createdAt", "ASC"]],
  },
];

const generateLetterNo = async (projectId) => {
  if (projectId) {
    const project = await Project.findByPk(projectId);
    const prefix = project && project.projectCode ? project.projectCode : "PRJ";
    const count = await OfficialLetter.count({ where: { projectId } });
    const sequence = String(count + 1).padStart(3, "0");
    return `${prefix}/LTR/${sequence}`;
  } else {
    const year = new Date().getFullYear();
    const count = await OfficialLetter.count({ where: { projectId: null } });
    return `LTR-${year}-${String(count + 1).padStart(4, "0")}`;
  }
};

// GET /api/letters/next-reference?projectId=xxx
// Read-only preview of the reference number generateLetterNo() would hand
// out next — for someone about to draft a letter OUTSIDE the system (e.g.
// in Word) who needs to know which number is safe to write on it by hand.
// It's advisory only: if another letter gets created in the meantime, this
// exact number gets consumed first — the actual duplicate-proofing happens
// in createLetter's uniqueness check below when that letter is registered.
exports.peekNextLetterNo = async (req, res, next) => {
  try {
    const projectId = req.query.projectId || null;
    const letterNo = await generateLetterNo(projectId);
    return successResponse(res, { letterNo }, "Next reference number");
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// LIST / CRUD
// ══════════════════════════════════════════════════════════════

// GET /api/letters  (jumla, si za project moja)
// GET /api/projects/:projectId/letters
exports.listLetters = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, type, priority, search, projectId: queryProjectId, clientId } = req.query;
    const { projectId } = req.params;

    const where = {};
    
    const targetProjectId = projectId || queryProjectId;
    if (targetProjectId) {
      where.projectId = targetProjectId;
    } else if (clientId) {
      const projects = await Project.findAll({ where: { clientId }, attributes: ["id"] });
      const projectIds = projects.map(p => p.id);
      where.projectId = { [Op.in]: projectIds };
    }

    if (status) {
      const statusMap = {
        draft: "Draft",
        pending_approval: "Pending Approval",
        approved: "Approved",
        sent: "Sent",
        archived: "Archived"
      };
      where.status = statusMap[status.toLowerCase()] || status;
    }

    if (type) where.type = type;
    if (priority) where.priority = priority;

    if (search) {
      where[Op.or] = [
        { subject: { [Op.like]: `%${search}%` } },
        { recipientName: { [Op.like]: `%${search}%` } },
        { letterNo: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await OfficialLetter.findAndCountAll({
      where,
      include: USER_INCLUDES,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

const formatLetterResponse = async (letter) => {
  if (!letter) return null;
  const letterData = letter.toJSON();
  let attachments = letterData.attachments || [];
  if (typeof attachments === "string") {
    try { attachments = JSON.parse(attachments); } catch(e) { attachments = []; }
  }
  if (!Array.isArray(attachments)) attachments = [];

  if (letterData.attachmentFileName || letterData.attachmentFilePath) {
    const legacyItem = {
      fileName: letterData.attachmentFileName,
      filePath: letterData.attachmentFilePath || letterData.attachmentFileName,
      title: letterData.attachmentFileName,
    };
    const exists = attachments.some(a => 
      (a.filePath && (a.filePath === legacyItem.filePath || a.filePath === legacyItem.fileName)) ||
      (a.fileName && (a.fileName === legacyItem.fileName || a.fileName === legacyItem.filePath)) ||
      (a.title && (a.title === legacyItem.fileName || a.title === legacyItem.filePath))
    );
    if (!exists && (legacyItem.fileName || legacyItem.filePath)) {
      attachments.unshift(legacyItem);
    }
  }

  const uniqueAttachments = [];
  const seenKeys = new Set();
  for (const att of attachments) {
    const docId = att.documentId || att.id;
    const name = att.fileName || att.title;
    const path = att.filePath;

    const key = docId || path || name;
    const nameKey = name ? name.trim().toLowerCase() : null;

    if (key && !seenKeys.has(key) && (!nameKey || !seenKeys.has(nameKey))) {
      seenKeys.add(key);
      if (nameKey) seenKeys.add(nameKey);
      if (docId) seenKeys.add(docId);
      if (path) seenKeys.add(path);
      uniqueAttachments.push(att);
    }
  }

  letterData.attachments = uniqueAttachments;
  
  let ccRecipients = [];
  let rawCc = letter.ccList || [];
  if (typeof rawCc === "string") {
    try {
      rawCc = JSON.parse(rawCc);
    } catch (e) {
      rawCc = [];
    }
  }
  if (!Array.isArray(rawCc)) rawCc = [];

  if (rawCc.length) {
    const ids = [];
    const manual = [];
    rawCc.forEach(item => {
      if (typeof item === "string") ids.push(item);
      else if (item && typeof item === "object") {
        if (item.id) ids.push(item.id);
        else manual.push(item);
      }
    });
    if (ids.length) {
      const dbStakeholders = await Stakeholder.findAll({ where: { id: ids } });
      ccRecipients = [
        ...dbStakeholders.map(s => ({
          id: s.id,
          name: s.name,
          title: s.jobTitle,
          email: s.email,
          organization: s.organization
        })),
        ...manual
      ];
    } else {
      ccRecipients = manual;
    }
  }
  letterData.ccRecipients = ccRecipients;
  return letterData;
};

// GET /api/letters/:letterId
exports.getLetter = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId, { include: DETAIL_INCLUDES });
    if (!letter) return errorResponse(res, "Letter not found", 404);
    const letterData = await formatLetterResponse(letter);
    return successResponse(res, { letter: letterData });
  } catch (err) {
    next(err);
  }
};

// POST /api/letters  or /api/projects/:projectId/letters  (multipart/form-data, field "attachment" hiari)
exports.createLetter = async (req, res, next) => {
  try {
    const { projectId: queryProjectId } = req.params;
    const {
      projectId: bodyProjectId,
      subject, subTitle, body, type, letterDate, priority,
      senderId, senderName: bSenderName, senderPosition: bSenderPosition, senderOrganization: bSenderOrganization, senderEmail: bSenderEmail,
      recipientId, recipientName: bRecipientName, recipientPosition: bRecipientPosition, recipientOrganization: bRecipientOrganization, recipientEmail: bRecipientEmail,
      fromName, fromTitle, fromOrg, fromEmail,
      toName, toTitle, toOrg, toEmail,
      ccList: bodyCcList, ccRecipients,
    } = req.body;
    // The Compose form's FormData always sends this under "ccRecipients"
    // (see letter-form.component.ts onSave()) — reading only "ccList" here
    // silently dropped every CC recipient added while composing a NEW
    // letter (they'd still show correctly after an edit/update, since
    // updateLetter already reads "ccRecipients").
    const ccList = ccRecipients ?? bodyCcList;

    const projectId = queryProjectId || bodyProjectId || null;
    const senderName = bSenderName || fromName;
    const senderPosition = bSenderPosition || fromTitle;
    const senderOrganization = bSenderOrganization || fromOrg;
    const senderEmail = bSenderEmail || fromEmail;

    const recipientName = bRecipientName || toName;
    const recipientPosition = bRecipientPosition || toTitle;
    const recipientOrganization = bRecipientOrganization || toOrg;
    const recipientEmail = bRecipientEmail || toEmail;

    if (!subject) return errorResponse(res, "Subject is required", 400);
    // Body is normally required — UNLESS this letter was already written
    // outside the system (e.g. in Word) and is being registered here with
    // its file as the attachment; the frontend marks that case by sending
    // `writtenExternally=true`, and requires an attachment itself in that
    // case (checked below) so there's always real content backing the record.
    const writtenExternally = req.body.writtenExternally === "true" || req.body.writtenExternally === true;
    if (!body && !writtenExternally) return errorResponse(res, "Body is required", 400);
    if (!recipientId && !recipientName) return errorResponse(res, "Recipient name or ID is required", 400);

    // ccList inaweza kuja kama JSON string (multipart/form-data haitumii JSON moja kwa moja)
    let parsedCc = [];
    if (ccList) {
      try {
        parsedCc = typeof ccList === "string" ? JSON.parse(ccList) : ccList;
      } catch (e) {
        parsedCc = [];
      }
    }

    const attachmentsList = await processLetterAttachments(req.files, req.file, req.body.attachments, projectId, req.userId);

    if (writtenExternally && attachmentsList.length === 0) {
      return errorResponse(res, "Please attach the letter file — it was marked as written outside the system", 400);
    }

    // A manually-supplied reference number (an incoming letter's own
    // number, or one already handwritten/typed on a letter drafted outside
    // the system) is honored as-is, as long as it isn't already in use —
    // this is the actual duplicate guard (see peekNextLetterNo above for
    // the advisory "what number should I use" preview). Only when nothing
    // was supplied do we fall back to the auto-generated sequence.
    let letterNo = req.body.letterNo || req.body.referenceNo;
    if (letterNo) {
      const duplicate = await OfficialLetter.findOne({ where: { letterNo } });
      if (duplicate) {
        return errorResponse(res, `Reference number "${letterNo}" is already used by another letter`, 409);
      }
    } else {
      letterNo = await generateLetterNo(projectId);
    }

    const letter = await OfficialLetter.create({
      projectId: projectId || null,
      type: type || "outgoing",
      letterDate: letterDate || new Date(),
      priority: priority || "normal",
      senderId: senderId || req.userId || null,
      recipientId: recipientId || null,
      letterNo,
      subject,
      subTitle: subTitle || null,
      body,
      senderName, senderPosition, senderOrganization, senderEmail,
      recipientName, recipientPosition, recipientOrganization, recipientEmail,
      ccList: parsedCc,
      attachmentFileName: attachmentsList.length ? attachmentsList[0].fileName : null,
      attachmentFilePath: attachmentsList.length ? attachmentsList[0].filePath : null,
      attachments: attachmentsList,
      status: "Draft",
      createdById: req.userId,
    });

    const full = await OfficialLetter.findByPk(letter.id, { include: USER_INCLUDES });
    const letterData = await formatLetterResponse(full);
    return successResponse(res, { letter: letterData }, "Letter created", 201);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// PUT /api/letters/:letterId  (metadata pekee — JSON body, si faili)
exports.updateLetter = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, "Letter not found", 404);
    if (["Sent", "Archived"].includes(letter.status))
      return errorResponse(res, "Cannot edit a letter that has already been sent/archived", 400);

    // Editing a letter that was already Approved or forwarded for
    // signature changes its content — any existing signature/approval no
    // longer validly applies to the new text, so it goes back to Draft and
    // has to be re-approved/re-signed rather than silently keeping a
    // signature that was actually given for different wording (e.g. after
    // a reviewer's comment asks for a change).
    const wasSignedOrPending = ["Approved", "Pending Signature"].includes(letter.status);

    const updateData = { ...req.body };
    if (wasSignedOrPending) {
      updateData.status = "Draft";
      updateData.approvedById = null;
      updateData.approvedAt = null;
      updateData.forwardedToId = null;
      updateData.forwardedById = null;
      updateData.forwardedAt = null;
    }
    if (req.body.fromName) updateData.senderName = req.body.fromName;
    if (req.body.fromTitle) updateData.senderPosition = req.body.fromTitle;
    if (req.body.fromOrg) updateData.senderOrganization = req.body.fromOrg;
    if (req.body.fromEmail) updateData.senderEmail = req.body.fromEmail;

    if (req.body.toName) updateData.recipientName = req.body.toName;
    if (req.body.toTitle) updateData.recipientPosition = req.body.toTitle;
    if (req.body.toOrg) updateData.recipientOrganization = req.body.toOrg;
    if (req.body.toEmail) updateData.recipientEmail = req.body.toEmail;

    if (req.body.ccRecipients) {
      try {
        updateData.ccList = typeof req.body.ccRecipients === "string" ? JSON.parse(req.body.ccRecipients) : req.body.ccRecipients;
      } catch (e) {}
    }

    if (req.body.attachments || req.files || req.file) {
      const attachmentsList = await processLetterAttachments(req.files, req.file, req.body.attachments, letter.projectId, req.userId);
      updateData.attachments = attachmentsList;
      if (attachmentsList.length > 0) {
        updateData.attachmentFileName = attachmentsList[0].fileName;
        updateData.attachmentFilePath = attachmentsList[0].filePath;
      } else {
        updateData.attachmentFileName = null;
        updateData.attachmentFilePath = null;
      }
    }

    await letter.update(updateData);
    const full = await OfficialLetter.findByPk(letter.id, { include: USER_INCLUDES });
    const letterData = await formatLetterResponse(full);
    return successResponse(res, { letter: letterData }, "Letter updated");
  } catch (err) {
    next(err);
  }
};

// POST /api/letters/:letterId/attachment  (badilisha/ongeza attachment, multipart/form-data)
exports.updateAttachment = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId);
    if (!letter) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return errorResponse(res, "Letter not found", 404);
    }
    if (letter.status === "Sent") {
      if (req.file) fs.unlink(req.file.path, () => {});
      return errorResponse(res, "Cannot edit a letter that has already been sent", 400);
    }
    if (!req.file && !req.files) return errorResponse(res, "File is required", 400);

    const attachmentsList = await processLetterAttachments(req.files, req.file, req.body.attachments || letter.attachments, letter.projectId, req.userId);

    await letter.update({
      attachments: attachmentsList,
      attachmentFileName: attachmentsList.length ? attachmentsList[0].fileName : req.file?.originalname,
      attachmentFilePath: attachmentsList.length ? attachmentsList[0].filePath : req.file?.filename,
    });

    const full = await OfficialLetter.findByPk(letter.id, { include: USER_INCLUDES });
    const letterData = await formatLetterResponse(full);
    return successResponse(res, { letter: letterData }, "Attachment updated");
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// DELETE /api/letters/:letterId
exports.deleteLetter = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, "Letter not found", 404);
    if (letter.status === "Sent")
      return errorResponse(res, "Cannot delete a letter that has already been sent", 400);

    if (letter.attachmentFilePath) {
      const filePath = path.join(LETTERS_DIR, letter.attachmentFilePath);
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    }

    await letter.destroy();
    return successResponse(res, null, "Letter deleted");
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// WORKFLOW
// ══════════════════════════════════════════════════════════════

// POST /api/letters/:letterId/submit
exports.submitLetter = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, "Letter not found", 404);
    if (letter.status !== "Draft") return errorResponse(res, "Only draft letters can be submitted", 400);

    await letter.update({ status: "Pending Approval" });
    return successResponse(res, { letter }, "Letter submitted for approval");
  } catch (err) {
    next(err);
  }
};

// POST /api/letters/:letterId/approve  (alias: /sign — signs the letter directly, either
// by the original creator/authorized signer, or by whoever it was forwarded to)
exports.approveLetter = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, "Letter not found", 404);
    if (!["Pending Approval", "Pending Signature"].includes(letter.status))
      return errorResponse(res, "Only letters pending approval or signature can be signed", 400);

    const { note } = req.body;
    const oldValues = { status: letter.status };

    await letter.update({
      status: "Approved",
      approvedById: req.userId,
      approvedAt: new Date(),
    });

    if (note && note.trim()) {
      await LetterComment.create({ letterId: letter.id, userId: req.userId, type: "sign", comment: note.trim() });
    }

    await audit({
      userId: req.userId,
      action: "sign",
      resource: "letter",
      resourceId: letter.id,
      oldValues,
      newValues: { status: "Approved" },
      req,
      projectId: letter.projectId,
    });

    return successResponse(res, { letter }, "Letter signed successfully");
  } catch (err) {
    next(err);
  }
};

// POST /api/letters/:letterId/forward  — hand the letter to another user to review & sign
// body: { userId, note }
exports.forwardLetter = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, "Letter not found", 404);
    if (!["Draft", "Pending Approval", "Pending Signature"].includes(letter.status))
      return errorResponse(res, "This letter can no longer be forwarded for signature", 400);

    const { userId, note } = req.body;
    if (!userId) return errorResponse(res, "Please choose who to forward this letter to", 400);

    const signer = await User.findByPk(userId);
    if (!signer) return errorResponse(res, "Selected user was not found", 404);

    await letter.update({
      status: "Pending Signature",
      forwardedToId: userId,
      forwardedById: req.userId,
      forwardedAt: new Date(),
    });

    await LetterComment.create({
      letterId: letter.id,
      userId: req.userId,
      type: "forward",
      comment: (note && note.trim()) || `Forwarded to ${signer.firstName} ${signer.lastName} for review & signature.`,
    });

    await audit({
      userId: req.userId,
      action: "forward",
      resource: "letter",
      resourceId: letter.id,
      newValues: { forwardedToId: userId, status: "Pending Signature" },
      req,
      projectId: letter.projectId,
    });

    return successResponse(res, { letter }, `Letter forwarded to ${signer.firstName} ${signer.lastName} for signature`);
  } catch (err) {
    next(err);
  }
};

// POST /api/letters/:letterId/comments — add a standalone note (discussion, not tied to sign/forward)
exports.addLetterComment = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, "Letter not found", 404);

    const { comment } = req.body;
    if (!comment || !comment.trim()) return errorResponse(res, "Comment text is required", 400);

    const created = await LetterComment.create({
      letterId: letter.id,
      userId: req.userId,
      type: "note",
      comment: comment.trim(),
    });
    const withUser = await LetterComment.findByPk(created.id, {
      include: [{ model: User, as: "user", attributes: ["id", "firstName", "lastName"] }],
    });

    return successResponse(res, { comment: withUser }, "Note added");
  } catch (err) {
    next(err);
  }
};

// POST /api/letters/:letterId/send
// Inatuma email HALISI kwa recipient + CC
exports.sendLetter = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId, { include: USER_INCLUDES });
    if (!letter) return errorResponse(res, "Letter not found", 404);
    if (letter.status !== "Approved")
      return errorResponse(res, "Letter must be approved before sending", 400);

    const recipientEmail = letter.recipient ? letter.recipient.email : letter.recipientEmail;
    if (!recipientEmail)
      return errorResponse(res, "Recipient email is required to send", 400);

    let ccEmails = [];
    if (letter.ccList && letter.ccList.length) {
      if (typeof letter.ccList[0] === "string" || (typeof letter.ccList[0] === "object" && !letter.ccList[0].email)) {
        const stakeholders = await Stakeholder.findAll({
          where: { id: letter.ccList }
        });
        ccEmails = stakeholders.map((s) => s.email).filter(Boolean);
      } else {
        ccEmails = letter.ccList.map((c) => c.email).filter(Boolean);
      }
    }

    const html = await buildLetterHtml(letter);

    const letterData = await formatLetterResponse(letter);
    const attachments = [];
    const seenPaths = new Set();

    if (Array.isArray(letterData.attachments)) {
      for (const att of letterData.attachments) {
        const filePath = att.filePath || att.fileName;
        if (!filePath) continue;
        const fullPath = resolveAttachmentPath(filePath);
        if (fullPath && !seenPaths.has(fullPath)) {
          seenPaths.add(fullPath);
          attachments.push({
            filename: att.fileName || att.title || path.basename(fullPath),
            path: fullPath,
          });
        }
      }
    }

    try {
      const info = await sendLetterEmail({
        to: recipientEmail,
        cc: ccEmails,
        subject: `${letter.letterNo}: ${letter.subject}`,
        html,
        attachments,
      });

      await letter.update({
        status: "Sent",
        sentById: req.userId,
        sentAt: new Date(),
        emailMessageId: info.messageId,
        emailError: null,
      });

      return successResponse(
        res,
        { letter: letterData },
        `Letter sent to ${recipientEmail}${ccEmails.length ? ` (cc: ${ccEmails.join(", ")})` : ""}`,
      );
    } catch (emailErr) {
      await letter.update({ emailError: emailErr.message });
      return errorResponse(res, `Failed to send email: ${emailErr.message}`, 500);
    }
  } catch (err) {
    next(err);
  }
};

// POST /api/letters/:letterId/archive
exports.archiveLetter = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, "Letter not found", 404);
    await letter.update({ status: "Archived" });
    return successResponse(res, { letter }, "Letter archived");
  } catch (err) {
    next(err);
  }
};

// GET /api/letters/inbox
// "Inbox" = barua zisizo Draft (zinazohitaji hatua/uangalizi wa mtumiaji: pending
// approval, approved zisizotumwa, au zilizotumwa hivi karibuni)
exports.getInboxLetters = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { projectId } = req.params;

    const where = { status: { [Op.ne]: "Draft" } };
    if (projectId) where.projectId = projectId;

    const { count, rows } = await OfficialLetter.findAndCountAll({
      where,
      include: USER_INCLUDES,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/letters/stats  or  /api/projects/:projectId/letters/stats
exports.getLetterStats = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const where = {};
    if (projectId) where.projectId = projectId;

    const letters = await OfficialLetter.findAll({ where, attributes: ["status"] });

    const stats = {
      total: letters.length,
      draft: letters.filter((l) => l.status === "Draft").length,
      pendingApproval: letters.filter((l) => l.status === "Pending Approval").length,
      approved: letters.filter((l) => l.status === "Approved").length,
      sent: letters.filter((l) => l.status === "Sent").length,
      archived: letters.filter((l) => l.status === "Archived").length,
      incoming: letters.filter((l) => l.type === "incoming").length,
    };

    return successResponse(res, { stats });
  } catch (err) {
    next(err);
  }
};

// Helper: HTML ya barua (inatumika kwa preview na msingi wa email)
const stripHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
};

// A sender's stored signature image only renders once it's actually
// THEIRS to show — either they wrote the letter themselves (self-signed,
// no delegation happened), or someone composed it "Signing As" them and
// they've since actually approved it (Approved status + approvedBy IS the
// designated sender) — never just because a secretary picked their name.
function letterHasVisibleSignature(letter) {
  if (!letter.sender?.signatureImage) return false;
  return letterApprovalIsConsistent(letter);
}

// True when whoever is recorded as having approved/signed the letter is
// actually allowed to be shown as its signer: either no delegation
// happened (senderId unset — the normal single-track submit/approve
// flow, where anyone with approve rights legitimately signs, e.g. a PM
// approving a subordinate's letter), or a delegate ("Signing As") who has
// genuinely approved it themselves. Guards against a stale/edge-case
// record where a letter was "Signing As" one person but got approved by
// someone else entirely — that combination should never be presented as
// "digitally signed", with or without an actual signature image.
function letterApprovalIsConsistent(letter) {
  if (!letter.senderId || letter.senderId === letter.createdById) return true;
  return !!(letter.status === "Approved" && letter.approvedById && letter.approvedById === letter.senderId);
}

async function buildLetterHtml(letter) {
  const branding = await getCompanyBranding();

  // Resolve Sender Details
  const senderName = letter.sender ? `${letter.sender.firstName} ${letter.sender.lastName}` : (letter.senderName || branding.name);
  const senderPosition = letter.sender ? letter.sender.jobTitle : (letter.senderPosition || "");
  const senderOrganization = letter.sender ? (letter.sender.department || branding.name) : (letter.senderOrganization || branding.name);
  const senderEmail = letter.sender ? letter.sender.email : (letter.senderEmail || branding.email);

  // Resolve Recipient Details
  const recipientName = letter.recipient ? letter.recipient.name : (letter.recipientName || "");
  const recipientPosition = letter.recipient ? letter.recipient.jobTitle : (letter.recipientPosition || "");
  const recipientOrganization = letter.recipient ? letter.recipient.organization : (letter.recipientOrganization || "");
  const recipientEmail = letter.recipient ? letter.recipient.email : (letter.recipientEmail || "");

  // Resolve CC Details
  let ccStakeholders = [];
  let rawCc = letter.ccList || [];
  if (typeof rawCc === "string") {
    try {
      rawCc = JSON.parse(rawCc);
    } catch (e) {
      rawCc = [];
    }
  }
  if (!Array.isArray(rawCc)) rawCc = [];

  if (rawCc.length) {
    const ids = [];
    const manual = [];
    rawCc.forEach(item => {
      if (typeof item === "string") {
        ids.push(item);
      } else if (item && typeof item === "object") {
        if (item.id) {
          ids.push(item.id);
        } else {
          manual.push(item);
        }
      }
    });
    if (ids.length) {
      const dbStakeholders = await Stakeholder.findAll({ where: { id: ids } });
      ccStakeholders = [...dbStakeholders, ...manual];
    } else {
      ccStakeholders = manual;
    }
  }

  const formatted = await formatLetterResponse(letter);
  const attachmentsList = formatted?.attachments || [];

  let attachmentsHtml = "";
  if (attachmentsList.length > 0) {
    const itemsHtml = attachmentsList.map((att, idx) => {
      const fileName = att.fileName || att.title || "Attachment";
      const ext = path.extname(fileName).toLowerCase();
      const fileUrl = `/api/letters/${letter.id}/attachment/file?index=${idx}&file=${encodeURIComponent(att.filePath || fileName)}`;
      let previewTag = "";
      if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
        previewTag = `<div style="margin-top:10px;"><img src="${fileUrl}" style="max-width:100%; height:auto; border:1px solid #e5e7eb; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.1);" /></div>`;
      } else if (ext === ".pdf") {
        previewTag = `<div style="margin-top:10px;"><iframe src="${fileUrl}" style="width:100%; height:600px; border:1px solid #e5e7eb; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.1);"></iframe></div>`;
      }
      return `
        <div style="margin-top: 12px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;">
          <strong>Attachment ${attachmentsList.length > 1 ? `#${idx + 1}` : ""}:</strong> 
          <a href="${fileUrl}" target="_blank" style="color: #1a56db; font-weight: bold; text-decoration: underline; margin-left: 5px;">
            ${fileName} ↗
          </a>
          ${previewTag}
        </div>
      `;
    }).join("");

    attachmentsHtml = `
      <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #111827;">Attachments (${attachmentsList.length}):</h4>
        ${itemsHtml}
      </div>
    `;
  }

  return `
    <div style="font-family: 'Times New Roman', Times, serif; max-width: 800px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); color: #111827;">
      <!-- LETTERHEAD — real, DB-driven company branding (Website Content > Branding & Contact Info), not a hardcoded placeholder company -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a56db; padding-bottom: 15px; margin-bottom: 25px;">
        <div style="display:flex; align-items:center; gap:12px;">
          ${branding.logo ? `<img src="${branding.logo}" style="height:40px; width:auto; object-fit:contain;" />` : ""}
          <div style="font-size: 20px; font-weight: 800; color: #1a56db; letter-spacing: 0.5px;">${branding.name}</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #4b5563; line-height: 1.5;">
          <div>${branding.address}</div>
          <div>Tel: ${branding.phone} | Email: ${branding.email}</div>
        </div>
      </div>
      <!-- REF & DATE -->
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 25px;">
        <div>Ref No: <strong style="color: #111827;">${letter.letterNo || 'DRAFT'}</strong></div>
        <div>Date: <strong style="color: #111827;">${new Date(letter.letterDate || letter.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</strong></div>
      </div>
      <!-- TO -->
      <div style="margin-bottom: 20px; font-size: 14px;">
        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 3px;">To:</div>
        <div style="font-weight: bold; color: #111827;">${recipientName}${recipientPosition ? ", " + recipientPosition : ""}</div>
        ${recipientOrganization ? `<div>${recipientOrganization}</div>` : ""}
        ${recipientEmail ? `<div style="color:#6b7280;font-size:12px;">${recipientEmail}</div>` : ""}
      </div>
      <!-- SUBJECT -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 15px; font-weight: bold; text-decoration: underline; text-transform: uppercase; color: #111827;">
          SUBJECT: ${letter.subject}
        </div>
        ${letter.subTitle ? `<div style="font-size: 12px; font-weight: bold; color: #4b5563; margin-top: 5px; text-transform: uppercase;">${letter.subTitle}</div>` : ""}
      </div>
      <!-- BODY -->
      <div style="line-height: 1.6; font-size: 14px; margin-bottom: 40px; color: #111827;">${letter.body}</div>
      <!-- SIGN-OFF -->
      <div style="margin-top: 40px; font-size: 14px;">
        <div style="margin-bottom: ${letterHasVisibleSignature(letter) ? "8px" : "35px"};">Yours faithfully,</div>
        ${letterHasVisibleSignature(letter) ? `<div style="margin-bottom:6px;"><img src="${letter.sender.signatureImage}" style="height:50px; object-fit:contain;" /></div>` : ""}
        <div style="font-weight: bold; text-decoration: underline; min-width: 180px; display: inline-block;">${senderName}</div>
        ${senderPosition ? `<div style="color:#4b5563;font-size:12px;">${senderPosition}</div>` : ""}
        ${senderOrganization ? `<div style="color:#4b5563;font-size:12px;">${senderOrganization}</div>` : ""}
        ${letter.createdBy && letter.senderId && letter.createdById !== letter.senderId ? `
          <div style="margin-top:6px; font-size:10px; color:#9ca3af; font-style:italic;">
            Prepared on behalf of ${senderName} by ${letter.createdBy.firstName} ${letter.createdBy.lastName}${!letterApprovalIsConsistent(letter) ? " — awaiting their signature" : ""}
          </div>
        ` : ""}
        ${letter.approvedById && letter.approvedBy && letterApprovalIsConsistent(letter) ? `
          <div style="margin-top:10px; font-size:11px; color:#059669; font-style:italic;">
            ✓ Digitally signed by ${letter.approvedBy.firstName} ${letter.approvedBy.lastName} on ${new Date(letter.approvedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        ` : ""}
      </div>
      <!-- CC -->
      ${
        ccStakeholders.length
          ? `<div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;"><strong>CC:</strong><ul style="margin: 5px 0 0 0; padding-left: 20px;">${ccStakeholders.map((c) => `<li>${c.name} (${c.email})</li>`).join("")}</ul></div>`
          : ""
      }
      <!-- Attachments -->
      ${attachmentsHtml}
    </div>
  `;
}

// GET /api/letters/:letterId/preview  — inarudisha HTML moja kwa moja (si JSON)
// Frontend inatumia hii kama URL ya <iframe [src]> au kufungua tab mpya
exports.previewLetter = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId, { include: USER_INCLUDES });
    if (!letter) return res.status(404).send("<h3>Letter not found</h3>");

    res.set("Content-Type", "text/html");
    res.send(await buildLetterHtml(letter));
  } catch (err) {
    next(err);
  }
};

// GET /api/letters/:letterId/download  — inarudisha PDF (Blob) ya barua
exports.downloadLetterPdf = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId, { include: USER_INCLUDES });
    if (!letter) return errorResponse(res, "Letter not found", 404);

    const branding = await getCompanyBranding();

    // Resolve Sender Details
    const senderName = letter.sender ? `${letter.sender.firstName} ${letter.sender.lastName}` : (letter.senderName || branding.name);
    const senderPosition = letter.sender ? letter.sender.jobTitle : (letter.senderPosition || "");
    const senderOrganization = letter.sender ? (letter.sender.department || branding.name) : (letter.senderOrganization || branding.name);
    const senderEmail = letter.sender ? letter.sender.email : (letter.senderEmail || branding.email);

    // Resolve Recipient Details
    const recipientName = letter.recipient ? letter.recipient.name : (letter.recipientName || "");
    const recipientPosition = letter.recipient ? letter.recipient.jobTitle : (letter.recipientPosition || "");
    const recipientOrganization = letter.recipient ? letter.recipient.organization : (letter.recipientOrganization || "");
    const recipientEmail = letter.recipient ? letter.recipient.email : (letter.recipientEmail || "");

    // Resolve CC Details
    let ccStakeholders = [];
    let rawCc2 = letter.ccList || [];
    if (typeof rawCc2 === "string") {
      try {
        rawCc2 = JSON.parse(rawCc2);
      } catch (e) {
        rawCc2 = [];
      }
    }
    if (!Array.isArray(rawCc2)) rawCc2 = [];

    if (rawCc2.length) {
      const ids = [];
      const manual = [];
      rawCc2.forEach(item => {
        if (typeof item === "string") {
          ids.push(item);
        } else if (item && typeof item === "object") {
          if (item.id) {
            ids.push(item.id);
          } else {
            manual.push(item);
          }
        }
      });
      if (ids.length) {
        const dbStakeholders = await Stakeholder.findAll({ where: { id: ids } });
        ccStakeholders = [...dbStakeholders, ...manual];
      } else {
        ccStakeholders = manual;
      }
    }

    const letterData = await formatLetterResponse(letter);
    const attachmentsList = letterData?.attachments || [];

    // Use application/octet-stream and omit Content-Disposition to bypass IDM extension hijacking on AJAX requests
    res.setHeader("Content-Type", "application/octet-stream");

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      try {
        const letterPdfBuffer = Buffer.concat(chunks);
        let finalPdfBuffer = letterPdfBuffer;

        const pdfAttachments = attachmentsList.filter(att => {
          const filePath = att.filePath || att.fileName;
          const ext = path.extname(att.fileName || filePath || "").toLowerCase();
          return ext === ".pdf" && resolveAttachmentPath(filePath);
        });

        if (pdfAttachments.length > 0) {
          const { PDFDocument: PDFLibDoc } = require("pdf-lib");
          const mergedPdf = await PDFLibDoc.create();
          
          const mainPdfDoc = await PDFLibDoc.load(letterPdfBuffer);
          const copiedPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          
          for (const att of pdfAttachments) {
            const filePath = att.filePath || att.fileName;
            const attachPath = resolveAttachmentPath(filePath);
            if (attachPath) {
              const attachBytes = fs.readFileSync(attachPath);
              const attachPdfDoc = await PDFLibDoc.load(attachBytes);
              const attachPages = await mergedPdf.copyPages(attachPdfDoc, attachPdfDoc.getPageIndices());
              attachPages.forEach((page) => mergedPdf.addPage(page));
            }
          }
          finalPdfBuffer = Buffer.from(await mergedPdf.save());
        }
        res.end(finalPdfBuffer);
      } catch (err) {
        console.error("PDF Merge Error:", err);
        res.end(Buffer.concat(chunks));
      }
    });

    // ── LETTERHEAD — real, DB-driven company branding, not a hardcoded placeholder company ──
    let logoDrawn = false;
    if (branding.logo) {
      const logoPath = resolveAttachmentPath(branding.logo.replace(/^\//, ""));
      if (logoPath) {
        try {
          doc.image(logoPath, 50, 45, { height: 32 });
          logoDrawn = true;
        } catch (e) {
          // corrupt/unsupported image — fall back to text-only letterhead below
        }
      }
    }
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#1a56db")
      .text(branding.name, logoDrawn ? 90 : 50, 55, { width: logoDrawn ? 205 : 245 });

    doc.fontSize(9).font("Helvetica").fillColor("#4b5563")
      .text(branding.address, 300, 50, { width: 245, align: "right" })
      .text(`Tel: ${branding.phone} | ${branding.email}`, 300, doc.y, { width: 245, align: "right" });
    doc.y = 90;

    doc.moveTo(50, 118).lineTo(545, 118).strokeColor("#1a56db").lineWidth(3).stroke();
    doc.y = 130;

    // Ref / Date
    doc.fontSize(9).fillColor("#6b7280")
      .text(`Ref: ${letter.letterNo || "DRAFT"}`, { continued: false })
      .text(`Date: ${new Date(letter.letterDate || letter.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`);
    doc.moveDown(1.5);

    // To
    doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold")
      .text(`To: ${recipientName}${recipientPosition ? ", " + recipientPosition : ""}`);
    doc.font("Helvetica").fontSize(10).fillColor("#374151");
    if (recipientOrganization) doc.text(recipientOrganization);
    if (recipientEmail) doc.fillColor("#6b7280").text(recipientEmail);
    doc.moveDown();

    // Subject
    doc.fillColor("#111827").fontSize(12).font("Helvetica-Bold").text(`Subject: ${letter.subject}`);
    if (letter.subTitle) {
      doc.fontSize(10).font("Helvetica-BoldOblique").fillColor("#374151").text(letter.subTitle);
    }
    doc.moveDown();

    // Body (stripping HTML tags for PDF Kit)
    doc.font("Helvetica").fontSize(11).fillColor("#111827").text(stripHtml(letter.body), { align: "left", lineGap: 4 });
    doc.moveDown(3);

    // Sender — stamp the sender's stored signature image, if they have one
    // uploaded (Profile > Digital Signature) AND it's actually theirs to
    // show yet (letterHasVisibleSignature — self-signed, or a delegate who
    // has since approved it), before their printed name.
    if (letterHasVisibleSignature(letter)) {
      const sigRelative = letter.sender.signatureImage.replace(/^\/?uploads\//, "");
      const sigPath = path.join(UPLOADS_ROOT, sigRelative);
      if (fs.existsSync(sigPath)) {
        try {
          // doc.image() with explicit x/y does NOT auto-advance PDFKit's
          // flowing cursor the way .text() does — a plain moveDown() here
          // (as before) moved by a line-height unit unrelated to the
          // image's actual height, so the printed name below could
          // overlap the bottom of the image. Advance doc.y by the image's
          // own height instead.
          const imgHeight = 40;
          const imgY = doc.y;
          doc.image(sigPath, doc.x, imgY, { height: imgHeight });
          doc.y = imgY + imgHeight + 6;
        } catch (e) {
          // corrupt/unsupported image — skip silently, the printed name still identifies the signer
        }
      }
    }
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(11).text(senderName);
    doc.font("Helvetica");
    if (senderPosition) doc.fontSize(9).fillColor("#6b7280").text(senderPosition);
    if (senderOrganization) doc.fontSize(9).fillColor("#6b7280").text(senderOrganization);
    if (letter.createdBy && letter.senderId && letter.createdById !== letter.senderId) {
      doc.moveDown(0.3);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor("#9ca3af")
        .text(`Prepared on behalf of ${senderName} by ${letter.createdBy.firstName} ${letter.createdBy.lastName}${!letterApprovalIsConsistent(letter) ? " — awaiting their signature" : ""}`);
    }

    if (letter.approvedById && letter.approvedBy && letterApprovalIsConsistent(letter)) {
      const signedName = `${letter.approvedBy.firstName || ""} ${letter.approvedBy.lastName || ""}`.trim();
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor("#059669")
        .text(`✓ Digitally signed by ${signedName} on ${new Date(letter.approvedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`);
    }
    doc.moveDown();

    // CC List at the bottom
    if (ccStakeholders.length) {
      doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold").text("CC:", { continued: false });
      doc.font("Helvetica").fontSize(9).fillColor("#4b5563");
      ccStakeholders.forEach((c) => {
        doc.text(`- ${c.name} (${c.email})`);
      });
    }

    // Attachments at the bottom
    if (attachmentsList.length > 0) {
      doc.moveDown();
      doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold").text(`Attachments (${attachmentsList.length}):`, { continued: false });
      doc.font("Helvetica").fontSize(9).fillColor("#1a56db");
      attachmentsList.forEach((att, idx) => {
        doc.text(`${idx + 1}. ${att.fileName || att.title}`);
      });

      // Embed image attachments
      for (const att of attachmentsList) {
        const filePath = att.filePath || att.fileName;
        const ext = path.extname(att.fileName || filePath || "").toLowerCase();
        const attachPath = resolveAttachmentPath(filePath);
        if ([".jpg", ".jpeg", ".png"].includes(ext) && attachPath) {
          doc.addPage();
          doc.image(attachPath, 50, 50, { fit: [500, 700], align: 'center', valign: 'center' });
        }
      }
    }

    doc.end();
  } catch (err) {
    next(err);
  }
};

// GET /api/letters/:letterId/attachment/download
exports.downloadAttachment = async (req, res, next) => {
  try {
    const letter = await OfficialLetter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, "Letter not found", 404);

    let fileName = letter.attachmentFileName;
    let targetPathName = letter.attachmentFilePath;

    const { download, index, file } = req.query;

    const formatted = await formatLetterResponse(letter);
    const attachments = formatted?.attachments || [];

    if (file) {
      const match = attachments.find(a => a.filePath === file || a.fileName === file);
      if (match) {
        fileName = match.fileName;
        targetPathName = match.filePath;
      } else {
        targetPathName = file;
      }
    } else if (index !== undefined && attachments[parseInt(index, 10)]) {
      const match = attachments[parseInt(index, 10)];
      fileName = match.fileName;
      targetPathName = match.filePath;
    }

    if (!targetPathName) return errorResponse(res, "Attachment not found", 404);

    let fullPath = path.join(LETTERS_DIR, targetPathName);
    if (!fs.existsSync(fullPath)) fullPath = path.join(DOCUMENTS_DIR, targetPathName);
    if (!fs.existsSync(fullPath)) fullPath = path.join(MEDIA_DIR, targetPathName);
    if (!fs.existsSync(fullPath)) fullPath = path.join(UPLOADS_ROOT, targetPathName);

    if (!fs.existsSync(fullPath)) return errorResponse(res, "File not found on server", 404);

    if (download === "true") {
      res.download(fullPath, fileName || path.basename(fullPath));
    } else {
      res.sendFile(fullPath);
    }
  } catch (err) {
    next(err);
  }
};
