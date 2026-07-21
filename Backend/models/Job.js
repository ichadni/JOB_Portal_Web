// Backend/models/Job.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Job = sequelize.define("Job", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  salary: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'expired', 'rejected'),
    defaultValue: 'pending',
  },
  posted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'jobs',
  timestamps: false,
});

Job.belongsTo(User, { foreignKey: 'posted_by', as: 'poster' });
User.hasMany(Job, { foreignKey: 'posted_by', as: 'jobs' });

// Static methods for job operations
Job.searchJobs = async function({ query, page = 1, limit = 10, filters = {} }) {
  const offset = (page - 1) * limit;
  // ----homepage active--
  const whereClause = { status: 'active' }; // Only show active jobs on homepage
  
  if (query) {
    whereClause[require('sequelize').Op.or] = [
      { title: { [require('sequelize').Op.like]: `%${query}%` } },
      { company: { [require('sequelize').Op.like]: `%${query}%` } },
      { description: { [require('sequelize').Op.like]: `%${query}%` } }
    ];
  }
  
  if (filters.type) whereClause.type = filters.type;
  if (filters.location) whereClause.location = { [require('sequelize').Op.like]: `%${filters.location}%` };
  if (filters.minSalary || filters.maxSalary) {
    whereClause.salary = {};
    if (filters.minSalary) whereClause.salary[require('sequelize').Op.gte] = filters.minSalary;
    if (filters.maxSalary) whereClause.salary[require('sequelize').Op.lte] = filters.maxSalary;
  }
  
  const { count, rows } = await Job.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
  
  return { jobs: rows, total: count };
};

Job.getJobById = async function(id) {
  return await Job.findByPk(id, {
    include: [{ model: User, attributes: ['username', 'email'], as: 'poster' }]
  });
};

Job.updateJob = async function(id, fields) {
  const job = await Job.findByPk(id);
  if (!job) throw new Error('Job not found');
  
  Object.keys(fields).forEach(key => {
    if (fields[key] !== undefined) {
      job[key] = fields[key];
    }
  });
  
  await job.save();
  return job;
};

Job.deleteJob = async function(id) {
  const job = await Job.findByPk(id);
  if (!job) throw new Error('Job not found');
  await job.destroy();
};

module.exports = Job;