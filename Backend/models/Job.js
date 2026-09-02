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

// ============================================
// RELATIONSHIPS
// ============================================
Job.belongsTo(User, { foreignKey: 'posted_by', as: 'poster' });
User.hasMany(Job, { foreignKey: 'posted_by', as: 'jobs' });

// ============================================
// STATIC METHODS
// ============================================

// Search jobs with filters
Job.searchJobs = async function({ query, page = 1, limit = 10, filters = {} }) {
  const offset = (page - 1) * limit;
  const { Op } = require("sequelize");
  
  const whereClause = { status: 'active' };
  
  if (query) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${query}%` } },
      { company: { [Op.like]: `%${query}%` } },
      { description: { [Op.like]: `%${query}%` } }
    ];
  }
  
  if (filters.type) whereClause.type = filters.type;
  if (filters.location) whereClause.location = { [Op.like]: `%${filters.location}%` };
  
  if (filters.minSalary || filters.maxSalary) {
    whereClause.salary = {};
    if (filters.minSalary) whereClause.salary[Op.gte] = filters.minSalary;
    if (filters.maxSalary) whereClause.salary[Op.lte] = filters.maxSalary;
  }
  
  const { count, rows } = await Job.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [{ 
      model: User, 
      attributes: ['id', 'username', 'email'], 
      as: 'poster' 
    }]
  });
  
  return { jobs: rows, total: count };
};

// Get job by ID with poster info
Job.getJobById = async function(id) {
  return await Job.findByPk(id, {
    include: [{ 
      model: User, 
      attributes: ['id', 'username', 'email'], 
      as: 'poster' 
    }]
  });
};

// Update job
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

// Delete job (will cascade delete applications via database)
Job.deleteJob = async function(id) {
  const job = await Job.findByPk(id);
  if (!job) throw new Error('Job not found');
  await job.destroy();
};

// Get recruiter stats
Job.getRecruiterStats = async function(recruiterId) {
  try {
    const totalJobs = await Job.count({
      where: { posted_by: recruiterId }
    });

    const activeJobs = await Job.count({
      where: { 
        posted_by: recruiterId,
        status: 'active'
      }
    });

    const pendingJobs = await Job.count({
      where: { 
        posted_by: recruiterId,
        status: 'pending'
      }
    });

    return {
      totalJobs,
      activeJobs,
      pendingJobs
    };
  } catch (error) {
    console.error('Get recruiter stats error:', error);
    return { totalJobs: 0, activeJobs: 0, pendingJobs: 0 };
  }
};

module.exports = Job;