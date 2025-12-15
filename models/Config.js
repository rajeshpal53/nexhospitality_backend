const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this path points to your Sequelize configuration

const Config = sequelize.define('Config', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  configKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // e.g. "RAZORPAY_KEY_ID"
  },
  configValue: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  environment: {
    type: DataTypes.ENUM('TEST', 'LIVE'),
    defaultValue: 'TEST',
  },
  description: {
    type: DataTypes.STRING,
  },
});

sequelize.sync()
  .then(() => console.log('Service table has been synced'))
  .catch(err => console.log('Error: ' + err));

module.exports = Config;
