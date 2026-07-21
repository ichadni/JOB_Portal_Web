const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

// Use SQLite for development if MySQL is not available
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // SQLite database file
  logging: true,
});
module.exports = sequelize;