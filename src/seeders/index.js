require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const { PERMISSIONS, ROLE_PERMISSIONS } = require('../config/permissions');

// Models
const { User, Role, Permission, UserRole, RolePermission } = require('../models/index');

const ROLES = [
  { name: 'Super Admin',     slug: 'super_admin',     description: 'Full system access. Cannot be restricted.',            isSystem: true, color: '#dc2626' },
  { name: 'Admin',           slug: 'admin',           description: 'Administrative access to all modules.',               isSystem: true, color: '#9333ea' },
  { name: 'Project Manager', slug: 'project_manager', description: 'Manages projects, activities, reports, and team.',    isSystem: true, color: '#2563eb' },
  { name: 'Site Engineer',   slug: 'site_engineer',   description: 'Field-level access. Creates activities and reports.',  isSystem: true, color: '#16a34a' },
  { name: 'Quantity Surveyor', slug: 'quantity_surveyor', description: 'Procurement and budget management.',              isSystem: true, color: '#ca8a04' },
  { name: 'Finance Officer', slug: 'finance_officer', description: 'Finance, invoices, payments and budget.',              isSystem: true, color: '#0891b2' },
  { name: 'Storekeeper',     slug: 'storekeeper',     description: 'Manages project store inventory, receiving and issuing of materials.', isSystem: true, color: '#ea580c' },
  { name: 'Viewer',          slug: 'viewer',          description: 'Read-only access to assigned projects.',              isSystem: true, color: '#6b7280' },
  { name: 'Website Manager', slug: 'website_manager', description: 'Manages public website content, gallery, SEO and the contact inbox — nothing else.', isSystem: true, color: '#0ea5e9' },
];

const PERMISSION_GROUPS = {
  Projects: ["project"],
  Activities: ["activity"],
  Procurement: ["procurement", "contract", "purchase_order", "supplier"],
  Finance: ["finance", "invoice", "payment", "budget", "expense"],
  Reports: ["report"],
  Documents: ["document"],
  Team: ["team"],
  Users: ["user"],
  Roles: ["role", "permission"],
  Settings: ["settings"],
  Clients: ["client"],
};

const getGroup = (resource) => {
  for (const [group, resources] of Object.entries(PERMISSION_GROUPS)) {
    if (resources.includes(resource)) return group;
  }
  return 'Other';
};

const seed = async () => {
  try {
    console.log('🌱 Starting seed...');
    await sequelize.authenticate();

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced');

    // ── 1. Seed Permissions ──────────────────────────────
    console.log('📋 Seeding permissions...');
    const permEntries = Object.values(PERMISSIONS).map(name => {
      const [resource, action] = name.split(':');
      return { name, resource, action, group: getGroup(resource), description: `${action} on ${resource}` };
    });

    for (const p of permEntries) {
      await Permission.findOrCreate({ where: { name: p.name }, defaults: p });
    }
    console.log(`  ✅ ${permEntries.length} permissions seeded`);

    // ── 2. Seed Roles ────────────────────────────────────
    console.log('🎭 Seeding roles...');
    const roleMap = {};
    for (const r of ROLES) {
      const [role] = await Role.findOrCreate({ where: { slug: r.slug }, defaults: r });
      roleMap[r.slug] = role;
    }
    console.log(`  ✅ ${ROLES.length} roles seeded`);

    // ── 3. Assign permissions to roles ───────────────────
    console.log('🔗 Assigning role permissions...');
    for (const [roleSlug, permNames] of Object.entries(ROLE_PERMISSIONS)) {
      const role = roleMap[roleSlug];
      if (!role) continue;

      await RolePermission.destroy({ where: { roleId: role.id } });

      const perms = await Permission.findAll({ where: { name: permNames } });
      if (perms.length > 0) {
        await RolePermission.bulkCreate(
          perms.map(p => ({ roleId: role.id, permissionId: p.id })),
          { ignoreDuplicates: true }
        );
      }
      console.log(`  → ${roleSlug}: ${perms.length} permissions`);
    }

    // ── 4. Seed Super Admin User ─────────────────────────
    console.log('👤 Seeding super admin...');
    const [superAdmin, created] = await User.unscoped().findOrCreate({
      where: { email: 'admin@ram.co.tz' },
      defaults: {
        firstName: 'Ali',
        lastName: 'Mohamed',
        email: 'admin@ram.co.tz',
        password: 'Admin@1234',
        jobTitle: 'Project Manager',
        department: 'Management',
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (created) {
      const superAdminRole = roleMap['super_admin'];
      await UserRole.findOrCreate({
        where: { userId: superAdmin.id, roleId: superAdminRole.id, projectId: null },
        defaults: { userId: superAdmin.id, roleId: superAdminRole.id },
      });
      console.log('  ✅ Super admin created: admin@ram.co.tz / Admin@1234');
    } else {
      console.log('  ℹ️  Super admin already exists');
    }

    // ── 5. Seed Demo Users ───────────────────────────────
    const demoUsers = [
      { firstName: 'Hassan',  lastName: 'Juma',  email: 'hassan@ram.co.tz',  password: 'Demo@1234', jobTitle: 'Site Engineer',    roleSlug: 'site_engineer' },
      { firstName: 'Salim',   lastName: 'Ali',   email: 'salim@ram.co.tz',   password: 'Demo@1234', jobTitle: 'MEP Engineer',      roleSlug: 'site_engineer' },
      { firstName: 'Fatma',   lastName: 'Salum', email: 'fatma@ram.co.tz',   password: 'Demo@1234', jobTitle: 'Finance Officer',   roleSlug: 'finance_officer' },
      { firstName: 'Mohamed', lastName: 'Said',  email: 'msaid@ram.co.tz',   password: 'Demo@1234', jobTitle: 'Quantity Surveyor', roleSlug: 'quantity_surveyor' },
    ];

    for (const u of demoUsers) {
      const { roleSlug, ...userData } = u;
      const [demoUser] = await User.unscoped().findOrCreate({ where: { email: u.email }, defaults: { ...userData, isActive: true, isEmailVerified: true } });
      const role = roleMap[roleSlug];
      if (role) {
        await UserRole.findOrCreate({
          where: { userId: demoUser.id, roleId: role.id, projectId: null },
          defaults: { userId: demoUser.id, roleId: role.id },
        });
      }
    }
    console.log(`  ✅ ${demoUsers.length} demo users seeded`);

    console.log('\n🎉 Seed complete!\n');
    console.log('─'.repeat(40));
    console.log('Super Admin  → admin@ram.co.tz / Admin@1234');
    console.log('Demo Users   → [name]@ram.co.tz / Demo@1234');
    console.log('─'.repeat(40));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
// This file is extended by the main seed() call above.
// Additional seed helpers are appended here.
