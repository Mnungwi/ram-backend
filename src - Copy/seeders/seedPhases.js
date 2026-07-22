require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, Project, ProjectPhase } = require('../models/index');

const seedPhases = async () => {
  try {
    console.log('🔄 Seeding project phases...');
    await sequelize.authenticate();
    await ProjectPhase.sync({ alter: true });

    // Get all projects
    const projects = await Project.findAll();
    if (projects.length === 0) {
      console.log('⚠️  No projects found. Run seedDemoData.js first.');
      process.exit(0);
    }

    const defaultPhases = [
      {
        name: 'Phase 1: Pre-Construction & Mobilization',
        description: 'Site preparation, surveys, soil investigation and contractor mobilization',
        order: 1, status: 'completed', progress: 100,
        startDate: '2026-01-12', endDate: '2026-02-28',
      },
      {
        name: 'Phase 2: Foundation & Structural Works',
        description: 'Excavation, piling, foundation works and structural concrete',
        order: 2, status: 'active', progress: 65,
        startDate: '2026-03-01', endDate: '2026-06-30',
      },
      {
        name: 'Phase 3: Construction & MEP Works',
        description: 'Main construction, mechanical, electrical and plumbing installations',
        order: 3, status: 'active', progress: 30,
        startDate: '2026-07-01', endDate: '2026-10-31',
      },
      {
        name: 'Phase 4: Finishing & Installation',
        description: 'Interior finishing, fixtures, fittings and equipment installation',
        order: 4, status: 'pending', progress: 0,
        startDate: '2026-11-01', endDate: '2026-11-30',
      },
      {
        name: 'Phase 5: Testing, Commissioning & Handover',
        description: 'System testing, commissioning, snag clearing and project handover',
        order: 5, status: 'pending', progress: 0,
        startDate: '2026-12-01', endDate: '2026-12-30',
      },
    ];

    let totalCreated = 0;

    for (const project of projects) {
      const existingCount = await ProjectPhase.count({ where: { projectId: project.id } });
      if (existingCount > 0) {
        console.log(`  ℹ️  ${project.projectCode} already has ${existingCount} phases — skipping.`);
        continue;
      }

      for (const p of defaultPhases) {
        await ProjectPhase.create({ ...p, projectId: project.id });
        totalCreated++;
      }
      console.log(`  ✅ ${defaultPhases.length} phases created for ${project.projectCode} — ${project.name}`);
    }

    console.log(`\n🎉 Done! ${totalCreated} phases created total.\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase seed failed:', err);
    process.exit(1);
  }
};

seedPhases();
