// ══════════════════════════════════════════════════════════════
// seed_missing_settings.js
// Idempotent: seeds every `website_settings` key that the Angular frontend
// already expects/reads but that was never actually inserted into the DB
// (the naming convention existed in code, the rows didn't). Uses
// INSERT IGNORE so it is always safe to re-run — it never overwrites a key
// an admin has already customised. Run with: node seed_missing_settings.js
// ══════════════════════════════════════════════════════════════

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

const boardDirectors = [
  { name: 'ALI MUHIDDIN CHACHE', role: 'Director', phone: '+255 777 412 337', email: 'managing_director@unitedram.com', photo: '/cropped-logo.png' },
  { name: 'MOHAMMED M. CHACHE', role: 'Managing Director', phone: '+255 777 412 337', email: 'managing_director@unitedram.com', photo: '/managing-director.jpg' },
  { name: 'MAKAME MUHIDDIN CHACHE', role: 'Director', phone: '+255 777 471 849', email: 'info@unitedram.com', photo: '/cropped-logo.png' }
];

const managementTeam = [
  { name: 'FALHIYA MOHAMMED MUHIDDIN', role: 'Procurement Manager', phone: '+255 777 250 625', email: 'procurement@unitedram.com', photo: '/cropped-logo.png' },
  { name: 'MUHIDINI MASOUD MALIK', role: 'Project Manager', phone: '+255 777 988 498', email: 'project_manager@unitedram.com', photo: '/cropped-logo.png' },
  { name: 'HAMIS MATINA LUTOBEKA', role: 'Quantity Surveyor', phone: '+255 622 261 824', email: 'qs@unitedram.com', photo: '/cropped-logo.png' }
];

const accordionProjects = [
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

const footerServices = ['Building Construction', 'Road & Bridges Infrastructure', 'Water supply & Pipelines', 'Industrial Facilities'];

const defaults = [
  // Header / Footer / global branding
  ['site_title', 'United Ram Construction Company Limited'],
  ['site_logo', '/logo.png'],
  ['site_favicon', '/favicon.ico'],
  ['contact_email', 'info@unitedram.com'],
  ['contact_phone', '+255 777 471 849'],
  ['contact_address', 'Mbweni, Zanzibar, Tanzania'],
  ['social_facebook', '#'],
  ['social_twitter', '#'],
  ['social_instagram', '#'],
  ['social_linkedin', '#'],
  ['footer_copyright', '© 2026 United Ram Construction Company Ltd. All rights reserved.'],
  ['footer_about_text', 'Premier contractor in heavy civil, engineering design, road rehabilitation, and public building construction across Zanzibar & East Africa.'],
  ['footer_services_json', JSON.stringify(footerServices)],
  ['footer_whatsapp_number', '255777412337'],
  ['footer_staff_mail_url', 'http://mail.unitedram.com'],

  // Pemba office (previously shared the Zanzibar office's contact info with no override)
  ['contact_pemba_address', 'Chamanangwe, Pemba, Zanzibar'],
  ['contact_pemba_phone', '+255 777 471 849'],
  ['contact_pemba_email', 'info@unitedram.com'],

  // About page — company name heading + MD + leadership
  ['about_company_name', 'United Ram Construction Company Ltd'],
  ['about_md_name', 'MOHAMMED MUHIDDIN CHACHE'],
  ['about_md_quote', 'Our journey has been defined by our commitment to engineering excellence. We continue to adapt to sustainable development goals, ensuring that every bridge, road, and building we erect is built for generations to come.'],
  ['about_md_photo', '/managing-director.jpg'],
  ['about_md_phone', '+255 777 412 337'],
  ['about_md_email', 'managing_director@unitedram.com'],
  ['about_board_directors_json', JSON.stringify(boardDirectors)],
  ['about_management_team_json', JSON.stringify(managementTeam)],

  // Home page section headings + CTA + accordion + partners
  ['home_cta_title', "LET'S MAKE SOMETHING TOGETHER"],
  ['home_cta_subtitle', 'Get in touch with us and send some basic info for a quick quote'],
  ['home_showcase_subtitle', 'Focus Showcase'],
  ['home_showcase_title', 'Our Major Landmark Works'],
  ['home_services_subtitle', 'What We Do'],
  ['home_services_title', 'Our Engineering Expertise'],
  ['home_projects_subtitle', 'Our Works'],
  ['home_projects_title', 'Featured Infrastructure'],
  ['home_accordion_json', JSON.stringify(accordionProjects)],
  ['home_partners_json', JSON.stringify(partners)],

  // Page banners
  ['banner_about', '/project3.jpg'],
  ['banner_services', '/project3.jpg'],
  ['banner_projects', '/project3.jpg'],
  ['banner_gallery', '/project3.jpg'],
  ['banner_careers', '/project3.jpg'],
  ['banner_contact', '/project3.jpg'],
];

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log(`Seeding ${defaults.length} website_settings keys (existing keys are left untouched)...`);

    let inserted = 0;
    for (const [key, value] of defaults) {
      const [, meta] = await sequelize.query(
        'INSERT IGNORE INTO website_settings (`key`, `value`, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
        { replacements: [key, value] }
      );
      if (meta && meta.affectedRows > 0) inserted++;
    }

    console.log(`✅ Done. ${inserted} new key(s) inserted, ${defaults.length - inserted} already existed and were left as-is.`);
  } catch (err) {
    console.error('Error seeding settings:', err);
  } finally {
    await sequelize.close();
  }
}

run();
