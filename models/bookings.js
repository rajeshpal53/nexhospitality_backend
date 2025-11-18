const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Hotel = require("./hotels");
const Status = require("./status");
const User = require("./users");

const Booking = sequelize.define("Booking", {
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

  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  remaining: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  statusfk: {
    type: DataTypes.INTEGER,
    references: {
      model: Status,
      key: "id",
    },
  },

  bookingStatus: {
    type: DataTypes.ENUM("inprogress", "completed", "cancelled"),
    defaultValue: "inprogress",
  },
});

module.exports = Booking;