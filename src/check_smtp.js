/**
 * Diagnostic: shows exactly what SMTP_* values the backend loaded from .env
 * (password masked) and tries to authenticate. Run on the server:
 *
 *   cd ~/backend && node src/check_smtp.js
 *
 * Nothing is sent — it only opens the connection and logs in.
 */
require("dotenv").config();
const nodemailer = require("nodemailer");

const pass = process.env.SMTP_PASS || "";
const mask =
  pass.length === 0
    ? "(empty!)"
    : `${pass[0]}${"*".repeat(Math.max(0, pass.length - 2))}${pass[pass.length - 1]} (length ${pass.length})`;

console.log("Loaded SMTP config:");
console.log("  SMTP_HOST   =", JSON.stringify(process.env.SMTP_HOST));
console.log("  SMTP_PORT   =", JSON.stringify(process.env.SMTP_PORT));
console.log("  SMTP_SECURE =", JSON.stringify(process.env.SMTP_SECURE));
console.log("  SMTP_USER   =", JSON.stringify(process.env.SMTP_USER));
console.log("  SMTP_PASS   =", mask);
console.log("  password contains '#'   :", pass.includes("#"));
console.log("  password has leading/trailing space:", pass !== pass.trim());
console.log("  SMTP_TLS_REJECT_UNAUTHORIZED =", JSON.stringify(process.env.SMTP_TLS_REJECT_UNAUTHORIZED));
console.log("");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass },
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    ...(process.env.SMTP_TLS_SERVERNAME ? { servername: process.env.SMTP_TLS_SERVERNAME } : {}),
  },
  logger: true,
  debug: true,
});

transporter.verify((err) => {
  if (err) {
    console.error("\n❌ verify failed:", err.message);
    process.exit(1);
  }
  console.log("\n✅ SMTP auth OK — the backend can send mail with these settings.");
  process.exit(0);
});
