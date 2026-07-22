require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, User, Project, ProjectPhase, Activity, Contract, PurchaseOrder,
  Supplier, Invoice, Payment, Expense, BudgetItem, Report, Document, TeamMember,Client } = require('../models/index');

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const d = (str) => str; // DATEONLY expects 'YYYY-MM-DD' strings directly

const seedDemoData = async () => {
  try {
    console.log("🌱 Starting demo data seed (Zanzibar Airport Expansion)...");
    await sequelize.authenticate();

    // ── 0. Fetch users created by the auth/role seed ────
    const users = await User.unscoped().findAll();
    const byEmail = (email) => users.find((u) => u.email === email);

    const admin = byEmail("admin@farida.co.tz"); // Project Manager - Ali Mohamed
    const hassan = byEmail("hassan@farida.co.tz"); // Site Engineer
    const salim = byEmail("salim@farida.co.tz"); // MEP Engineer
    const fatma = byEmail("fatma@farida.co.tz"); // Finance Officer
    const msaid = byEmail("msaid@farida.co.tz"); // Quantity Surveyor

    if (!admin) {
      throw new Error(
        "Run the auth/role seed first (seed.js) — admin@farida.co.tz not found.",
      );
    }
    // ═══════════════════════════════════════════════════
    // 0.5 CLIENTS
    // ═══════════════════════════════════════════════════
    console.log("🤝 Seeding clients...");
    const [zanzibarGov] = await Client.findOrCreate({
      where: { name: "Zanzibar Government" },
      defaults: {
        name: "Zanzibar Government",
        contactPerson: "Hon. Said Ali Mbarouk",
        email: "info@zanzibargov.go.tz",
        phone: "+255 24 223 0000",
        company: "Revolutionary Government of Zanzibar",
        address: "Mji Mkongwe, Zanzibar",
        city: "Zanzibar City",
        country: "Tanzania",
        isActive: true,
        createdById: admin.id,
      },
    });

    await Client.findOrCreate({
      where: { name: "Zanzibar Water Authority" },
      defaults: {
        name: "Zanzibar Water Authority",
        contactPerson: "Eng. Khamis Suleiman",
        email: "info@zawa.go.tz",
        phone: "+255 24 223 1111",
        company: "ZAWA",
        city: "Zanzibar City",
        country: "Tanzania",
        isActive: true,
        createdById: admin.id,
      },
    });

    await Client.findOrCreate({
      where: { name: "Ministry of Infrastructure" },
      defaults: {
        name: "Ministry of Infrastructure",
        contactPerson: "Eng. Fatma Ramadhan",
        email: "info@moi.go.tz",
        phone: "+255 24 223 2222",
        city: "Zanzibar City",
        country: "Tanzania",
        isActive: true,
        createdById: admin.id,
      },
    });
    console.log("  ✅ 3 clients seeded");
    // ═══════════════════════════════════════════════════
    // 1. PROJECT
    // ═══════════════════════════════════════════════════
    console.log("🏗️  Seeding project...");
    const [project] = await Project.findOrCreate({
      where: { projectCode: "ZAE-2026-001" },
      defaults: {
        projectCode: "ZAE-2026-001",
        name: "Zanzibar Airport Expansion",
        description:
          "Expansion of Zanzibar International Airport including new terminal building, runway extension, and supporting infrastructure.",
        image:
          "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&h=150&fit=crop",
        status: "active",
        startDate: d("2026-01-12"),
        endDate: d("2026-12-30"),
        clientId: zanzibarGov.id,
        location: "Zanzibar, Tanzania",
        totalBudget: 450000000,
        currency: "TZS",
        progress: 62,
        createdById: admin.id,
      },
    });
    console.log(`  ✅ Project: ${project.name} (${project.id})`);

    // ═══════════════════════════════════════════════════
    // 2. PROJECT PHASES
    // ═══════════════════════════════════════════════════
    console.log("📐 Seeding phases...");
    const phaseDefs = [
      {
        name: "Phase 1: Pre-Construction & Mobilization",
        order: 1,
        status: "active",
        startDate: d("2026-01-12"),
        endDate: d("2026-03-31"),
        progress: 78,
      },
      {
        name: "Phase 2: Construction Works",
        order: 2,
        status: "active",
        startDate: d("2026-04-01"),
        endDate: d("2026-09-30"),
        progress: 42,
      },
      {
        name: "Phase 3: Finishing & Installation",
        order: 3,
        status: "pending",
        startDate: d("2026-10-01"),
        endDate: d("2026-11-30"),
        progress: 8,
      },
      {
        name: "Phase 4: Testing, Commissioning & Handover",
        order: 4,
        status: "pending",
        startDate: d("2026-12-01"),
        endDate: d("2026-12-30"),
        progress: 0,
      },
    ];
    const phases = {};
    for (const p of phaseDefs) {
      const [phase] = await ProjectPhase.findOrCreate({
        where: { projectId: project.id, name: p.name },
        defaults: { ...p, projectId: project.id },
      });
      phases[p.order] = phase;
    }
    console.log(`  ✅ ${phaseDefs.length} phases seeded`);

    // ═══════════════════════════════════════════════════
    // 3. ACTIVITIES
    // ═══════════════════════════════════════════════════
    console.log("📋 Seeding activities...");
    const activityDefs = [
      {
        phase: 1,
        name: "Site Mobilization",
        category: "site_works",
        status: "completed",
        progress: 100,
        startDate: "2026-01-12",
        dueDate: "2026-01-25",
        completedDate: "2026-01-24",
        notes: "Initial site setup and mobilization of resources.",
      },
      {
        phase: 1,
        name: "Site Survey & Topography",
        category: "site_works",
        status: "completed",
        progress: 100,
        startDate: "2026-01-15",
        dueDate: "2026-02-05",
        completedDate: "2026-02-04",
      },
      {
        phase: 1,
        name: "Environmental Impact Assessment",
        category: "other",
        status: "completed",
        progress: 100,
        startDate: "2026-01-20",
        dueDate: "2026-02-15",
        completedDate: "2026-02-14",
      },
      {
        phase: 1,
        name: "Design Review & Approval",
        category: "other",
        status: "completed",
        progress: 100,
        startDate: "2026-01-25",
        dueDate: "2026-02-28",
        completedDate: "2026-02-27",
      },
      {
        phase: 1,
        name: "Procurement Planning",
        category: "procurement",
        status: "completed",
        progress: 100,
        startDate: "2026-02-01",
        dueDate: "2026-02-15",
        completedDate: "2026-02-14",
      },
      {
        phase: 1,
        name: "Contractor Onboarding",
        category: "other",
        status: "in_progress",
        progress: 75,
        startDate: "2026-02-01",
        dueDate: "2026-03-31",
      },
      {
        phase: 1,
        name: "Utility Relocation",
        category: "site_works",
        status: "in_progress",
        progress: 60,
        startDate: "2026-02-10",
        dueDate: "2026-03-31",
      },
      {
        phase: 1,
        name: "Temporary Works Setup",
        category: "site_works",
        status: "pending",
        progress: 20,
        startDate: "2026-03-15",
        dueDate: "2026-03-31",
      },
      {
        phase: 2,
        name: "Foundation Works - Terminal Building",
        category: "construction",
        status: "in_progress",
        progress: 65,
        startDate: "2026-04-01",
        dueDate: "2026-06-30",
      },
      {
        phase: 2,
        name: "Structural Steel Erection",
        category: "construction",
        status: "in_progress",
        progress: 40,
        startDate: "2026-04-15",
        dueDate: "2026-07-31",
      },
      {
        phase: 2,
        name: "Electrical Installation - Phase 1",
        category: "mep",
        status: "in_progress",
        progress: 30,
        startDate: "2026-05-01",
        dueDate: "2026-08-31",
      },
      {
        phase: 2,
        name: "Plumbing Works",
        category: "mep",
        status: "pending",
        progress: 0,
        startDate: "2026-06-01",
        dueDate: "2026-08-31",
      },
      {
        phase: 2,
        name: "HVAC System Installation",
        category: "mep",
        status: "pending",
        progress: 0,
        startDate: "2026-07-01",
        dueDate: "2026-09-30",
      },
      {
        phase: 2,
        name: "Runway Extension Works",
        category: "construction",
        status: "in_progress",
        progress: 55,
        startDate: "2026-04-01",
        dueDate: "2026-05-31",
        notes: "Currently overdue against original schedule.",
      },
      {
        phase: 3,
        name: "Interior Finishing",
        category: "finishing",
        status: "pending",
        progress: 0,
        startDate: "2026-10-01",
        dueDate: "2026-11-30",
      },
      {
        phase: 3,
        name: "Landscape & External Works",
        category: "finishing",
        status: "pending",
        progress: 0,
        startDate: "2026-10-01",
        dueDate: "2026-11-30",
      },
      {
        phase: 4,
        name: "Systems Testing & Commissioning",
        category: "testing",
        status: "pending",
        progress: 0,
        startDate: "2026-12-01",
        dueDate: "2026-12-20",
      },
      {
        phase: 4,
        name: "Safety Inspection",
        category: "testing",
        status: "pending",
        progress: 0,
        startDate: "2026-12-05",
        dueDate: "2026-12-25",
      },
      {
        phase: 4,
        name: "Final Handover",
        category: "closeout",
        status: "pending",
        progress: 0,
        startDate: "2026-12-28",
        dueDate: "2026-12-30",
      },
    ];
    let activityCount = 0;
    const activities = [];
    for (const a of activityDefs) {
      const { phase, ...rest } = a;
      const [activity] = await Activity.findOrCreate({
        where: { projectId: project.id, name: a.name },
        defaults: {
          ...rest,
          projectId: project.id,
          phaseId: phases[phase].id,
          responsibleId: hassan.id,
        },
      });
      activities.push(activity);
      activityCount++;
    }
    console.log(`  ✅ ${activityCount} activities seeded`);

    // ═══════════════════════════════════════════════════
    // 4. SUPPLIERS
    // ═══════════════════════════════════════════════════
    console.log("🏭 Seeding suppliers...");
    const supplierDefs = [
      {
        name: "ZanBuild Ltd",
        category: "Construction",
        email: "ahmed@zanbuild.co.tz",
        phone: "+255 773 001 001",
      },
      {
        name: "Mega Electricals",
        category: "Electrical",
        email: "john@megaelec.co.tz",
        phone: "+255 773 002 002",
      },
      {
        name: "PlumbTech Co.",
        category: "Plumbing",
        email: "sarah@plumbtech.co.tz",
        phone: "+255 773 003 003",
      },
      {
        name: "Cool Air Solutions",
        category: "HVAC",
        email: "mike@coolair.co.tz",
        phone: "+255 773 004 004",
      },
      {
        name: "Prime Interiors",
        category: "Interiors",
        email: "amina@prime.co.tz",
        phone: "+255 773 005 005",
      },
      {
        name: "Green Landscape",
        category: "Landscaping",
        email: "info@greenlandscape.co.tz",
        phone: "+255 773 006 006",
      },
      {
        name: "ICT Solutions",
        category: "ICT & Security",
        email: "info@ictsolutions.co.tz",
        phone: "+255 773 007 007",
      },
      {
        name: "Safety First Ltd",
        category: "Safety & QA",
        email: "info@safetyfirst.co.tz",
        phone: "+255 773 008 008",
      },
    ];
    const suppliers = {};
    for (const s of supplierDefs) {
      const [supplier] = await Supplier.findOrCreate({
        where: { name: s.name },
        defaults: { ...s, isActive: true },
      });
      suppliers[s.name] = supplier;
    }
    console.log(`  ✅ ${supplierDefs.length} suppliers seeded`);

    // ═══════════════════════════════════════════════════
    // 5. CONTRACTS
    // ═══════════════════════════════════════════════════
    console.log("📜 Seeding contracts...");
    const contractDefs = [
      {
        contractNo: "CON-2026-001",
        contractor: "ZanBuild Ltd",
        category: "Building Works",
        contractValue: 85000000,
        startDate: "2026-01-12",
        endDate: "2026-06-30",
        status: "active",
        description:
          "Main building works contract including terminal construction.",
      },
      {
        contractNo: "CON-2026-002",
        contractor: "Mega Electricals",
        category: "Electrical Works",
        contractValue: 45000000,
        startDate: "2026-01-15",
        endDate: "2026-08-15",
        status: "active",
        description: "Complete electrical installation for terminal building.",
      },
      {
        contractNo: "CON-2026-003",
        contractor: "PlumbTech Co.",
        category: "Plumbing Works",
        contractValue: 32000000,
        startDate: "2026-01-20",
        endDate: "2026-08-20",
        status: "active",
        description: "Plumbing and drainage systems.",
      },
      {
        contractNo: "CON-2026-004",
        contractor: "Cool Air Solutions",
        category: "HVAC Works",
        contractValue: 28500000,
        startDate: "2026-02-01",
        endDate: "2026-10-31",
        status: "active",
        description: "HVAC system design and installation.",
      },
      {
        contractNo: "CON-2026-005",
        contractor: "Prime Interiors",
        category: "Interior Finishes",
        contractValue: 18750000,
        startDate: "2026-03-01",
        endDate: "2026-11-30",
        status: "active",
        description: "Interior finishing and furnishing.",
      },
      {
        contractNo: "CON-2026-006",
        contractor: "Green Landscape",
        category: "Landscaping",
        contractValue: 8250000,
        startDate: "2026-03-15",
        endDate: "2026-12-15",
        status: "pending",
        description: "External landscaping and green works.",
      },
      {
        contractNo: "CON-2026-007",
        contractor: "ICT Solutions",
        category: "ICT & Security",
        contractValue: 6900000,
        startDate: "2026-04-01",
        endDate: "2026-12-31",
        status: "pending",
        description: "ICT infrastructure and security systems.",
      },
      {
        contractNo: "CON-2026-008",
        contractor: "Safety First Ltd",
        category: "Safety & QA",
        contractValue: 3500000,
        startDate: "2026-04-01",
        endDate: "2026-12-31",
        status: "pending",
        description: "Safety management and quality assurance.",
      },
    ];
    const contracts = {};
    for (const c of contractDefs) {
      const [contract] = await Contract.findOrCreate({
        where: { contractNo: c.contractNo },
        defaults: { ...c, projectId: project.id, createdById: msaid.id },
      });
      contracts[c.contractNo] = contract;
    }
    console.log(`  ✅ ${contractDefs.length} contracts seeded`);

    // ═══════════════════════════════════════════════════
    // 6. PURCHASE ORDERS
    // ═══════════════════════════════════════════════════
    console.log("🛒 Seeding purchase orders...");
    const poDefs = [
      {
        poNumber: "LPO-2026-024",
        supplier: "ZanBuild Ltd",
        contractNo: "CON-2026-001",
        description: "Cement and aggregates supply",
        amount: 8500000,
        issuedDate: "2026-05-15",
        status: "open",
      },
      {
        poNumber: "LPO-2026-023",
        supplier: "Mega Electricals",
        contractNo: "CON-2026-002",
        description: "Cable supply - Phase 2",
        amount: 4200000,
        issuedDate: "2026-05-12",
        status: "open",
      },
      {
        poNumber: "LPO-2026-022",
        supplier: "PlumbTech Co.",
        contractNo: "CON-2026-003",
        description: "PVC pipes and fittings",
        amount: 2800000,
        issuedDate: "2026-05-10",
        status: "received",
      },
      {
        poNumber: "LPO-2026-021",
        supplier: "Cool Air Solutions",
        contractNo: "CON-2026-004",
        description: "HVAC equipment supply",
        amount: 12000000,
        issuedDate: "2026-05-05",
        status: "partial",
      },
      {
        poNumber: "LPO-2026-020",
        supplier: "ZanBuild Ltd",
        contractNo: "CON-2026-001",
        description: "Steel reinforcement bars",
        amount: 15000000,
        issuedDate: "2026-05-01",
        status: "received",
      },
    ];
    for (const po of poDefs) {
      await PurchaseOrder.findOrCreate({
        where: { poNumber: po.poNumber },
        defaults: {
          projectId: project.id,
          contractId: contracts[po.contractNo].id,
          supplierId: suppliers[po.supplier].id,
          description: po.description,
          amount: po.amount,
          issuedDate: po.issuedDate,
          status: po.status,
          approvedById: msaid.id,
          createdById: msaid.id,
        },
      });
    }
    console.log(`  ✅ ${poDefs.length} purchase orders seeded`);

    // ═══════════════════════════════════════════════════
    // 7. BUDGET ITEMS
    // ═══════════════════════════════════════════════════
    console.log("💰 Seeding budget items...");
    const budgetDefs = [
      {
        category: "Preliminaries",
        budget: 35000000,
        committed: 28500000,
        paid: 18250000,
      },
      {
        category: "Civil Works",
        budget: 180000000,
        committed: 128000000,
        paid: 82500000,
      },
      {
        category: "Electrical Works",
        budget: 60000000,
        committed: 45600000,
        paid: 24750000,
      },
      {
        category: "Mechanical Works (HVAC)",
        budget: 45000000,
        committed: 36800000,
        paid: 21200000,
      },
      {
        category: "Finishes",
        budget: 50000000,
        committed: 36000000,
        paid: 18600000,
      },
      {
        category: "External Works",
        budget: 40000000,
        committed: 25500000,
        paid: 15300000,
      },
      {
        category: "Contingencies",
        budget: 40000000,
        committed: 20000000,
        paid: 10050000,
      },
    ];
    for (const b of budgetDefs) {
      await BudgetItem.findOrCreate({
        where: { projectId: project.id, category: b.category },
        defaults: { ...b, projectId: project.id, currency: "TZS" },
      });
    }
    console.log(`  ✅ ${budgetDefs.length} budget items seeded`);

    // ═══════════════════════════════════════════════════
    // 8. INVOICES
    // ═══════════════════════════════════════════════════
    console.log("🧾 Seeding invoices...");
    const invoiceDefs = [
      {
        invoiceNo: "INV-2026-017",
        contractNo: "CON-2026-001",
        supplier: "ZanBuild Ltd",
        description: "Payment for Materials",
        amount: 18500000,
        invoiceDate: "2026-04-25",
        dueDate: "2026-05-02",
        status: "paid",
      },
      {
        invoiceNo: "INV-2026-024",
        contractNo: "CON-2026-001",
        supplier: "ZanBuild Ltd",
        description: "Civil Works - Stage 3",
        amount: 22000000,
        invoiceDate: "2026-05-10",
        dueDate: "2026-05-20",
        status: "pending",
      },
      {
        invoiceNo: "INV-2026-025",
        contractNo: "CON-2026-002",
        supplier: "Mega Electricals",
        description: "Electrical Installation",
        amount: 15500000,
        invoiceDate: "2026-05-15",
        dueDate: "2026-06-05",
        status: "pending",
      },
    ];
    const invoices = {};
    for (const inv of invoiceDefs) {
      const tax = Math.round(inv.amount * 0.18);
      const [invoice] = await Invoice.findOrCreate({
        where: { invoiceNo: inv.invoiceNo },
        defaults: {
          projectId: project.id,
          contractId: contracts[inv.contractNo].id,
          supplierId: suppliers[inv.supplier].id,
          description: inv.description,
          amount: inv.amount,
          tax,
          totalAmount: inv.amount + tax,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          status: inv.status,
          approvedById: inv.status === "paid" ? fatma.id : null,
          createdById: fatma.id,
        },
      });
      invoices[inv.invoiceNo] = invoice;
    }
    console.log(`  ✅ ${invoiceDefs.length} invoices seeded`);

    // ═══════════════════════════════════════════════════
    // 9. PAYMENTS
    // ═══════════════════════════════════════════════════
    console.log("💳 Seeding payments...");
    const paymentDefs = [
      {
        paymentRef: "PAY-2026-018",
        invoiceNo: null,
        description: "Payment for Construction Phase 1",
        amount: 25000000,
        paymentDate: "2026-05-15",
        status: "paid",
      },
      {
        paymentRef: "PAY-2026-017",
        invoiceNo: "INV-2026-017",
        description: "Payment for Materials",
        amount: 18500000,
        paymentDate: "2026-04-28",
        status: "paid",
      },
      {
        paymentRef: "PAY-2026-016",
        invoiceNo: null,
        description: "Advance Payment - Electrical",
        amount: 50000000,
        paymentDate: "2026-04-15",
        status: "paid",
      },
      {
        paymentRef: "PAY-2026-015",
        invoiceNo: null,
        description: "Civil Works Progress Payment",
        amount: 32000000,
        paymentDate: "2026-03-28",
        status: "paid",
      },
      {
        paymentRef: "PAY-2026-014",
        invoiceNo: null,
        description: "Mobilization Payment",
        amount: 20500000,
        paymentDate: "2026-03-15",
        status: "paid",
      },
      {
        paymentRef: "PAY-2026-024",
        invoiceNo: "INV-2026-024",
        description: "Civil Works - Stage 3",
        amount: 22000000,
        paymentDate: "2026-06-10",
        status: "pending_approval",
      },
      {
        paymentRef: "PAY-2026-025",
        invoiceNo: "INV-2026-025",
        description: "Electrical Installation",
        amount: 15500000,
        paymentDate: "2026-06-15",
        status: "pending_approval",
      },
    ];
    for (const p of paymentDefs) {
      await Payment.findOrCreate({
        where: { paymentRef: p.paymentRef },
        defaults: {
          projectId: project.id,
          invoiceId: p.invoiceNo ? (invoices[p.invoiceNo]?.id ?? null) : null,
          description: p.description,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: "Bank Transfer",
          status: p.status,
          approvedById: p.status === "paid" ? fatma.id : null,
          createdById: fatma.id,
        },
      });
    }
    console.log(`  ✅ ${paymentDefs.length} payments seeded`);

    // ═══════════════════════════════════════════════════
    // 10. EXPENSES
    // ═══════════════════════════════════════════════════
    console.log("🧮 Seeding expenses...");
    const expenseDefs = [
      {
        category: "Civil Works",
        description: "Site civil works expenses",
        amount: 82500000,
        expenseDate: "2026-05-20",
        status: "approved",
      },
      {
        category: "Electrical Works",
        description: "Electrical works expenses",
        amount: 24750000,
        expenseDate: "2026-05-18",
        status: "approved",
      },
      {
        category: "HVAC Works",
        description: "HVAC works expenses",
        amount: 21200000,
        expenseDate: "2026-05-12",
        status: "approved",
      },
      {
        category: "Finishes",
        description: "Finishing works expenses",
        amount: 18600000,
        expenseDate: "2026-04-30",
        status: "approved",
      },
      {
        category: "External Works",
        description: "External works expenses",
        amount: 15300000,
        expenseDate: "2026-04-22",
        status: "pending",
      },
    ];
    for (const e of expenseDefs) {
      await Expense.findOrCreate({
        where: {
          projectId: project.id,
          category: e.category,
          description: e.description,
        },
        defaults: {
          ...e,
          projectId: project.id,
          createdById: fatma.id,
          approvedById: e.status === "approved" ? fatma.id : null,
        },
      });
    }
    console.log(`  ✅ ${expenseDefs.length} expenses seeded`);

    // ═══════════════════════════════════════════════════
    // 11. REPORTS
    // ═══════════════════════════════════════════════════
    console.log("📊 Seeding reports...");
    const reportDefs = [
      {
        reportNo: "PRG-2026-012",
        title: "Monthly Progress Report - May 2026",
        type: "progress_report",
        period: "May 2026",
        status: "completed",
        progress: 100,
        phase: 1,
        submittedBy: admin,
        submittedOn: "2026-05-05",
      },
      {
        reportNo: "TEST-2026-006",
        title: "Concrete Strength Test Report",
        type: "test_report",
        period: "Apr 2026",
        status: "completed",
        progress: 100,
        phase: 2,
        submittedBy: salim,
        submittedOn: "2026-04-28",
      },
      {
        reportNo: "RFI-2026-005",
        title: "RFI - Drainage Design Clarification",
        type: "rfi_report",
        period: "Apr 2026",
        status: "in_progress",
        progress: 60,
        phase: 2,
        submittedBy: hassan,
        submittedOn: "2026-04-25",
      },
      {
        reportNo: "INSP-2026-003",
        title: "Site Inspection Report",
        type: "inspection_report",
        period: "Apr 2026",
        status: "completed",
        progress: 100,
        phase: 2,
        submittedBy: msaid,
        submittedOn: "2026-04-20",
      },
      {
        reportNo: "PRG-2026-011",
        title: "Monthly Progress Report - April 2026",
        type: "progress_report",
        period: "Apr 2026",
        status: "completed",
        progress: 100,
        phase: 2,
        submittedBy: admin,
        submittedOn: "2026-04-10",
      },
      {
        reportNo: "TEST-2026-005",
        title: "Soil Compaction Test Report",
        type: "test_report",
        period: "Mar 2026",
        status: "in_progress",
        progress: 70,
        phase: 1,
        submittedBy: salim,
        submittedOn: "2026-04-05",
      },
      {
        reportNo: "RFI-2026-004",
        title: "RFI - Electrical Load Calculation",
        type: "rfi_report",
        period: "Mar 2026",
        status: "pending",
        progress: 30,
        phase: 2,
        submittedBy: hassan,
        submittedOn: "2026-03-28",
      },
      {
        reportNo: "PRG-2026-010",
        title: "Monthly Progress Report - March 2026",
        type: "progress_report",
        period: "Mar 2026",
        status: "completed",
        progress: 100,
        phase: 1,
        submittedBy: admin,
        submittedOn: "2026-03-10",
      },
      {
        reportNo: "PRG-2026-001",
        title: "Mobilization Report",
        type: "progress_report",
        period: "Jan 2026",
        status: "completed",
        progress: 100,
        phase: 1,
        submittedBy: admin,
        submittedOn: "2026-01-25",
      },
      {
        reportNo: "INSP-2026-001",
        title: "Site Survey Report",
        type: "inspection_report",
        period: "Jan 2026",
        status: "completed",
        progress: 100,
        phase: 1,
        submittedBy: hassan,
        submittedOn: "2026-02-05",
      },
    ];
    for (const r of reportDefs) {
      await Report.findOrCreate({
        where: { projectId: project.id, reportNo: r.reportNo },
        defaults: {
          projectId: project.id,
          phaseId: phases[r.phase].id,
          reportNo: r.reportNo,
          title: r.title,
          type: r.type,
          period: r.period,
          status: r.status,
          progress: r.progress,
          submittedById: r.submittedBy.id,
          submittedOn: r.submittedOn,
          approvedById: r.status === "completed" ? admin.id : null,
        },
      });
    }
    console.log(`  ✅ ${reportDefs.length} reports seeded`);

    // ═══════════════════════════════════════════════════
    // 12. DOCUMENTS
    // ═══════════════════════════════════════════════════
    console.log("📁 Seeding documents...");
    const documentDefs = [
      {
        title: "Contract Agreement",
        category: "Contracts",
        fileName: "Contract Agreement.pdf",
        filePath: "uploads/seed/contract-agreement.pdf",
        fileSize: 2516582,
        mimeType: "application/pdf",
        uploadedBy: admin,
        description: "Main contract agreement with ZanBuild Ltd",
      },
      {
        title: "Site Plan Drawing",
        category: "Drawings",
        fileName: "Site Plan Drawing.dwg",
        filePath: "uploads/seed/site-plan.dwg",
        fileSize: 5976371,
        mimeType: "application/dwg",
        uploadedBy: hassan,
        description: "Detailed site plan drawing",
      },
      {
        title: "Progress Report Apr 2026",
        category: "Reports",
        fileName: "Progress Report Apr 2026.pdf",
        filePath: "uploads/seed/progress-apr-2026.pdf",
        fileSize: 1887436,
        mimeType: "application/pdf",
        uploadedBy: admin,
        description: "Monthly progress report for April 2026",
      },
      {
        title: "ESIA Report",
        category: "Environmental",
        fileName: "ESIA Report.pdf",
        filePath: "uploads/seed/esia-report.pdf",
        fileSize: 3355443,
        mimeType: "application/pdf",
        uploadedBy: msaid,
        description: "Environmental and Social Impact Assessment",
      },
      {
        title: "Structural Drawings",
        category: "Drawings",
        fileName: "Structural Drawings.pdf",
        filePath: "uploads/seed/structural-drawings.pdf",
        fileSize: 8808038,
        mimeType: "application/pdf",
        uploadedBy: hassan,
        description: "Structural engineering drawings",
      },
      {
        title: "Health & Safety Plan",
        category: "Safety",
        fileName: "Health & Safety Plan.pdf",
        filePath: "uploads/seed/hse-plan.pdf",
        fileSize: 1258291,
        mimeType: "application/pdf",
        uploadedBy: msaid,
        description: "Project HSE management plan",
      },
    ];
    for (const doc of documentDefs) {
      await Document.findOrCreate({
        where: { projectId: project.id, title: doc.title },
        defaults: {
          projectId: project.id,
          title: doc.title,
          category: doc.category,
          filePath: doc.filePath,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          version: "1.0",
          description: doc.description,
          uploadedById: doc.uploadedBy.id,
        },
      });
    }
    console.log(`  ✅ ${documentDefs.length} documents seeded`);

    // ═══════════════════════════════════════════════════
    // 13. TEAM MEMBERS
    // ═══════════════════════════════════════════════════
    console.log("👥 Seeding team members...");
    const teamDefs = [
      { user: admin, role: "Project Manager" },
      { user: hassan, role: "Site Engineer" },
      { user: salim, role: "MEP Engineer" },
      { user: fatma, role: "Finance Officer" },
      { user: msaid, role: "Quantity Surveyor" },
    ];
    for (const t of teamDefs) {
      await TeamMember.findOrCreate({
        where: { projectId: project.id, userId: t.user.id },
        defaults: {
          projectId: project.id,
          userId: t.user.id,
          role: t.role,
          isActive: true,
        },
      });
    }
    console.log(`  ✅ ${teamDefs.length} team members seeded`);

    console.log("\n🎉 Demo data seed complete!\n");
    console.log("─".repeat(50));
    console.log(`Project: ${project.name}`);
    console.log(`Project ID (UUID): ${project.id}`);
    console.log(`Project Code: ${project.projectCode}`);
    console.log("─".repeat(50));

    process.exit(0);
  } catch (err) {
    console.error('❌ Demo data seed failed:', err);
    process.exit(1);
  }
};

seedDemoData();