const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Hotel = require("./hotels");
const User = require("./users");

const Customer = sequelize.define("Customer", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  hotelfk: {
    type: DataTypes.INTEGER,
    references: {
      model: Hotel,
      key: "id",
    },
  },

  userfk: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: "id",
    },
  },

  details: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Customer;