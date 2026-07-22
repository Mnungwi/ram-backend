require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, ActivityType } = require('../models/index');

const seedActivityTypes = async () => {
  try {
    console.log('🔄 Seeding activity types...');
    await sequelize.authenticate();
    await ActivityType.sync({ alter: true });

    const types = [
      { name: 'Mobilization',     color: '#1a56db', icon: 'fa-truck',           order: 1,  description: 'Contractor mobilization and site setup' },
      { name: 'Survey',           color: '#0891b2', icon: 'fa-map',             order: 2,  description: 'Site survey and soil investigation' },
      { name: 'Design',           color: '#7c3aed', icon: 'fa-drafting-compass', order: 3, description: 'Architectural and engineering design' },
      { name: 'Procurement',      color: '#ca8a04', icon: 'fa-shopping-cart',   order: 4,  description: 'Materials and equipment procurement' },
      { name: 'Civil Works',      color: '#ea580c', icon: 'fa-hard-hat',        order: 5,  description: 'Excavation, foundation and structural works' },
      { name: 'Construction',     color: '#dc2626', icon: 'fa-building',        order: 6,  description: 'General construction activities' },
      { name: 'Electrical',       color: '#f59e0b', icon: 'fa-bolt',            order: 7,  description: 'Electrical installation works' },
      { name: 'Plumbing',         color: '#0ea5e9', icon: 'fa-water',           order: 8,  description: 'Plumbing and drainage works' },
      { name: 'HVAC',             color: '#06b6d4', icon: 'fa-wind',            order: 9,  description: 'Heating, ventilation and air conditioning' },
      { name: 'Finishing',        color: '#10b981', icon: 'fa-paint-roller',    order: 10, description: 'Interior and exterior finishing works' },
      { name: 'Landscaping',      color: '#16a34a', icon: 'fa-leaf',            order: 11, description: 'Landscaping and external works' },
      { name: 'Testing',          color: '#8b5cf6', icon: 'fa-vials',           order: 12, description: 'System testing and commissioning' },
      { name: 'Inspection',       color: '#ec4899', icon: 'fa-clipboard-check', order: 13, description: 'Site inspection and quality control' },
      { name: 'Documentation',    color: '#6366f1', icon: 'fa-file-alt',        order: 14, description: 'Documentation and reporting' },
      { name: 'Administration',   color: '#6b7280', icon: 'fa-briefcase',       order: 15, description: 'Administrative and management activities' },
      { name: 'Handover',         color: '#059669', icon: 'fa-handshake',       order: 16, description: 'Project handover and closeout' },
      { name: 'Other',            color: '#9ca3af', icon: 'fa-ellipsis-h',      order: 17, description: 'Other activities' },
    ];

    let created = 0;
    let skipped = 0;

    for (const t of types) {
      const [, wasCreated] = await ActivityType.findOrCreate({
        where: { name: t.name },
        defaults: { ...t, isActive: true },
      });
      if (wasCreated) created++;
      else skipped++;
    }

    console.log(`✅ ${created} activity types created, ${skipped} already existed.`);
    console.log('\n🎉 Activity types seed complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedActivityTypes();
