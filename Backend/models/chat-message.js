module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Message', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    text: { type: DataTypes.TEXT },
    attachment_path: { type: DataTypes.STRING },
    attachment_name: { type: DataTypes.STRING },
    delivered: { type: DataTypes.BOOLEAN, defaultValue: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    from_id: { 
      type: DataTypes.UUID, 
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    to_id: { 
      type: DataTypes.UUID, 
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  });
};
