const { DataTypes } = require('sequelize');
const db = require('../config/db');
const User = require('./User');

const Notification = db.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('application_status', 'job_alert', 'profile_update', 'system', 'interview'),
    defaultValue: 'system'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notifications',
  timestamps: false
});

User.hasMany(Notification, { foreignKey: 'user_id', sourceKey: 'id' });
Notification.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });

module.exports = Notification;