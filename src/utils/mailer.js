// ══════════════════════════════════════════════════════════════
// utils/mailer.js
// Weka faili hii kwenye folder ya utils/
//
// npm install nodemailer
//
// Ongeza kwenye .env yako:
//   SMTP_HOST=smtp.gmail.com          (mfano — badilisha na provider wako)
//   SMTP_PORT=587
//   SMTP_SECURE=false                 (true kama port ni 465)
//   SMTP_USER=your-email@gmail.com
//   SMTP_PASS=your-app-password       (Gmail: tumia "App Password", si password ya kawaida)
//   SMTP_FROM_NAME=RAM Project Management
//   SMTP_FROM_EMAIL=your-email@gmail.com
// ══════════════════════════════════════════════════════════════

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Shared cPanel hosting (Namecheap, etc.) usually presents a TLS cert
    // for the physical server (e.g. *.web-hosting.com), NOT for
    // mail.<yourdomain>, so Node aborts with a "hostname does not match
    // certificate's altnames" error. Best fix: point SMTP_HOST at the name
    // the cert actually covers (your cPanel "Server Information" hostname).
    // Quick fix: SMTP_TLS_REJECT_UNAUTHORIZED=false to accept the mismatch.
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    ...(process.env.SMTP_TLS_SERVERNAME
      ? { servername: process.env.SMTP_TLS_SERVERNAME }
      : {}),
  },
});

// Kagua connection ipo sahihi wakati wa boot (hiari lakini husaidia debugging)
transporter.verify((err) => {
  if (err) {
    console.error("❌ mailer.js: SMTP connection IMESHINDWA —", err.message);
  } else {
    console.log("✅ mailer.js: SMTP connection tayari, iko sahihi");
  }
});

/**
 * Tuma email ya barua (Letter) kwa recipient + CC
 * @param {Object} opts
 * @param {string} opts.to - email ya recipient
 * @param {string[]} opts.cc - orodha ya emails za CC
 * @param {string} opts.subject
 * @param {string} opts.html - HTML content ya barua
 * @param {Array} [opts.attachments] - [{ filename, path }]
 */
// From-name precedence: SMTP_FROM_NAME env override → DB brand name
// (admin Appearance / site settings) → neutral literal. Kept out of the
// hardcoded-per-tenant business.
async function resolveFromName() {
  if (process.env.SMTP_FROM_NAME) return process.env.SMTP_FROM_NAME;
  try {
    const { getBrandName } = require("./branding");
    return await getBrandName();
  } catch (e) {
    return "United Ram Construction";
  }
}

async function sendLetterEmail({ to, cc, subject, html, attachments }) {
  const fromName = await resolveFromName();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    cc: cc && cc.length ? cc.join(", ") : undefined,
    subject,
    html,
    attachments: attachments || [],
  });

  return info;
}

/**
 * Tuma email ya kawaida (generic) — inatumika kwa password reset, OTP, n.k.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 */
async function sendMail({ to, subject, html }) {
  const fromName = await resolveFromName();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });

  return info;
}

module.exports = { transporter, sendLetterEmail, sendMail };
