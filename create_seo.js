const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

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

    // Create table seo_settings
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id CHAR(36) PRIMARY KEY,
        pageKey VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        keywords VARCHAR(500) NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);
    console.log('seo_settings table created or verified.');

    // Seed default values
    const defaultSEO = [
      {
        pageKey: 'home',
        title: 'United Ram Construction - Elite Civil Engineering & Infrastructure Solutions',
        description: 'United Ram Construction Company is a premier contractor in East Africa, offering elite structural civil engineering, building construction, roads, pipelines, and industrial project delivery.',
        keywords: 'construction, civil engineering, roads zanzibar, building contractor, water pipelines, united ram'
      },
      {
        pageKey: 'about',
        title: 'About Us - Engineering Trust and Infrastructure Excellence | United Ram',
        description: 'Learn about United Ram incorporated under Zanzibar Companies Decree. Discover our vision, mission, values, board of directors and executive management team.',
        keywords: 'united ram directors, mohammed muhiddin chache, zanzibar construction, company values'
      },
      {
        pageKey: 'services',
        title: 'Our Civil Engineering & Construction Services | United Ram',
        description: 'Explore our specialized services including civil construction, high-rise buildings, road paving, water network pipelines, and industrial godowns/factories.',
        keywords: 'civil construction, water supply networks, road paving, warehouse construction'
      },
      {
        pageKey: 'projects',
        title: 'Project Portfolio - Landmark Infrastructure and Civil Works | United Ram',
        description: 'Browse our complete execution archive containing 23 iconic projects including ZSSF Malindi Car Parking, Mbweni Sport Facilities, and Tunguu Warehouse.',
        keywords: 'zssf malindi, mbweni project, tunguu secondary, kengeja technical secondary'
      },
      {
        pageKey: 'gallery',
        title: 'Media Gallery - Project Milestones & Site Photos | United Ram',
        description: 'Visual showcase and media gallery of United Ram construction sites, drone snapshots, and engineering milestones.',
        keywords: 'site photos, drone construction, engineering gallery, project photos'
      },
      {
        pageKey: 'news',
        title: 'Company News, Bid Updates & Official Announcements | United Ram',
        description: 'Read the latest updates from United Ram. Stay informed about tender awards, new technologies, and corporate events.',
        keywords: 'news construction, tender zanzibar, company bids'
      },
      {
        pageKey: 'careers',
        title: 'Careers & Vacancies - Join our Engineering Team | United Ram',
        description: 'Build your career with United Ram. Apply online to join our team of civil engineers, operators, and project managers.',
        keywords: 'construction jobs, engineering vacancies, work in zanzibar, civil engineer careers'
      },
      {
        pageKey: 'contact',
        title: 'Contact United Ram Offices - Request a Free Construction Quote',
        description: 'Get in touch with United Ram engineering experts. Submit online inquiries, find office telephone contacts, map locations and email directions.',
        keywords: 'contact united ram, quote request, zanzibar office, builder contact'
      }
    ];

    for (const item of defaultSEO) {
      const [exists] = await sequelize.query(`
        SELECT id FROM seo_settings WHERE pageKey = ?
      `, { replacements: [item.pageKey] });

      if (exists && exists.length > 0) {
        // Update to make sure it is seeded correctly
        await sequelize.query(`
          UPDATE seo_settings 
          SET title = ?, description = ?, keywords = ?, updatedAt = NOW()
          WHERE pageKey = ?
        `, {
          replacements: [item.title, item.description, item.keywords, item.pageKey]
        });
        console.log(`Updated default SEO for: ${item.pageKey}`);
      } else {
        await sequelize.query(`
          INSERT INTO seo_settings (id, pageKey, title, description, keywords, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [uuidv4(), item.pageKey, item.title, item.description, item.keywords]
        });
        console.log(`Seeded SEO for: ${item.pageKey}`);
      }
    }

    console.log('SEO Database management table seeded successfully.');
  } catch (err) {
    console.error('Error running SEO setup:', err);
  } finally {
    await sequelize.close();
  }
}

run();
