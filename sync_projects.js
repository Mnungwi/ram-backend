const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Connect to both databases
const sourceDb = new Sequelize('ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

const targetDb = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function sync() {
  try {
    console.log('Connecting to databases...');
    await sourceDb.authenticate();
    await targetDb.authenticate();
    console.log('Connected!');

    // Fetch WordPress projects
    const [wpProjects] = await sourceDb.query(`
      SELECT ID, post_title, post_name, post_content 
      FROM wp_posts 
      WHERE post_type = 'project' AND post_status = 'publish'
    `);
    console.log(`Found ${wpProjects.length} projects in WordPress database.`);

    for (const proj of wpProjects) {
      // Find thumbnail if any
      const [meta] = await sourceDb.query(`
        SELECT meta_value FROM wp_postmeta 
        WHERE post_id = ? AND meta_key = '_thumbnail_id'
      `, { replacements: [proj.ID] });

      let imageUrl = '';
      if (meta && meta.length > 0) {
        const thumbId = meta[0].meta_value;
        const [attachments] = await sourceDb.query(`
          SELECT guid FROM wp_posts WHERE ID = ?
        `, { replacements: [thumbId] });
        if (attachments && attachments.length > 0) {
          imageUrl = attachments[0].guid;
          // Map to local public folder paths if it matches
          if (imageUrl.includes('malindi')) imageUrl = '/malindi2.jpg';
          else if (imageUrl.includes('mbweni')) imageUrl = '/mbweni-4.png';
          else if (imageUrl.includes('tunguu')) imageUrl = '/tunguu1.jpg';
          else if (imageUrl.includes('kengeja')) imageUrl = '/kengeja.jpg';
          else if (imageUrl.includes('project3')) imageUrl = '/project3.jpg';
          else {
            // Clean up to just filename or fallback
            const parts = imageUrl.split('/');
            imageUrl = '/' + parts[parts.length - 1];
            // If it doesn't exist, we fall back to /project3.jpg
            if (imageUrl === '/') imageUrl = '/project3.jpg';
          }
        }
      }

      if (!imageUrl) {
        // Dynamic fallback based on title keywords
        const lowerTitle = proj.post_title.toLowerCase();
        if (lowerTitle.includes('malindi')) imageUrl = '/malindi2.jpg';
        else if (lowerTitle.includes('mbweni')) imageUrl = '/mbweni-4.png';
        else if (lowerTitle.includes('tunguu')) imageUrl = '/tunguu1.jpg';
        else if (lowerTitle.includes('kengeja')) imageUrl = '/kengeja.jpg';
        else imageUrl = '/project3.jpg';
      }

      // Check if project already exists in united_ram
      const [existing] = await targetDb.query(`
        SELECT id FROM projects WHERE name = ?
      `, { replacements: [proj.post_title] });

      const descriptionText = proj.post_content ? proj.post_content.replace(/<[^>]*>/g, '').trim() : '';

      // Determine category based on title
      let category = 'Civil Works';
      const lowerTitle = proj.post_title.toLowerCase();
      if (lowerTitle.includes('toilet') || lowerTitle.includes('school') || lowerTitle.includes('classroom')) {
        category = 'Building Construction';
      } else if (lowerTitle.includes('road') || lowerTitle.includes('parking') || lowerTitle.includes('infrastructure')) {
        category = 'Infrastructure';
      } else if (lowerTitle.includes('warehouse') || lowerTitle.includes('godown')) {
        category = 'Industrial';
      } else if (lowerTitle.includes('water') || lowerTitle.includes('pipe')) {
        category = 'Water Supply';
      }

      // Set status
      let status = 'completed';
      if (lowerTitle.includes('proposed') || lowerTitle.includes('progress')) {
        status = 'active';
      }

      // Determine location
      let location = 'Zanzibar';
      if (lowerTitle.includes('pemba')) location = 'Pemba';
      else if (lowerTitle.includes('tumbatu')) location = 'Tumbatu';
      else if (lowerTitle.includes('tunguu')) location = 'Tunguu';
      else if (lowerTitle.includes('nungwi')) location = 'Nungwi';
      else if (lowerTitle.includes('mbweni')) location = 'Mbweni';
      else if (lowerTitle.includes('kengeja')) location = 'Kengeja';

      if (existing && existing.length > 0) {
        // Update existing project settings
        await targetDb.query(`
          UPDATE projects 
          SET image = ?, description = ?, showOnHomePage = ?, visibility = ?
          WHERE id = ?
        `, {
          replacements: [imageUrl, descriptionText || 'United Ram quality infrastructure project.', 1, 'public', existing[0].id]
        });
        console.log(`Updated project: ${proj.post_title}`);
      } else {
        // Insert new project
        const id = uuidv4();
        const code = 'PRJ-' + Math.floor(100000 + Math.random() * 90000);
        await targetDb.query(`
          INSERT INTO projects (
            id, projectCode, name, description, image, status, 
            startDate, endDate, location, totalBudget, currency, 
            progress, showOnHomePage, visibility, displayOrder, createdAt, updatedAt
          ) VALUES (
            ?, ?, ?, ?, ?, ?, 
            '2024-01-01', '2024-12-31', ?, 150000000, 'TZS', 
            100.00, ?, 'public', 0, NOW(), NOW()
          )
        `, {
          replacements: [
            id, code, proj.post_title, 
            descriptionText || 'United Ram premium engineering infrastructure construction.', 
            imageUrl, status, location, 1 // show on home page
          ]
        });
        console.log(`Inserted project: ${proj.post_title}`);
      }
    }

    console.log('✅ Synchronization completed successfully.');
  } catch (err) {
    console.error('❌ Sync failed:', err);
  } finally {
    await sourceDb.close();
    await targetDb.close();
  }
}

sync();
