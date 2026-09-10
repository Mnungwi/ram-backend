// ══════════════════════════════════════════════════════════════
// utils/sms.js — send a short SMS (used for OTP login codes alongside email)
//
// Configure in .env — pick ONE provider:
//
//   SMS_PROVIDER=beem            # or: twilio
//   SMS_DEFAULT_COUNTRY_CODE=255 # digits only, no '+', for local "07…" numbers
//   SMS_SENDER_ID=UNITEDRAM      # your approved alphanumeric sender / shortcode
//
//   # Beem Africa (https://beem.africa) — popular in Tanzania:
//   BEEM_API_KEY=xxxxxxxx
//   BEEM_SECRET_KEY=xxxxxxxx
//
//   # Twilio (https://twilio.com):
//   TWILIO_ACCOUNT_SID=ACxxxxxxxx
//   TWILIO_AUTH_TOKEN=xxxxxxxx
//   TWILIO_FROM=+1xxxxxxxxxx     # your Twilio number (overrides SMS_SENDER_ID)
//
// If nothing is configured, sendSms() just logs and returns { ok:false } —
// it never throws, so OTP-by-email still works on its own.
// ══════════════════════════════════════════════════════════════

const PROVIDER = (process.env.SMS_PROVIDER || '').toLowerCase();
const DEFAULT_CC = (process.env.SMS_DEFAULT_COUNTRY_CODE || '255').replace(/\D/g, '');
const SENDER_ID = process.env.SMS_SENDER_ID || 'RAM';

/**
 * Normalise a phone number to international digits, no leading '+'.
 * "0712 345 678" -> "255712345678"; "+255712345678" -> "255712345678".
 */
function normalisePhone(raw) {
  if (!raw) return null;
  let p = String(raw).trim().replace(/[\s\-()]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('0')) p = DEFAULT_CC + p.slice(1);
  p = p.replace(/\D/g, '');
  return p.length >= 9 ? p : null;
}

async function sendViaBeem(phone, message) {
  const key = process.env.BEEM_API_KEY;
  const secret = process.env.BEEM_SECRET_KEY;
  if (!key || !secret) return { ok: false, error: 'BEEM_API_KEY / BEEM_SECRET_KEY not set' };

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch('https://apisms.beem.africa/v1/send', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_addr: SENDER_ID,
      encoding: 0,
      message,
      recipients: [{ recipient_id: 1, dest_addr: phone }],
    }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: `Beem HTTP ${res.status}: ${text}` };
  return { ok: true, provider: 'beem', raw: text };
}

async function sendViaTwilio(phone, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM || SENDER_ID;
  if (!sid || !token) return { ok: false, error: 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set' };

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const body = new URLSearchParams({ To: `+${phone}`, From: from, Body: message });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: `Twilio HTTP ${res.status}: ${text}` };
  return { ok: true, provider: 'twilio', raw: text };
}

/**
 * Send one SMS. Returns { ok, provider?, error? } and never throws.
 * @param {string} to    recipient phone (any local/international format)
 * @param {string} message
 */
async function sendSms(to, message) {
  const phone = normalisePhone(to);
  if (!phone) {
    return { ok: false, error: `No usable phone number ("${to}")` };
  }
  if (!PROVIDER) {
    console.warn('sms.js: SMS_PROVIDER not set — skipping SMS to', phone);
    return { ok: false, error: 'SMS_PROVIDER not configured' };
  }

  try {
    let result;
    if (PROVIDER === 'beem') result = await sendViaBeem(phone, message);
    else if (PROVIDER === 'twilio') result = await sendViaTwilio(phone, message);
    else result = { ok: false, error: `Unknown SMS_PROVIDER "${PROVIDER}"` };

    if (!result.ok) console.error('sms.js: send failed —', result.error);
    return result;
  } catch (err) {
    console.error('sms.js: send threw —', err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendSms, normalisePhone };
