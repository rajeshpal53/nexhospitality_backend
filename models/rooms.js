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
  }
});

module.exports = Rooms;
