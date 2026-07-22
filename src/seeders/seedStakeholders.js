require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, StakeholderType, Stakeholder, ProjectStakeholder } = require('../models/index');

const seedStakeholders = async () => {
  try {
    console.log('🌱 Seeding stakeholder types & demo stakeholders...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // ── 1. Stakeholder Types ─────────────────────────────
    console.log('📋 Seeding stakeholder types...');
    const typeDefs = [
      { name: 'Project Manager',    color: '#1a56db', order: 1, description: 'Overall project manager and signatory' },
      { name: 'Project Consultant', color: '#7c3aed', order: 2, description: 'Technical or management consultant' },
      { name: 'Client',             color: '#16a34a', order: 3, description: 'Project owner or commissioning client' },
      { name: 'Government',         color: '#0891b2', order: 4, description: 'Government authority or regulator' },
      { name: 'Contractor',         color: '#ea580c', order: 5, description: 'Main contractor or sub-contractor' },
      { name: 'Donor',              color: '#ca8a04', order: 6, description: 'Funding agency or donor organization' },
      { name: 'NGO',                color: '#be185d', order: 7, description: 'Non-governmental organization' },
      { name: 'Supervisor',         color: '#0f766e', order: 8, description: 'Site supervisor or engineer' },
      { name: 'Legal',              color: '#7f1d1d', order: 9, description: 'Legal advisor or representative' },
      { name: 'Other',              color: '#6b7280', order: 10, description: 'Any other stakeholder type' },
    ];

    const typeMap = {};
    for (const t of typeDefs) {
      const [type] = await StakeholderType.findOrCreate({ where: { name: t.name }, defaults: t });
      typeMap[t.name] = type;
    }
    console.log(`  ✅ ${typeDefs.length} stakeholder types seeded`);

    // ── 2. Demo Stakeholders (global directory) ──────────
    console.log('👥 Seeding demo stakeholders...');
    const stakeholderDefs = [
      {
        name: 'Eng. Hassan Juma',
        organization: 'Farida Projects Ltd',
        jobTitle: 'Senior Project Manager',
        email: 'hassan@farida.co.tz',
        phone: '+255 773 100 002',
        city: 'Zanzibar City',
        stakeholderTypeId: typeMap['Project Manager'].id,
      },
      {
        name: 'ZanConsult Ltd',
        organization: 'ZanConsult Engineering',
        jobTitle: 'Lead Consultant',
        email: 'info@zanconsult.co.tz',
        phone: '+255 773 200 001',
        city: 'Zanzibar City',
        stakeholderTypeId: typeMap['Project Consultant'].id,
      },
      {
        name: 'Hon. Said Ali Mbarouk',
        organization: 'Revolutionary Government of Zanzibar',
        jobTitle: 'Minister of Infrastructure',
        email: 'said.ali@gov.go.tz',
        phone: '+255 24 223 0001',
        city: 'Zanzibar City',
        stakeholderTypeId: typeMap['Government'].id,
      },
      {
        name: 'World Bank Tanzania',
        organization: 'World Bank Group',
        jobTitle: 'Country Director',
        email: 'wb-tz@worldbank.org',
        phone: '+255 22 216 2000',
        city: 'Dar es Salaam',
        stakeholderTypeId: typeMap['Donor'].id,
      },
      {
        name: 'Ahmed Omar',
        organization: 'ZanBuild Ltd',
        jobTitle: 'Managing Director',
        email: 'ahmed@zanbuild.co.tz',
        phone: '+255 773 001 001',
        city: 'Zanzibar City',
        stakeholderTypeId: typeMap['Contractor'].id,
      },
    ];

    const stakeholderMap = {};
    for (const s of stakeholderDefs) {
      const [stakeholder] = await Stakeholder.findOrCreate({
        where: { name: s.name, organization: s.organization || null },
        defaults: { ...s, isActive: true },
      });
      stakeholderMap[s.name] = stakeholder;
    }
    console.log(`  ✅ ${stakeholderDefs.length} stakeholders seeded`);

    // ── 3. Link stakeholders to ZAE project ──────────────
    console.log('🔗 Linking stakeholders to Zanzibar Airport Expansion...');
    const { Project } = require('../models/index');
    const project = await Project.findOne({ where: { projectCode: 'ZAE-2026-001' } });

    if (project) {
      const projectLinks = [
        {
          stakeholderId: stakeholderMap['Eng. Hassan Juma'].id,
          stakeholderTypeId: typeMap['Project Manager'].id,
          role: 'Project Manager',
          isSignatory: true,
          isPrimary: true,
          signatureOrder: 1,
        },
        {
          stakeholderId: stakeholderMap['ZanConsult Ltd'].id,
          stakeholderTypeId: typeMap['Project Consultant'].id,
          role: 'Lead Consultant',
          isSignatory: true,
          isPrimary: true,
          signatureOrder: 2,
        },
        {
          stakeholderId: stakeholderMap['Hon. Said Ali Mbarouk'].id,
          stakeholderTypeId: typeMap['Government'].id,
          role: 'Government Representative',
          isSignatory: true,
          isPrimary: true,
          signatureOrder: 3,
        },
        {
          stakeholderId: stakeholderMap['World Bank Tanzania'].id,
          stakeholderTypeId: typeMap['Donor'].id,
          role: 'Donor Representative',
          isSignatory: false,
          isPrimary: true,
        },
        {
          stakeholderId: stakeholderMap['Ahmed Omar'].id,
          stakeholderTypeId: typeMap['Contractor'].id,
          role: 'Main Contractor',
          isSignatory: false,
          isPrimary: true,
        },
      ];

      for (const link of projectLinks) {
        const existing = await ProjectStakeholder.findOne({
          where: { projectId: project.id, stakeholderId: link.stakeholderId },
        });
        if (!existing) {
          await ProjectStakeholder.create({ ...link, projectId: project.id, isActive: true });
        }
      }
      console.log(`  ✅ ${projectLinks.length} stakeholders linked to project`);
    } else {
      console.log('  ⚠️  ZAE-2026-001 project not found — run seedDemoData.js first');
    }

    console.log('\n🎉 Stakeholder seed complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Stakeholder seed failed:', err);
    process.exit(1);
  }
};

seedStakeholders();
