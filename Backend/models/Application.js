// Backend/models/Application.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const Job = require("./Job");

const Application = sequelize.define(
  "Application",
  {
    job_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    full_name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    education: DataTypes.STRING,
    experience: DataTypes.INTEGER,
    skills: DataTypes.TEXT,
    cover_letter: DataTypes.TEXT,
    resume_path: DataTypes.STRING,
    payment_method: DataTypes.STRING,
    payment_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    payment_amount: DataTypes.DECIMAL(10, 2),
    payment_transaction_id: DataTypes.STRING,
    payment_date: DataTypes.DATE,
    payment_error: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'accepted', 'rejected'),
      defaultValue: 'pending'
    }
  },
  { tableName: "applications", timestamps: true }
);

Application.belongsTo(Job, { foreignKey: "job_id" });
Application.belongsTo(User, { foreignKey: "user_id" });

// Static methods
Application.getApplicationsForJob = async function(jobId) {
  return await this.findAll({
    where: { job_id: jobId },
    include: [
      {
        model: User,
        attributes: ['id', 'username', 'email', 'mobile']
      },
      {
        model: Job,
        attributes: ['title', 'company']
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

Application.findById = async function(applicationId) {
  return await this.findByPk(applicationId);
};

Application.updatePaymentStatus = async function(applicationId, paymentData) {
  return await this.update(paymentData, {
    where: { id: applicationId }
  });
};

module.exports = Application;
