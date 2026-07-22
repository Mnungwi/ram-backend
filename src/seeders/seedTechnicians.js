// ============================================================
// SEED: Technicians, Categories, Project Assignments
// Run: node src/seeders/seedTechnicians.js
// ============================================================
require('dotenv').config();
const { sequelize } = require('../config/database');
const { Technician, TechnicianCategory, ProjectTechnician } = require('../models/technician.model');
const { Project } = require('../models/index');

const CATEGORIES = [
  { name: 'Fundi Maji' },
  { name: 'Fundi Umeme' },
  { name: 'Fundi Ujenzi' },
  { name: 'Fundi Chuma' },
  { name: 'Fundi Magari' },
  { name: 'Fundi Mbao' },
  { name: 'Operator Mashine' },
  { name: 'Dereva' },
  { name: 'Vibarua' },
  { name: 'Msimamizi wa Site' },
];

const TECHNICIANS = [
  // Fundi Ujenzi
  { name: 'Juma Ally Hassan',      category: 'Fundi Ujenzi',      phone: '0712345001', idType: 'NIDA',     idNumber: '19850101-12345-00001-01' },
  { name: 'Said Omar Khamis',      category: 'Fundi Ujenzi',      phone: '0712345002', idType: 'NIDA',     idNumber: '19880215-12345-00002-01' },
  { name: 'Hamisi Bakari Salim',   category: 'Fundi Ujenzi',      phone: '0712345003', idType: 'Voter ID', idNumber: 'VTR-2023-001234' },
  { name: 'Ali Mohamed Issa',      category: 'Fundi Ujenzi',      phone: '0712345004', idType: 'NIDA',     idNumber: '19920320-12345-00004-01' },
  { name: 'Rashid Juma Kombo',     category: 'Fundi Ujenzi',      phone: '0712345005', idType: 'NIDA',     idNumber: '19900505-12345-00005-01' },

  // Fundi Maji
  { name: 'Khalid Hassan Mwinyi',  category: 'Fundi Maji',        phone: '0712345011', idType: 'NIDA',     idNumber: '19870612-12345-00011-01' },
  { name: 'Amani Salehe Abdalla',  category: 'Fundi Maji',        phone: '0712345012', idType: 'Voter ID', idNumber: 'VTR-2023-005678' },
  { name: 'Musa Khamis Said',      category: 'Fundi Maji',        phone: '0712345013', idType: 'NIDA',     idNumber: '19910718-12345-00013-01' },

  // Fundi Umeme
  { name: 'Hassan Ali Makame',     category: 'Fundi Umeme',       phone: '0712345021', idType: 'NIDA',     idNumber: '19860825-12345-00021-01' },
  { name: 'Nassor Omar Haji',      category: 'Fundi Umeme',       phone: '0712345022', idType: 'Passport', idNumber: 'AB123456' },
  { name: 'Seif Hamad Bakar',      category: 'Fundi Umeme',       phone: '0712345023', idType: 'NIDA',     idNumber: '19930930-12345-00023-01' },

  // Fundi Chuma
  { name: 'Omar Said Kombo',       category: 'Fundi Chuma',       phone: '0712345031', idType: 'NIDA',     idNumber: '19841105-12345-00031-01' },
  { name: 'Bakari Juma Nassor',    category: 'Fundi Chuma',       phone: '0712345032', idType: 'Voter ID', idNumber: 'VTR-2023-009012' },

  // Fundi Mbao
  { name: 'Salim Hassan Omar',     category: 'Fundi Mbao',        phone: '0712345041', idType: 'NIDA',     idNumber: '19891210-12345-00041-01' },
  { name: 'Khamis Ali Salehe',     category: 'Fundi Mbao',        phone: '0712345042', idType: 'NIDA',     idNumber: '19950115-12345-00042-01' },

  // Fundi Magari
  { name: 'Abdalla Mwinyi Juma',   category: 'Fundi Magari',      phone: '0712345051', idType: 'Driving License', idNumber: 'DL-TZ-2020-123456' },
  { name: 'Mohamed Khamis Hassan', category: 'Fundi Magari',      phone: '0712345052', idType: 'NIDA',     idNumber: '19830220-12345-00052-01' },

  // Operator Mashine
  { name: 'Haji Omar Said',        category: 'Operator Mashine',  phone: '0712345061', idType: 'NIDA',     idNumber: '19810325-12345-00061-01' },
  { name: 'Kombo Salim Bakar',     category: 'Operator Mashine',  phone: '0712345062', idType: 'Voter ID', idNumber: 'VTR-2023-012345' },

  // Dereva
  { name: 'Makame Hassan Ali',     category: 'Dereva',            phone: '0712345071', idType: 'Driving License', idNumber: 'DL-TZ-2019-654321' },
  { name: 'Nassib Juma Omar',      category: 'Dereva',            phone: '0712345072', idType: 'Driving License', idNumber: 'DL-TZ-2021-789012' },
  { name: 'Issa Khamis Salehe',    category: 'Dereva',            phone: '0712345073', idType: 'NIDA',     idNumber: '19780430-12345-00073-01' },

  // Vibarua
  { name: 'Ramadhan Said Ali',     category: 'Vibarua',           phone: '0712345081', idType: 'Voter ID', idNumber: 'VTR-2023-015678' },
  { name: 'Suleiman Omar Haji',    category: 'Vibarua',           phone: '0712345082', idType: 'Voter ID', idNumber: 'VTR-2023-018901' },
  { name: 'Yahya Salim Nassor',    category: 'Vibarua',           phone: '0712345083', idType: 'NIDA',     idNumber: '20000605-12345-00083-01' },
  { name: 'Ibrahim Bakari Kombo',  category: 'Vibarua',           phone: '0712345084', idType: 'Voter ID', idNumber: 'VTR-2023-022345' },
  { name: 'Abubakar Hassan Said',  category: 'Vibarua',           phone: '0712345085', idType: 'NIDA',     idNumber: '20010710-12345-00085-01' },

  // Msimamizi wa Site
  { name: 'Talib Omar Makame',     category: 'Msimamizi wa Site', phone: '0712345091', idType: 'NIDA',     idNumber: '19801015-12345-00091-01' },
  { name: 'Farhan Juma Khamis',    category: 'Msimamizi wa Site', phone: '0712345092', idType: 'NIDA',     idNumber: '19821120-12345-00092-01' },
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB\n');

    await TechnicianCategory.sync({ alter: true });
    await Technician.sync({ alter: true });
    await ProjectTechnician.sync({ alter: true });

    // 1. Seed Categories
    console.log('📦 Seeding Categories...');
    const catMap = {};
    for (const cat of CATEGORIES) {
      const [c, created] = await TechnicianCategory.findOrCreate({
        where: { name: cat.name }, defaults: cat,
      });
      catMap[cat.name] = c.id;
      console.log(`  ${created ? '✅' : '⚠️ '} ${c.name}`);
    }

    // 2. Seed Technicians
    console.log('\n👷 Seeding Technicians...');
    const techMap = {};
    let created = 0, existing = 0;
    for (const tech of TECHNICIANS) {
      const { category, ...data } = tech;
      const [t, isNew] = await Technician.findOrCreate({
        where: { phone: tech.phone },
        defaults: { ...data, categoryId: catMap[category] },
      });
      techMap[tech.phone] = t.id;
      if (isNew) { created++; console.log(`  ✅ ${t.name} (${category})`); }
      else existing++;
    }

    // 3. Assign technicians to first project found
    console.log('\n🏗️  Assigning technicians to projects...');
    const projects = await Project.findAll({ limit: 3 });
    if (projects.length > 0) {
      for (const project of projects) {
        // Assign first 10 technicians to each project
        const techs = await Technician.findAll({ limit: 10, order: [['name', 'ASC']] });
        for (const tech of techs) {
          await ProjectTechnician.findOrCreate({
            where: { projectId: project.id, technicianId: tech.id },
            defaults: { projectId: project.id, technicianId: tech.id, isActive: true },
          });
        }
        console.log(`  ✅ Assigned ${techs.length} technicians to ${project.name}`);
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ SEED COMPLETE!`);
    console.log(`   Categories:  ${CATEGORIES.length}`);
    console.log(`   Technicians: ${created} created, ${existing} already existed`);
    console.log(`${'='.repeat(50)}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
