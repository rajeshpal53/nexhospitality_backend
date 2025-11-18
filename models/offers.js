const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Hotel = require("./hotels");

const Offer = sequelize.define("Offer", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  offerCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  description: {
    type: DataTypes.STRING,
  },

  hotelfk: {
    type: DataTypes.INTEGER,
    references: {
      model: Hotel,
      key: "id",
    },
  },
});

module.exports = Offer;