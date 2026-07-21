module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Job', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    title: { type: DataTypes.STRING, allowNull: false },
    company: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
    salary: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('pending','active','expired','rejected'), defaultValue: 'pending' }
  });
};
