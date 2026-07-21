const { Sequelize } = require('sequelize');
const config = require('../config/chat-config');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    dialect: config.db.dialect,
    logging: false
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./chat-user')(sequelize, Sequelize);
db.Job = require('./chat-job')(sequelize, Sequelize);
db.Application = require('./chat-application')(sequelize, Sequelize);
db.Message = require('./chat-message')(sequelize, Sequelize);

// Associations
db.User.hasMany(db.Job, { foreignKey: 'posted_by' });
db.Job.belongsTo(db.User, { foreignKey: 'posted_by' });

db.User.hasMany(db.Application, { foreignKey: 'user_id' });
db.Application.belongsTo(db.User, { foreignKey: 'user_id' });
db.Job.hasMany(db.Application, { foreignKey: 'job_id' });
db.Application.belongsTo(db.Job, { foreignKey: 'job_id' });

db.User.hasMany(db.Message, { foreignKey: 'from_id', as: 'SentMessages' });
db.User.hasMany(db.Message, { foreignKey: 'to_id', as: 'ReceivedMessages' });
db.Message.belongsTo(db.User, { foreignKey: 'from_id', as: 'Sender' });
db.Message.belongsTo(db.User, { foreignKey: 'to_id', as: 'Receiver' });

module.exports = db;
