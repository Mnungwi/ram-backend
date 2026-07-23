const { sequelize } = require('../src/config/database');

async function run() {
  try {
    console.log('Connecting using backend Sequelize config...');
    await sequelize.authenticate();
    console.log('Connected successfully to database:', sequelize.config.database);

    // 1. Fix project_gallery columns
    console.log('Checking project_gallery columns...');
    const [cols] = await sequelize.query('SHOW COLUMNS FROM project_gallery');
    const columnNames = cols.map(c => c.Field);
    
    if (!columnNames.includes('type')) {
      await sequelize.query("ALTER TABLE project_gallery ADD COLUMN type VARCHAR(50) DEFAULT 'photo' AFTER caption");
      console.log('Column "type" added.');
    } else {
      console.log('Column "type" already exists.');
    }

    if (!columnNames.includes('visibility')) {
      await sequelize.query("ALTER TABLE project_gallery ADD COLUMN visibility ENUM('public', 'private') DEFAULT 'public' AFTER type");
      console.log('Column "visibility" added.');
    } else {
      console.log('Column "visibility" already exists.');
    }

    // 2. website_settings table creation and seed
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS website_settings (
        \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
        \`value\` TEXT,
        createdAt DATETIME,
        updatedAt DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('website_settings table verified.');

    // 3. website_careers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS website_careers (
        id CHAR(36) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'Full-time',
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('website_careers table verified.');

    // 4. website_faqs table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS website_faqs (
        id CHAR(36) NOT NULL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        displayOrder INT DEFAULT 0,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('website_faqs table verified.');

    // Seed website_settings if empty
    const [settings] = await sequelize.query('SELECT COUNT(*) as count FROM website_settings');
    if (settings[0].count === 0) {
      console.log('Seeding default website settings...');
      const defaultSettings = [
        ['about_who_we_are', 'United Ram Construction Company Limited (URCCL) is a premier heavy civil engineering and building construction company registered in Zanzibar, Tanzania. Over the years, we have delivered landmark infrastructure projects across the region, earning a reputation for technical excellence, safety, and reliability.'],
        ['about_vision', 'To be the leading heavy civil and structural construction company in East Africa, recognized for engineering innovation, quality delivery, and sustainable development.'],
        ['about_mission', 'To deliver world-class infrastructure projects with technical precision, adhering to timelines and budgets, while maintaining safety, professional integrity, and corporate social responsibility.'],
        ['about_core_values', 'Integrity, Quality, Engineering Innovation, Safety, Sustainability'],
        ['stats_years_experience', '15'],
        ['stats_completed_projects', '74'],
        ['stats_active_equipment', '32'],
        ['stats_engineers', '18'],
        ['hero_slider_json', JSON.stringify([
          { title: "Engineering Infrastructure Excellence", subtitle: "Delivering world-class heavy civil, pipeline, and structural projects across Zanzibar & East Africa.", image: "/project3.jpg" },
          { title: "Elite Concrete & Asphalt Works", subtitle: "Highways, airports, and marine terminal paving designed to withstand regional maritime climates.", image: "/tunguu1.jpg" },
          { title: "Advanced Water supply Networks", subtitle: "Rehabilitating deep pipelines, pump stations, and wastewater treatment infrastructure.", image: "/malindi2.jpg" }
        ])]
      ];
      for (const entry of defaultSettings) {
        await sequelize.query(`
          INSERT INTO website_settings (\`key\`, \`value\`, createdAt, updatedAt)
          VALUES (?, ?, NOW(), NOW())
        `, { replacements: entry });
      }
      console.log('website_settings seeded.');
    }

    // Seed website_careers if empty
    const [careers] = await sequelize.query('SELECT COUNT(*) as count FROM website_careers');
    if (careers[0].count === 0) {
      console.log('Seeding default website careers...');
      const defaultCareers = [
        ['c1', 'Senior Civil Site Engineer', 'Engineering', 'Zanzibar Office', 'Full-time', 'Responsible for structural site supervision, coordinate equipment logistics, and manage subcontractor schedules.', 'active'],
        ['c2', 'Asphalt Paving Supervisor', 'Operations', 'Mbweni Site', 'Contract', 'Direct paving operations, supervise raw material mix quality, and manage crew safety on-site.', 'active']
      ];
      for (const entry of defaultCareers) {
        await sequelize.query(`
          INSERT INTO website_careers (id, title, department, location, type, description, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, { replacements: entry });
      }
      console.log('website_careers seeded.');
    }

    // Seed website_faqs if empty
    const [faqs] = await sequelize.query('SELECT COUNT(*) as count FROM website_faqs');
    if (faqs[0].count === 0) {
      console.log('Seeding default website FAQs...');
      const defaultFaqs = [
        ['f1', 'Is United Ram Construction registered for government bids?', 'Yes, United Ram Construction holds Class I registration with the Zanzibar Contractors Registration Board for Civil, Building, and Road Works.', 0],
        ['f2', 'Can we request a machinery leasing quote?', 'Certainly. We lease heavy machinery including excavators, asphalt pavers, motor graders, and concrete mixers. Contact our Mbweni office for details.', 1]
      ];
      for (const entry of defaultFaqs) {
        await sequelize.query(`
          INSERT INTO website_faqs (id, question, answer, displayOrder, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `, { replacements: entry });
      }
      console.log('website_faqs seeded.');
    }

    console.log('✅ Active DB update successfully finished.');
  } catch (err) {
    console.error('Active DB update failed:', err);
  } finally {
    await sequelize.close();
  }
}

run();
