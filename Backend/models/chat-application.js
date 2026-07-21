module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Application', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    cover_letter: { type: DataTypes.TEXT },
    resume_path: { type: DataTypes.STRING },
    full_name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    education: { type: DataTypes.STRING },
    experience: { type: DataTypes.INTEGER },
    skills: { type: DataTypes.TEXT },
    payment_method: { type: DataTypes.STRING },
    payment_status: { type: DataTypes.ENUM('pending','completed','failed'), defaultValue: 'pending' },
    payment_amount: { type: DataTypes.DECIMAL(10,2) },
    payment_transaction_id: { type: DataTypes.STRING },
    payment_date: { type: DataTypes.DATE },
    payment_error: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('pending','reviewed','accepted','rejected'), defaultValue: 'pending' }
  });
};
