// Backend/config/db.js
const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "job_portal_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false
  }
);

// Test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected via Sequelize");
  } catch (err) {
    console.error("❌ Unable to connect:", err);
  }
})();

module.exports = sequelize;
