// ══════════════════════════════════════════════════════════════
// seedFromOldDatabase.js
//
// Kwa nini script hii ipo:
// Database ya "live" (united_ram, MySQL 8.4.7) ilikuwa na project 1 tu na
// barua rasmi 1 tu, wakati database ya zamani (MySQL 8.2.0, iliyoko D:)
// ilikuwa na projects 24 na barua 15 — data halisi ya kazi ambayo
// haikuwahi kuhamishwa wakati WAMP ilipobadilishwa toleo/drive.
//
// Script hii inasoma moja kwa moja kutoka database "united_ram_old"
// (nakala ya database ya zamani iliyoshaingizwa kwenye SERVER HII HII kwa
// mysqldump — angalia backend/README kama huna hiyo database bado) na
// kuingiza rekodi zinazokosekana kwenye "united_ram" ya sasa.
//
// SIO ya-Sequelize-model (baadhi ya majina ya jedwali/column yamebadilika
// kati ya matoleo mawili — km. "letters" ya zamani sasa ni
// "official_letters"), kwa hiyo tunatumia raw SQL yenye ramani (mapping)
// ya wazi ya client/user IDs (ambazo zilibadilika baada ya kila upya-seed).
//
// INAWEZA KUENDESHWA MARA NYINGI KWA USALAMA (idempotent) — kila jedwali
// linakagua kwanza kama rekodi tayari ipo (kwa projectCode/requisitionNo/
// invoiceNo/letterNo/jina) kabla ya kuingiza.
//
// Endesha: node src/seeders/seedFromOldDatabase.js
// ══════════════════════════════════════════════════════════════

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const { sequelize } = require("../config/database");

const OLD_DB = process.env.OLD_DB_NAME || "united_ram_old";
const C = "COLLATE utf8mb4_unicode_ci"; // old dump's collation — new server defaults to utf8mb4_0900_ai_ci

async function ensureOldDbExists() {
  const [rows] = await sequelize.query(
    "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?",
    { replacements: [OLD_DB] },
  );
  if (rows.length === 0) {
    console.error(
      `❌ Database "${OLD_DB}" haipo kwenye server hii.\n` +
        `   Kwanza mysqldump database ya zamani (mysql8.2.0) kisha uiingize hapa kwa jina "${OLD_DB}", au weka\n` +
        `   OLD_DB_NAME=jina_lako kwenye .env kama umeiita tofauti.`,
    );
    process.exit(1);
  }
}

// ── ID remap helpers ──────────────────────────────────────────────────────
// Clients/users zilipata UUID mpya kila zilipo-seed upya, hivyo tunalinganisha
// kwa jina (clients) au sehemu ya kwanza ya email kabla ya '@' (users),
// tukipendelea akaunti ya @ram.co.tz (chapa ya sasa) kama ipo.

async function buildClientIdMap() {
  const [rows] = await sequelize.query(`
    SELECT o.id AS oldId, l.id AS newId
    FROM ${OLD_DB}.clients o
    JOIN clients l ON o.name ${C} = l.name ${C}
  `);
  const map = {};
  rows.forEach((r) => (map[r.oldId] = r.newId));
  return map;
}

async function buildUserIdMap() {
  const [oldUsers] = await sequelize.query(`SELECT id, email FROM ${OLD_DB}.users`);
  const map = {};
  for (const u of oldUsers) {
    const localPart = String(u.email).split("@")[0];
    const [preferred] = await sequelize.query(
      `SELECT id FROM users WHERE email LIKE ? AND email LIKE '%@ram.co.tz' LIMIT 1`,
      { replacements: [`${localPart}@%`] },
    );
    if (preferred.length) {
      map[u.id] = preferred[0].id;
      continue;
    }
    const [exact] = await sequelize.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, {
      replacements: [u.email],
    });
    if (exact.length) map[u.id] = exact[0].id;
  }
  return map;
}

// ── Migrators ──────────────────────────────────────────────────────────────

async function migrateProjects(clientMap, userMap) {
  const [oldRows] = await sequelize.query(`
    SELECT o.* FROM ${OLD_DB}.projects o
    WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.projectCode ${C} = o.projectCode ${C})
  `);
  let inserted = 0;
  for (const p of oldRows) {
    try {
      await sequelize.query(
        `INSERT INTO projects
          (id, projectCode, name, description, image, status, startDate, endDate,
           clientId, projectManagerId, location, totalBudget, currency, progress, createdById,
           showOnHomePage, visibility, displayOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            p.id, p.projectCode, p.name, p.description, p.image, p.status, p.startDate, p.endDate,
            (p.clientId && clientMap[p.clientId]) || null,
            (p.projectManagerId && userMap[p.projectManagerId]) || null,
            p.location, p.totalBudget, p.currency, p.progress,
            (p.createdById && userMap[p.createdById]) || null,
            p.showOnHomePage, p.visibility, p.displayOrder, p.createdAt, p.updatedAt,
          ],
        },
      );
      inserted++;
    } catch (err) {
      console.warn(`  ⚠️  Project "${p.name}" (${p.projectCode}) imerukwa: ${err.message}`);
    }
  }
  console.log(`  ✅ Projects: ${inserted}/${oldRows.length} zimeingizwa`);
}

async function migrateSuppliers() {
  const [oldRows] = await sequelize.query(`
    SELECT o.* FROM ${OLD_DB}.suppliers o
    WHERE NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.name ${C} = o.name ${C})
  `);
  let inserted = 0;
  for (const s of oldRows) {
    try {
      await sequelize.query(
        `INSERT INTO suppliers (id, name, email, phone, address, category, taxNumber, bankDetails, isActive, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        { replacements: [s.id, s.name, s.email, s.phone, s.address, s.category, s.taxNumber, s.bankDetails, s.isActive, s.notes, s.createdAt, s.updatedAt] },
      );
      inserted++;
    } catch (err) {
      console.warn(`  ⚠️  Supplier "${s.name}" imerukwa: ${err.message}`);
    }
  }
  console.log(`  ✅ Suppliers: ${inserted}/${oldRows.length} zimeingizwa`);
}

async function migrateRequisitions(userMap) {
  const [oldRows] = await sequelize.query(`
    SELECT o.* FROM ${OLD_DB}.requisitions o
    WHERE NOT EXISTS (SELECT 1 FROM requisitions r WHERE r.requisitionNo ${C} = o.requisitionNo ${C})
      AND EXISTS (SELECT 1 FROM projects p WHERE p.id = o.projectId)
  `);
  let inserted = 0;
  for (const r of oldRows) {
    try {
      await sequelize.query(
        `INSERT INTO requisitions
          (id, requisitionNo, projectId, siteLocation, requestedById, designation, date, status, notes,
           submittedAt, reviewedAt, reviewedById, approvedAt, approvedById, issuedAt, issuedById,
           rejectedAt, rejectedById, rejectionReason, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            r.id, r.requisitionNo, r.projectId, r.siteLocation,
            (r.requestedById && userMap[r.requestedById]) || null,
            r.designation, r.date, r.status, r.notes,
            r.submittedAt, r.reviewedAt, (r.reviewedById && userMap[r.reviewedById]) || null,
            r.approvedAt, (r.approvedById && userMap[r.approvedById]) || null,
            r.issuedAt, (r.issuedById && userMap[r.issuedById]) || null,
            r.rejectedAt, (r.rejectedById && userMap[r.rejectedById]) || null,
            r.rejectionReason, r.createdAt, r.updatedAt,
          ],
        },
      );
      inserted++;
    } catch (err) {
      console.warn(`  ⚠️  Requisition "${r.requisitionNo}" imerukwa: ${err.message}`);
    }
  }
  console.log(`  ✅ Requisitions: ${inserted}/${oldRows.length} zimeingizwa (requestedById ni lazima iwepo — moja iliyokuwa na requisitionNo inayofanana na iliyopo tayari iliruka kimyakimya)`);
}

async function migrateInvoices(userMap) {
  const [oldRows] = await sequelize.query(`
    SELECT o.* FROM ${OLD_DB}.invoices o
    WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.invoiceNo ${C} = o.invoiceNo ${C})
      AND EXISTS (SELECT 1 FROM projects p WHERE p.id = o.projectId)
  `);
  let inserted = 0;
  for (const inv of oldRows) {
    try {
      // activityId/lpoId zimeachwa NULL kwa makusudi — miundo ya "activities"/
      // "local_purchase_orders" imebadilika sana kati ya matoleo mawili
      // kiasi cha kutokuwa salama kulinganisha; ankara yenyewe bado inaingia.
      await sequelize.query(
        `INSERT INTO invoices
          (id, projectId, activityId, supplierId, lpoId, invoiceNo, description, amount, currency,
           date, dueDate, status, createdById, approvedById, approvedAt, paidById, paidAt, notes,
           createdAt, updatedAt)
         VALUES (?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            inv.id, inv.projectId, inv.invoiceNo, inv.description, inv.amount, inv.currency,
            inv.date, inv.dueDate, inv.status,
            (inv.createdById && userMap[inv.createdById]) || null,
            (inv.approvedById && userMap[inv.approvedById]) || null,
            inv.approvedAt,
            (inv.paidById && userMap[inv.paidById]) || null,
            inv.paidAt, inv.notes, inv.createdAt, inv.updatedAt,
          ],
        },
      );
      inserted++;
    } catch (err) {
      console.warn(`  ⚠️  Invoice "${inv.invoiceNo}" imerukwa: ${err.message}`);
    }
  }
  console.log(`  ✅ Invoices: ${inserted}/${oldRows.length} zimeingizwa (bila kiungo cha activity/LPO — muundo wake umebadilika sana kati ya matoleo)`);
}

async function migrateOfficialLetters(userMap) {
  // Database ya zamani ina JEDWALI MBILI za barua: "letters" (mfumo wa kale,
  // tupu - rows 0) na "official_letters" (mfumo uliotumika mwisho, rows 15 —
  // muundo wake unafanana sana na wa sasa). Tunatumia "official_letters".
  const [oldRows] = await sequelize.query(`
    SELECT o.* FROM ${OLD_DB}.official_letters o
    WHERE NOT EXISTS (SELECT 1 FROM official_letters ol WHERE ol.id = o.id)
      AND (o.letterNo IS NULL OR NOT EXISTS (
            SELECT 1 FROM official_letters ol2 WHERE ol2.letterNo ${C} = o.letterNo ${C}
          ))
  `);

  // mysql2 huchambua (parse) JSON columns kuwa JS objects/arrays moja kwa moja;
  // lazima tuzi-stringify upya kabla ya kuziweka kwenye INSERT mpya.
  const toJson = (v) => (v === null || v === undefined ? null : typeof v === "string" ? v : JSON.stringify(v));

  let inserted = 0;
  for (const l of oldRows) {
    try {
      const projectExists = l.projectId
        ? (await sequelize.query(`SELECT 1 FROM projects WHERE id = ? LIMIT 1`, { replacements: [l.projectId] }))[0].length > 0
        : false;
      await sequelize.query(
        `INSERT INTO official_letters
          (id, projectId, senderId, recipientId, letterNo, subject, subTitle, body,
           senderName, senderPosition, senderOrganization, senderEmail,
           recipientName, recipientPosition, recipientOrganization, recipientEmail,
           ccList, attachmentFileName, attachmentFilePath, attachments,
           letterDate, priority, type, status,
           createdById, approvedById, approvedAt, sentById, sentAt,
           emailMessageId, emailError, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            l.id, projectExists ? l.projectId : null,
            (l.senderId && userMap[l.senderId]) || null,
            (l.recipientId && userMap[l.recipientId]) || null,
            l.letterNo, l.subject, l.subTitle || null, l.body,
            l.senderName, l.senderPosition, l.senderOrganization, l.senderEmail,
            l.recipientName, l.recipientPosition, l.recipientOrganization, l.recipientEmail,
            toJson(l.ccList), l.attachmentFileName, l.attachmentFilePath, toJson(l.attachments),
            l.letterDate, l.priority, l.type, l.status,
            (l.createdById && userMap[l.createdById]) || null,
            (l.approvedById && userMap[l.approvedById]) || null,
            l.approvedAt,
            (l.sentById && userMap[l.sentById]) || null,
            l.sentAt, l.emailMessageId, l.emailError, l.createdAt, l.updatedAt,
          ],
        },
      );
      inserted++;
    } catch (err) {
      console.warn(`  ⚠️  Letter "${l.letterNo || l.id}" imerukwa: ${err.message}`);
    }
  }
  console.log(`  ✅ Letters (official_letters): ${inserted}/${oldRows.length} zimeingizwa`);
}

async function run() {
  console.log(`🌱 Kuhamisha data kutoka "${OLD_DB}" kuingia "${sequelize.config.database}"...\n`);
  await sequelize.authenticate();
  await ensureOldDbExists();

  console.log("🔗 Kuchora ramani ya clients/users (majina/email yanaweza kuwa na ID mpya)...");
  const clientMap = await buildClientIdMap();
  const userMap = await buildUserIdMap();
  console.log(`   clients zilizolinganishwa: ${Object.keys(clientMap).length}, users: ${Object.keys(userMap).length}\n`);

  console.log("📁 Projects...");
  await migrateProjects(clientMap, userMap);

  console.log("🏢 Suppliers...");
  await migrateSuppliers();

  console.log("📝 Requisitions...");
  await migrateRequisitions(userMap);

  console.log("🧾 Invoices...");
  await migrateInvoices(userMap);

  console.log("✉️  Letters...");
  await migrateOfficialLetters(userMap);

  console.log("\n🎉 Imekamilika. Kagua rekodi mpya kwenye admin panel (Projects, Requisitions, Finance > Invoices, Letters).");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Imeshindikana:", err);
  process.exit(1);
});
