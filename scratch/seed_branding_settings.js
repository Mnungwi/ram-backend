const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    console.log('Seeding branding and banner settings keys...');
    const defaults = [
      ['site_title', 'United Ram Construction Company Limited'],
      ['site_logo', '/cropped-logo.png'],
      ['site_favicon', '/cropped-logo.png'],
      ['contact_email', 'info@unitedram.com'],
      ['contact_phone', '+255 777 471 849'],
      ['contact_address', 'Mbweni, Zanzibar, Tanzania'],
      ['social_facebook', 'https://facebook.com/unitedram'],
      ['social_twitter', 'https://twitter.com/unitedram'],
      ['social_instagram', 'https://instagram.com/unitedram'],
      ['social_linkedin', 'https://linkedin.com/company/unitedram'],
      ['footer_copyright', '© 2026 United Ram Construction Company Ltd. All Rights Reserved.'],
      ['banner_about', '/project3.jpg'],
      ['banner_services', '/project3.jpg'],
      ['banner_projects', '/project3.jpg'],
      ['banner_gallery', '/project3.jpg'],
      ['banner_careers', '/project3.jpg'],
      ['banner_contact', '/project3.jpg']
    ];

    for (const [key, val] of defaults) {
      await sequelize.query(`
        INSERT INTO website_settings (\`key\`, \`value\`, createdAt, updatedAt)
        VALUES (?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updatedAt = NOW()
      `, { replacements: [key, val] });
    }
    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await sequelize.close();
  }
}

run();
