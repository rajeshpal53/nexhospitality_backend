const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Hotel = require("./hotels");
const Status = require("./status");
const User = require("./users");
const Rooms = require("./rooms");

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

  roomfk: {
    type: DataTypes.INTEGER,
    references: {
      model: Rooms,
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

  advance: {
    type: DataTypes.FLOAT,
    allowNull: true
  },

  remaining: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  startDateTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  
  endDateTime: {
    type: DataTypes.DATE,
    allowNull: false
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