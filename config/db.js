const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  pool: {
    max: 20,        // Increase available connections
    min: 0,
    acquire: 30000, // Wait up to 30 seconds to get a connection
    idle: 10000      // Release idle connections faster
  },
  dialectOptions: {
    connectTimeout: 10000 // MySQL connection timeout in ms
  },
  logging: false,
});

sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err));

module.exports = sequelize;
