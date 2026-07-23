const { sequelize } = require('../src/config/database');

console.log('Dialect:', sequelize.options.dialect);
console.log('Database:', sequelize.config.database);
console.log('Username:', sequelize.config.username);
console.log('Password:', sequelize.config.password);
console.log('Host:', sequelize.config.host);
console.log('Port:', sequelize.config.port);
console.log('Environment DB_NAME:', process.env.DB_NAME);
console.log('Environment DB_HOST:', process.env.DB_HOST);
console.log('Environment DB_PORT:', process.env.DB_PORT);
console.log('Environment DB_USER:', process.env.DB_USER);

sequelize.close();
