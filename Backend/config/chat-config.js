require('dotenv').config();

module.exports = {
  port: process.env.CHAT_PORT || 5002,
  db: {
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'mysql'
  },
  jwtSecret: process.env.JWT_SECRET || 'supersecret'
};
