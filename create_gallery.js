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

    // Create table website_gallery
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS website_gallery (
        id CHAR(36) PRIMARY KEY,
        imageUrl VARCHAR(500) NOT NULL,
        caption VARCHAR(255) NULL,
        type ENUM('photo', 'drone') DEFAULT 'photo',
        visibility ENUM('public', 'private') DEFAULT 'public',
        displayOrder INT DEFAULT 0,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);
    console.log('website_gallery table created or verified.');

    // Seed table
    const items = [
      { id: uuidv4(), imageUrl: '/malindi2.jpg', caption: 'ZSSF Malindi Car Parking Project Zanzibar', type: 'photo', visibility: 'public', displayOrder: 1 },
      { id: uuidv4(), imageUrl: '/mbweni-4.png', caption: 'Proposed Sport and Business Facilities at Mbweni', type: 'photo', visibility: 'public', displayOrder: 2 },
      { id: uuidv4(), imageUrl: '/tunguu1.jpg', caption: 'Warehouse Construction Site at Tunguu Zanzibar', type: 'drone', visibility: 'public', displayOrder: 3 },
      { id: uuidv4(), imageUrl: '/kengeja.jpg', caption: 'Kengeja Technical Secondary School Hostel Building', type: 'drone', visibility: 'public', displayOrder: 4 }
    ];

    for (const item of items) {
      const [exists] = await sequelize.query(`
        SELECT id FROM website_gallery WHERE imageUrl = ?
      `, { replacements: [item.imageUrl] });

      if (exists && exists.length > 0) {
        console.log(`Item already exists: ${item.imageUrl}`);
      } else {
        await sequelize.query(`
          INSERT INTO website_gallery (id, imageUrl, caption, type, visibility, displayOrder, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [item.id, item.imageUrl, item.caption, item.type, item.visibility, item.displayOrder]
        });
        console.log(`Seeded item: ${item.imageUrl}`);
      }
    }

    console.log('Gallery seeding completed successfully.');
  } catch (err) {
    console.error('Error running gallery setup:', err);
  } finally {
    await sequelize.close();
  }
}

run();
