// ══════════════════════════════════════════════════════════════
// seed_site_fund_demo.js
// Demo data for the new "Site Fund" feature so it can be seen in action:
//   - assigns a storekeeper to the first project (if none assigned yet)
//   - creates 3 "money received" disbursements to that storekeeper
//   - creates a handful of expenses (Materials/Labour/Transport) attributed
//     to that storekeeper, so the balance + spending breakdown have data
//   - creates 2 sample Payments so the Summary Report's "Payments" section
//     isn't empty either
// NOT idempotent — running it twice adds a second batch of demo rows.
// Run with: node seed_site_fund_demo.js
// ══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { sequelize } = require('./src/config/database');
const {
  Project,
  User,
  ProjectStorekeeper,
  SiteFundDisbursement,
  Expense,
  ExpenseCategory,
  Payment,
} = require('./src/models/index');
const { Technician } = require('./src/models/technician.model');
const { Op } = require('sequelize');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

async function run() {
  await sequelize.authenticate();
  console.log('🌱 Seeding Site Fund demo data...\n');

  const project = await Project.findOne({ order: [['createdAt', 'ASC']] });
  if (!project) {
    console.error('❌ No projects found — create a project first, then re-run this script.');
    process.exit(1);
  }
  console.log(`📁 Using project: ${project.name} (${project.id})`);

  // ── 1. Make sure this project has an active storekeeper ──────────────────
  let assignment = await ProjectStorekeeper.findOne({
    where: { projectId: project.id, isActive: true },
    include: [{ model: User, as: 'user' }],
  });

  if (!assignment) {
    const candidate = await User.findOne({ where: { isActive: true } });
    if (!candidate) {
      console.error('❌ No active users found to assign as storekeeper.');
      process.exit(1);
    }
    assignment = await ProjectStorekeeper.create({
      projectId: project.id,
      userId: candidate.id,
      notes: 'Auto-assigned by seed_site_fund_demo.js',
    });
    assignment.user = candidate;
    console.log(`👷 Assigned ${candidate.firstName} ${candidate.lastName} as storekeeper on this project.`);
  } else {
    console.log(`👷 Using existing storekeeper: ${assignment.user.firstName} ${assignment.user.lastName}`);
  }
  const storekeeperUserId = assignment.userId;

  // Whoever created the project (or any admin) "disburses" the funds
  const disburser = (await User.findOne({ where: { id: { [Op.ne]: storekeeperUserId } } })) || assignment.user;

  // ── 2. Expense categories (Materials / Labour / Transport) ───────────────
  const categoryNames = ['Materials', 'Labour', 'Transport & Fuel'];
  const categories = {};
  for (const name of categoryNames) {
    const [cat] = await ExpenseCategory.findOrCreate({ where: { name }, defaults: { name } });
    categories[name] = cat;
  }
  console.log('🏷️  Expense categories ready:', categoryNames.join(', '));

  // ── 3. Money Received (disbursements) ─────────────────────────────────────
  const disbursements = [
    { amount: 1500000, date: daysAgo(20), method: 'cash', referenceNo: 'SF-DEMO-001', notes: 'Initial site float for the month' },
    { amount: 800000, date: daysAgo(10), method: 'bank_transfer', referenceNo: 'SF-DEMO-002', notes: 'Top-up for cement purchase' },
    { amount: 500000, date: daysAgo(3), method: 'mobile_money', referenceNo: 'SF-DEMO-003', notes: 'Top-up for labour wages' },
  ];
  for (const d of disbursements) {
    await SiteFundDisbursement.create({
      projectId: project.id,
      storekeeperUserId,
      disbursedById: disburser.id,
      ...d,
    });
  }
  const totalReceived = disbursements.reduce((s, d) => s + d.amount, 0);
  console.log(`💰 Created ${disbursements.length} disbursements — total received: ${totalReceived.toLocaleString()} TZS`);

  // ── 4. Expenses (spent by the storekeeper) ────────────────────────────────
  const expenses = [
    { description: '50 bags of cement', amount: 450000, category: 'Materials', date: daysAgo(18) },
    { description: 'Sand and aggregates delivery', amount: 180000, category: 'Materials', date: daysAgo(15) },
    { description: 'Iron sheets (roofing)', amount: 320000, category: 'Materials', date: daysAgo(9) },
    { description: 'Casual labourers - foundation work', amount: 250000, category: 'Labour', date: daysAgo(14) },
    { description: 'Casual labourers - block laying', amount: 200000, category: 'Labour', date: daysAgo(7) },
    { description: 'Fuel for site generator', amount: 90000, category: 'Transport & Fuel', date: daysAgo(5) },
    { description: 'Transport of materials to site', amount: 60000, category: 'Transport & Fuel', date: daysAgo(2) },
  ];
  for (const e of expenses) {
    await Expense.create({
      projectId: project.id,
      categoryId: categories[e.category].id,
      description: e.description,
      amount: e.amount,
      date: e.date,
      createdById: storekeeperUserId,
    });
  }
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  console.log(`🧾 Created ${expenses.length} expenses — total spent: ${totalSpent.toLocaleString()} TZS`);
  console.log(`📊 Balance: ${(totalReceived - totalSpent).toLocaleString()} TZS`);

  // ── 5. A couple of Payments so the Summary Report's Payments section has data ──
  const technician = await Technician.findOne();
  const payments = [
    { description: 'Contractor progress payment', amount: 2500000, date: daysAgo(12), status: 'Paid' },
    { description: 'Supplier invoice settlement', amount: 950000, date: daysAgo(4), status: 'Open' },
  ];
  for (const p of payments) {
    await Payment.create({
      projectId: project.id,
      paidToId: technician ? technician.id : null,
      createdById: disburser.id,
      ...p,
    });
  }
  console.log(`💳 Created ${payments.length} sample payments.`);

  console.log('\n✅ Done! Open Finance → Site Fund on this project in the admin panel to see it live:');
  console.log(`   Project: ${project.name}`);
  console.log(`   Storekeeper: ${assignment.user.firstName} ${assignment.user.lastName} (${assignment.user.email})`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
