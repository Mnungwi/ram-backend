/**
 * seed-expense-categories.js
 * ══════════════════════════════════════════════════════════════
 * Endesha na: node seed-expense-categories.js
 * (weka faili hii kwenye root ya backend yako, karibu na server.js)
 * ══════════════════════════════════════════════════════════════
 */

const { ExpenseCategory } = require("../models/finance.model"); // rekebisha path kama tofauti
const { sequelize } = require("../config/database"); // rekebisha path kama tofauti

const DEFAULT_CATEGORIES = [
  "Transport",
  "Fuel",
  "Office Supplies",
  "Utilities",
  "Meals & Accommodation",
  "Site Security",
  "Equipment Rental",
  "Maintenance & Repairs",
  "Communication",
  "Casual Labour",
  "Miscellaneous",
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    let created = 0;
    let skipped = 0;

    for (const name of DEFAULT_CATEGORIES) {
      const [category, wasCreated] = await ExpenseCategory.findOrCreate({
        where: { name },
        defaults: { name, isActive: true },
      });

      if (wasCreated) {
        created++;
        console.log(`  + Created: ${name}`);
      } else {
        skipped++;
        console.log(`  · Skipped (already exists): ${name}`);
      }
    }

    console.log(`\n✅ Seed complete — ${created} created, ${skipped} skipped.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
