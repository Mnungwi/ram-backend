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

    // Alter project_gallery to add visibility and type columns if they don't exist
    try {
      await sequelize.query(`
        ALTER TABLE project_gallery 
        ADD COLUMN visibility ENUM('public', 'private') DEFAULT 'public',
        ADD COLUMN type VARCHAR(50) DEFAULT 'photo'
      `);
      console.log('✅ Successfully altered project_gallery table to add visibility and type.');
    } catch (err) {
      console.log('project_gallery table already altered or columns exist:', err.message);
    }

    // Drop website_gallery table to avoid duplicates!
    try {
      await sequelize.query('DROP TABLE IF EXISTS website_gallery');
      console.log('✅ Successfully dropped duplicate website_gallery table.');
    } catch (err) {
      console.log('Error dropping website_gallery table:', err.message);
    }

    // Check existing records in project_gallery and insert fallback records if it is empty
    const [rows] = await sequelize.query('SELECT COUNT(*) as count FROM project_gallery');
    if (rows[0].count === 0) {
      console.log('project_gallery is empty. Seeding with dummy images...');
      // Get some projects and media or use uuid placeholders
      const [projects] = await sequelize.query('SELECT id FROM projects LIMIT 1');
      const [media] = await sequelize.query('SELECT id FROM media_library LIMIT 5');

      if (projects.length > 0 && media.length > 0) {
        const pId = projects[0].id;
        for (let i = 0; i < media.length; i++) {
          const mId = media[i].id;
          const caption = `Construction Gallery Image ${i + 1}`;
          const type = i % 2 === 0 ? 'photo' : 'drone';
          await sequelize.query(`
            INSERT INTO project_gallery (id, projectId, mediaId, displayOrder, caption, visibility, type, createdAt, updatedAt)
            VALUES (UUID(), ?, ?, ?, ?, 'public', ?, NOW(), NOW())
          `, {
            replacements: [pId, mId, i, caption, type]
          });
        }
        console.log('✅ Seeded project_gallery successfully!');
      } else {
        console.log('No projects or media_library items to bind. Skipping seed.');
      }
    }

  } catch (err) {
    console.error('Error executing alter script:', err);
  } finally {
    await sequelize.close();
  }
}

run();
