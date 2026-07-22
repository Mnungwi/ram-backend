const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Letter, LetterRead, User, Project } = require('../models/index');
const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
const { audit } = require('../utils/audit');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Generate next letter number: e.g. LTR-2026-0042 */
const generateLetterNo = async () => {
  const year = new Date().getFullYear();
  const last = await Letter.findOne({
    where: { letterNo: { [Op.like]: `LTR-${year}-%` } },
    order: [['createdAt', 'DESC']],
  });
  const seq = last ? parseInt(last.letterNo.split('-')[2]) + 1 : 1;
  return `LTR-${year}-${String(seq).padStart(4, '0')}`;
};

/** Build HTML letterhead for PDF / preview */
const buildLetterHTML = (letter, org = {}) => {
  const ccBlock = (letter.ccRecipients || []).length > 0
    ? `<div class="cc-block">
         <strong>CC:</strong>
         ${(letter.ccRecipients).map(cc =>
           `<div class="cc-item">${cc.name}${cc.title ? ', ' + cc.title : ''}${cc.email ? ' &lt;' + cc.email + '&gt;' : ''}</div>`
         ).join('')}
       </div>`
    : '';

  const priorityColors = { low: '#6b7280', normal: '#2563eb', high: '#d97706', urgent: '#dc2626' };
  const priorityLabel = letter.priority.toUpperCase();
  const priorityColor = priorityColors[letter.priority] || '#2563eb';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${letter.subject}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #1a1a1a; background: #fff; }
  .page { max-width: 210mm; margin: 0 auto; padding: 20mm 25mm; min-height: 297mm; }

  /* Letterhead */
  .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 20px; }
  .org-logo { font-size: 22pt; font-weight: bold; color: #1e3a5f; }
  .org-details { text-align: right; font-size: 9pt; color: #555; line-height: 1.6; }
  .org-name-full { font-size: 11pt; font-weight: bold; color: #1e3a5f; }

  /* Letter meta */
  .letter-meta { margin-bottom: 20px; }
  .letter-no-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .letter-no { font-size: 10pt; color: #555; }
  .priority-badge { padding: 3px 10px; border-radius: 12px; font-size: 8pt; font-weight: bold; color: #fff; background: ${priorityColor}; }

  /* Addressing */
  .address-block { margin-bottom: 18px; }
  .address-label { font-size: 9pt; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .address-name  { font-size: 11pt; font-weight: bold; }
  .address-sub   { font-size: 10pt; color: #444; }

  .date-line { margin-bottom: 18px; font-size: 10pt; color: #444; }

  /* Subject */
  .subject-line { margin-bottom: 22px; }
  .subject-label { font-size: 9pt; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .subject-text  { font-size: 12pt; font-weight: bold; text-decoration: underline; margin-top: 2px; }

  /* Body */
  .letter-body { line-height: 1.8; font-size: 11pt; margin-bottom: 30px; white-space: pre-wrap; }

  /* Signature */
  .signature-block { margin-top: 40px; }
  .sig-yours { margin-bottom: 50px; font-size: 11pt; }
  .sig-name  { font-weight: bold; font-size: 11pt; border-top: 1px solid #000; display: inline-block; padding-top: 4px; min-width: 200px; }
  .sig-title { font-size: 10pt; color: #555; }
  .sig-org   { font-size: 10pt; color: #555; }

  /* CC */
  .cc-block { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 10pt; }
  .cc-item  { margin-left: 16px; color: #555; margin-top: 2px; }

  /* Footer */
  .letter-footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 8px; font-size: 8pt; color: #aaa; display: flex; justify-content: space-between; }

  @media print {
    body { font-size: 11pt; }
    .page { padding: 15mm 20mm; max-width: 100%; }
    .priority-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- LETTERHEAD -->
  <div class="letterhead">
    <div>
      <div class="org-logo">${org.logo || '🏗'} ${org.shortName || 'FARIDA PROJECTS'}</div>
      <div style="font-size:9pt;color:#666;margin-top:4px">${org.tagline || 'Excellence in Construction Management'}</div>
    </div>
    <div class="org-details">
      <div class="org-name-full">${org.name || 'Farida Projects Ltd'}</div>
      <div>${org.address || 'Zanzibar, Tanzania'}</div>
      <div>${org.phone || ''}</div>
      <div>${org.email || ''}</div>
      <div>${org.website || ''}</div>
    </div>
  </div>

  <!-- META -->
  <div class="letter-meta">
    <div class="letter-no-row">
      <div class="letter-no">Ref: <strong>${letter.letterNo}</strong> &nbsp;|&nbsp; Date: <strong>${letter.letterDate}</strong></div>
      <div class="priority-badge">${priorityLabel}</div>
    </div>
  </div>

  <!-- TO -->
  <div class="address-block">
    <div class="address-label">To</div>
    <div class="address-name">${letter.toName}</div>
    ${letter.toTitle ? `<div class="address-sub">${letter.toTitle}</div>` : ''}
    ${letter.toOrg   ? `<div class="address-sub">${letter.toOrg}</div>`   : ''}
    ${letter.toEmail ? `<div class="address-sub">${letter.toEmail}</div>` : ''}
  </div>

  <!-- SUBJECT -->
  <div class="subject-line">
    <div class="subject-label">Subject</div>
    <div class="subject-text">${letter.subject}</div>
  </div>

  <!-- SALUTATION & BODY -->
  <div class="letter-body">Dear ${letter.toName.split(' ')[0] || 'Sir/Madam'},

${letter.body}
  </div>

  <!-- SIGNATURE -->
  <div class="signature-block">
    <div class="sig-yours">Yours ${letter.type === 'internal' ? 'sincerely' : 'faithfully'},</div>
    <div class="sig-name">${letter.fromName || ''}</div>
    ${letter.fromTitle ? `<div class="sig-title">${letter.fromTitle}</div>` : ''}
    ${letter.fromOrg   ? `<div class="sig-org">${letter.fromOrg}</div>`   : ''}
  </div>

  ${ccBlock}

  <div class="letter-footer">
    <span>Letter No: ${letter.letterNo}</span>
    <span>Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
    <span>Page 1 of 1</span>
  </div>

</div>
</body>
</html>`;
};

// ─── CONTROLLER METHODS ───────────────────────────────────────────────────────

const listLetters = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { projectId } = req.params;
    const { type, status, priority, search } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (type)      where.type      = type;
    if (status)    where.status    = status;
    if (priority)  where.priority  = priority;
    if (search) {
      where[Op.or] = [
        { subject:  { [Op.like]: `%${search}%` } },
        { letterNo: { [Op.like]: `%${search}%` } },
        { toName:   { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Letter.findAndCountAll({
      where,
      include: [
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'sentBy',    attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit, offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

const getLetter = async (req, res, next) => {
  try {
    const letter = await Letter.findByPk(req.params.letterId, {
      include: [
        { model: User, as: 'createdBy',  attributes: ['id', 'firstName', 'lastName', 'jobTitle'] },
        { model: User, as: 'sentBy',     attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: Letter, as: 'referenceLetter', attributes: ['id', 'letterNo', 'subject'] },
        { model: LetterRead, as: 'reads', include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }] },
      ],
    });
    if (!letter) return errorResponse(res, 'Letter not found', 404);

    // Mark as read
    await LetterRead.findOrCreate({ where: { letterId: letter.id, userId: req.userId } });

    return successResponse(res, { letter });
  } catch (err) { next(err); }
};

const createLetter = async (req, res, next) => {
  try {
    const letterNo = await generateLetterNo();
    const { projectId } = req.params;

    // Auto-fill fromName/fromOrg from current user if not provided
    const user = await User.findByPk(req.userId);
    const fromName  = req.body.fromName  || `${user.firstName} ${user.lastName}`;
    const fromTitle = req.body.fromTitle || user.jobTitle || '';
    const fromOrg   = req.body.fromOrg   || 'Farida Projects Ltd';

    const letter = await Letter.create({
      ...req.body,
      projectId: projectId || req.body.projectId || null,
      letterNo,
      fromName, fromTitle, fromOrg,
      createdById: req.userId,
      status: 'draft',
    });

    await audit({ userId: req.userId, action: 'create_letter', resource: 'letter', resourceId: letter.id, req, projectId: letter.projectId });
    return successResponse(res, { letter }, 'Letter created', 201);
  } catch (err) { next(err); }
};

const updateLetter = async (req, res, next) => {
  try {
    const letter = await Letter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, 'Letter not found', 404);
    if (['sent', 'archived'].includes(letter.status)) {
      return errorResponse(res, 'Cannot edit a letter that has already been sent or archived', 400);
    }

    const old = letter.toJSON();
    await letter.update(req.body);
    await audit({ userId: req.userId, action: 'update_letter', resource: 'letter', resourceId: letter.id, oldValues: old, req });
    return successResponse(res, { letter }, 'Letter updated');
  } catch (err) { next(err); }
};

const deleteLetter = async (req, res, next) => {
  try {
    const letter = await Letter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, 'Letter not found', 404);
    if (['sent'].includes(letter.status)) return errorResponse(res, 'Cannot delete a sent letter', 400);

    await letter.destroy();
    await audit({ userId: req.userId, action: 'delete_letter', resource: 'letter', resourceId: req.params.letterId, req });
    return successResponse(res, null, 'Letter deleted');
  } catch (err) { next(err); }
};

/** Submit for approval */
const submitLetter = async (req, res, next) => {
  try {
    const letter = await Letter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, 'Letter not found', 404);
    if (letter.status !== 'draft') return errorResponse(res, 'Only draft letters can be submitted', 400);

    await letter.update({ status: 'pending_approval' });
    await audit({ userId: req.userId, action: 'submit_letter', resource: 'letter', resourceId: letter.id, req });
    return successResponse(res, { letter }, 'Letter submitted for approval');
  } catch (err) { next(err); }
};

/** Approve letter */
const approveLetter = async (req, res, next) => {
  try {
    const letter = await Letter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, 'Letter not found', 404);
    if (letter.status !== 'pending_approval') return errorResponse(res, 'Letter is not pending approval', 400);

    await letter.update({ status: 'approved', approvedById: req.userId, approvedAt: new Date() });
    await audit({ userId: req.userId, action: 'approve_letter', resource: 'letter', resourceId: letter.id, req });
    return successResponse(res, { letter }, 'Letter approved');
  } catch (err) { next(err); }
};

/** Send letter (marks as sent, records CC recipients) */
const sendLetter = async (req, res, next) => {
  try {
    const letter = await Letter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, 'Letter not found', 404);
    if (!['draft', 'approved'].includes(letter.status)) {
      return errorResponse(res, 'Letter must be in draft or approved state to send', 400);
    }

    // Optional: update CC list at send time
    const updates = {
      status: 'sent',
      sentById: req.userId,
      sentAt: new Date(),
    };
    if (req.body.ccRecipients !== undefined) updates.ccRecipients = req.body.ccRecipients;
    if (req.body.toEmail !== undefined)      updates.toEmail      = req.body.toEmail;

    await letter.update(updates);

    // Mark sender as having read it
    await LetterRead.findOrCreate({ where: { letterId: letter.id, userId: req.userId } });

    await audit({ userId: req.userId, action: 'send_letter', resource: 'letter', resourceId: letter.id, newValues: { toEmail: letter.toEmail, ccCount: (letter.ccRecipients || []).length }, req });
    return successResponse(res, { letter }, 'Letter sent successfully');
  } catch (err) { next(err); }
};

/** Archive letter */
const archiveLetter = async (req, res, next) => {
  try {
    const letter = await Letter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, 'Letter not found', 404);
    await letter.update({ status: 'archived' });
    return successResponse(res, { letter }, 'Letter archived');
  } catch (err) { next(err); }
};

/** Preview letter as HTML — for rendering in the browser */
const previewLetter = async (req, res, next) => {
  try {
    const letter = await Letter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, 'Letter not found', 404);

    const orgConfig = {
      name: 'Farida Projects Ltd',
      shortName: 'FARIDA PROJECTS',
      address: 'P.O Box 1234, Zanzibar, Tanzania',
      phone: '+255 777 000 000',
      email: 'info@farida.co.tz',
      website: 'www.farida.co.tz',
      tagline: 'Excellence in Construction Management',
    };

    const html = buildLetterHTML(letter.toJSON(), orgConfig);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) { next(err); }
};

/**
 * Download letter as PDF.
 * Uses a lightweight HTML → PDF approach with puppeteer if installed,
 * otherwise returns the HTML with PDF-ready print styles and a
 * content-type that triggers browser print-to-PDF.
 */
const downloadLetterPDF = async (req, res, next) => {
  try {
    const letter = await Letter.findByPk(req.params.letterId);
    if (!letter) return errorResponse(res, 'Letter not found', 404);

    const orgConfig = {
      name: 'Farida Projects Ltd',
      shortName: 'FARIDA PROJECTS',
      address: 'P.O Box 1234, Zanzibar, Tanzania',
      phone: '+255 777 000 000',
      email: 'info@farida.co.tz',
      website: 'www.farida.co.tz',
      tagline: 'Excellence in Construction Management',
    };

    const html = buildLetterHTML(letter.toJSON(), orgConfig);

    // Try puppeteer if available
    let puppeteer;
    try { puppeteer = require('puppeteer'); } catch (_) { puppeteer = null; }

    if (puppeteer) {
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${letter.letterNo}.pdf"`);
      return res.send(pdf);
    }

    // Fallback: return HTML with print styles — browser prints to PDF via Ctrl+P
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${letter.letterNo}.html"`);
    return res.send(html + '<script>window.onload = () => window.print();</script>');
  } catch (err) { next(err); }
};

/** My inbox: letters sent to me or CC-ing me */
const getMyLetters = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const user = await User.findByPk(req.userId);
    const email = user.email;
    const name = `${user.firstName} ${user.lastName}`;

    // Letters where I am direct recipient
    const { count, rows } = await Letter.findAndCountAll({
      where: {
        [Op.or]: [
          { toEmail: email },
          { toName: { [Op.like]: `%${name}%` } },
        ],
        status: { [Op.in]: ['sent', 'received', 'approved'] },
      },
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['sentAt', 'DESC']],
      limit, offset,
    });

    // Note: CC filtering via JSON field requires app-level filter
    // For better performance in production, CC should be in a separate table
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

/** Letter stats */
const getLetterStats = async (req, res, next) => {
  try {
    const where = {};
    if (req.params.projectId) where.projectId = req.params.projectId;

    const [total, sent, drafts, pendingApproval, incoming, outgoing] = await Promise.all([
      Letter.count({ where }),
      Letter.count({ where: { ...where, status: 'sent' } }),
      Letter.count({ where: { ...where, status: 'draft' } }),
      Letter.count({ where: { ...where, status: 'pending_approval' } }),
      Letter.count({ where: { ...where, type: 'incoming' } }),
      Letter.count({ where: { ...where, type: 'outgoing' } }),
    ]);

    return successResponse(res, { total, sent, drafts, pendingApproval, incoming, outgoing });
  } catch (err) { next(err); }
};

module.exports = {
  listLetters, getLetter, createLetter, updateLetter, deleteLetter,
  submitLetter, approveLetter, sendLetter, archiveLetter,
  previewLetter, downloadLetterPDF, getMyLetters, getLetterStats,
};
