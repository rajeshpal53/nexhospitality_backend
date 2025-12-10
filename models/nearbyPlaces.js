const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Hotel = require("./hotels");

const NearbyPlaces = sequelize.define("NearbyPlaces", {
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

  details: {
    type: DataTypes.TEXT,
    allowNull: true,
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

  nearbyImages: {
    type: DataTypes.JSON,
    allowNull: true,
  },
},
);

module.exports = NearbyPlaces;
