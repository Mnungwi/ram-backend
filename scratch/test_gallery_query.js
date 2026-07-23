const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    console.log('Testing admin gallery query...');
    const [rows] = await sequelize.query(`
      SELECT CONCAT('http://localhost:3000/uploads/', m.filename) AS imageUrl, 
             g.caption, g.type, g.visibility, g.displayOrder, g.id, p.name AS projectName
      FROM project_gallery g
      JOIN media_library m ON g.mediaId = m.id
      JOIN projects p ON g.projectId = p.id
      ORDER BY g.displayOrder ASC, g.createdAt DESC
    `);
    console.log('Success! Row count:', rows.length);
    console.log('Sample rows:', rows.slice(0, 3));
  } catch (err) {
    console.error('Query failed with error:', err.message || err);
  } finally {
    await sequelize.close();
  }
}

run();
