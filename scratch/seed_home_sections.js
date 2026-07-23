const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    console.log('Seeding home accordion, partners, and CTA settings keys...');
    
    const accordion = [
      { title: 'Malindi Car Parking', image: '/malindi2.jpg', subtitle: 'United Ram Engineering Excellency' },
      { title: 'Mbweni Road Rehab', image: '/mbweni-4.png', subtitle: 'United Ram Engineering Excellency' },
      { title: 'Tunguu Infrastructure', image: '/tunguu1.jpg', subtitle: 'United Ram Engineering Excellency' },
      { title: 'Kengeja Water Project', image: '/kengeja.jpg', subtitle: 'United Ram Engineering Excellency' }
    ];

    const partners = [
      { name: 'ZSSF', image: '/zssf.png', link: 'https://zssf.or.tz/home' },
      { name: 'WEMA', image: '/wema.png', link: 'https://moez.go.tz/' },
      { name: 'KMKM', image: '/kmkm.png', link: 'https://www.kmkmzanzibar.go.tz/' },
      { name: 'Huatan Supply Chain', image: '/wachina.png', link: 'http://huatansupplychain.com/en/index.php?c=about&a=detail&id=5' }
    ];

    const defaults = [
      ['home_accordion_json', JSON.stringify(accordion)],
      ['home_partners_json', JSON.stringify(partners)],
      ['home_cta_title', "LET'S MAKE SOMETHING TOGETHER"],
      ['home_cta_subtitle', "Get in touch with us and send some basic info for a quick quote"]
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
