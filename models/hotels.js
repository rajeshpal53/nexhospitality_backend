const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Hotel = sequelize.define("Hotel", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
