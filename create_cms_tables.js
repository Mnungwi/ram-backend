const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected!');

    // Create website_services table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS website_services (
        id CHAR(36) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        icon VARCHAR(100) NOT NULL DEFAULT 'bi-building',
        description TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('website_services table verified/created.');

    // Create website_news table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS website_news (
        id CHAR(36) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        summary TEXT,
        content TEXT,
        image VARCHAR(255),
        date DATETIME NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('website_news table verified/created.');

    // Seed website_services if empty
    const [services] = await sequelize.query('SELECT COUNT(*) as count FROM website_services');
    if (services[0].count === 0) {
      console.log('Seeding default services...');
      const defaultSvc = [
        ['1', 'Building Construction', 'bi-buildings', 'Commercial high-rise structures, residential towers, hotels, and luxury apartments.'],
        ['2', 'Infrastructure & Roads', 'bi-road-spikes', 'Highways, complex interchanges, bridges, tunnels, and structural civil works.'],
        ['3', 'Water Resources & Pipelines', 'bi-droplet', 'Irrigation canals, supply pipelines, sewerage networks, dams, and treatment plants.'],
        ['4', 'Industrial Construction', 'bi-gear-wide-connected', 'Power plants, heavy manufacturing facilities, refineries, and manufacturing parks.']
      ];
      for (const svc of defaultSvc) {
        await sequelize.query(`
          INSERT INTO website_services (id, title, icon, description, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `, { replacements: svc });
      }
      console.log('website_services seeded successfully.');
    }

    // Seed website_news if empty
    const [news] = await sequelize.query('SELECT COUNT(*) as count FROM website_news');
    if (news[0].count === 0) {
      console.log('Seeding default news...');
      const defaultNews = [
        ['1', 'United Ram Wins New 120km Highway Contract', 'Tenders', 'We are proud to announce the contract award for the regional highway construction project.', 'Full contract specifications and geotech surveying is already underway by our internal team.', '/project3.jpg'],
        ['2', 'Adopting Drone technology in Project Monitoring', 'Innovation', 'Integrating autonomous drone mapping into daily supervision workflows to boost project speed.', 'Using aerial photogrammetry maps allows site surveyors to calculate exact volumetric cut/fill earthwork instantly.', '/project3.jpg']
      ];
      for (const n of defaultNews) {
        await sequelize.query(`
          INSERT INTO website_news (id, title, category, summary, content, image, date, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
        `, { replacements: n });
      }
      console.log('website_news seeded successfully.');
    }

    console.log('✅ Finished creating and seeding CMS tables.');
  } catch (err) {
    console.error('Error running setup:', err);
  } finally {
    await sequelize.close();
  }
}

run();
