const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Hotel = require("./hotels");
const User = require("./users");
const Booking = require("./bookings");

const Transaction = sequelize.define("Transaction", {
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

  bookingfk: {
    type: DataTypes.INTEGER,
    references: {
      model: Booking,
      key: "id",
    },
  },

  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  transactionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  transactionStatus: {
    type: DataTypes.ENUM("credit", "debit"),
    allowNull: false,
  },

  paymentMode: {
    type: DataTypes.ENUM('CASH', 'UPI', 'RTGS/NEFT', 'CREDIT CARD/DEBIT CARD', 'Online'),
    allowNull: true,
  },

  remark: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Transaction;