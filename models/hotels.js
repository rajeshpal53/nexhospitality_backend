const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Hotel = sequelize.define("Hotel", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  whatsappnumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      len: [10, 10], // Ensure it's exactly 10 digits
      isNumeric: true, // Ensure only numeric values
    },
  },

  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  hotelName: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  latitude: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  longitude: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  hotelImages: {
    type: DataTypes.JSON,   // Array of images
    allowNull: true,
  },
});

module.exports = Hotel;
