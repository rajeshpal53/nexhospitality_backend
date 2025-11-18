const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
 
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },

  aadharCard: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: {
      len: [12, 12],
      isNumeric: true,
    },
  },

  aadharCardFronturl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  aadharCardBackurl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
    isNumeric: true,
    len: [10, 10],
    }
  },

  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
    isEmail: true,
  }
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
    len: [6, 100]
  }
  },

  token_validity: {
    type: DataTypes.DATE, 
    allowNull: true,
    defaultValue: null, 
  },

  role:{
    type: DataTypes.ENUM('admin', 'user'), 
    allowNull: true,
    defaultValue: 'user',
  },

  latitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },

  longitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },

  profilePicUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  fcmtokens: {
    type: DataTypes.JSON,
  },

});

module.exports = User;
