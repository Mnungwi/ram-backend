/**
 * One-off: normalise every users.email the SAME way the login route does,
 * so users that were created (via the admin UI) with mixed-case or
 * whitespace in their email can actually log in.
 *
 * Run once on the server:
 *   cd ~/backend && node src/normalize_emails.js
 *
 * Safe to run more than once. It skips (and reports) any row whose
 * normalised address would collide with another existing user.
 */
const validator = require('validator');
const { sequelize } = require('./config/database');
const { User } = require('./models/index');

const normalise = (raw) => {
  const trimmed = String(raw || '').trim();
  return validator.normalizeEmail(trimmed) || trimmed.toLowerCase();
};

(async () => {
  try {
    const users = await User.unscoped().findAll({ attributes: ['id', 'email'] });
    const byNormalised = new Map();
    users.forEach((u) => {
      const n = normalise(u.email);
      if (!byNormalised.has(n)) byNormalised.set(n, []);
      byNormalised.get(n).push(u);
    });

    let changed = 0;
    let skipped = 0;
    for (const u of users) {
      const n = normalise(u.email);
      if (n === u.email) continue;

      const group = byNormalised.get(n) || [];
      const otherOwner = group.find((g) => g.id !== u.id && g.email === n);
      if (otherOwner) {
        console.warn(`SKIP  ${u.email}  ->  ${n}  (already taken by user ${otherOwner.id})`);
        skipped++;
        continue;
      }
      await User.update({ email: n }, { where: { id: u.id } });
      console.log(`FIXED ${u.email}  ->  ${n}`);
      changed++;
    }

    console.log(`\nDone. ${changed} updated, ${skipped} skipped, ${users.length} total.`);
    process.exit(0);
  } catch (err) {
    console.error('normalize_emails failed:', err.message);
    process.exit(1);
  }
})();
