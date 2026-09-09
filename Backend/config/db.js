// Backend/config/db.js
const path = require("path");
const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const createMysqlSequelize = () => {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    return new Sequelize(dbUrl, {
      dialect: "mysql",
      dialectOptions: {
        connectTimeout: 10000
      },
      logging: false
    });
  }

  return new Sequelize(
    process.env.DB_NAME || "job_portal_db",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      dialect: "mysql",
      dialectOptions: {
        connectTimeout: 10000
      },
      logging: false
    }
  );
};

const createSqliteSequelize = () =>
  new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "database.sqlite"),
    dialectModule: require("better-sqlite3"),
    logging: false
  });

const sequelize =
  process.env.USE_SQLITE === "true" || (!process.env.DATABASE_URL && !process.env.DB_HOST && !process.env.DB_USER && !process.env.DB_NAME)
    ? createSqliteSequelize()
    : createMysqlSequelize();

module.exports = sequelize;
