const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Hotel = require("./hotels");

const Rooms = sequelize.define("Rooms", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  hotelfk: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Hotel,
      key: "id",
    },
  },
  roomImages: {
    type: DataTypes.JSON,   // Array of images
    allowNull: true,
  },
  type:{
    type: DataTypes.ENUM('Deluxe', 'Suite', 'Standard', 'Premium'), 
    allowNull: true,
  },
  isAc: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  isWifi: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  isTv: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  maxAdults: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2
  },
  maxChildren: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
});

module.exports = Rooms;
