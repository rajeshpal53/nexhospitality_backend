const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Status = sequelize.define("Status", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  statusName: {
    type: DataTypes.ENUM("paid", "unpaid", "partially paid"),
    allowNull: false,
  },
});

module.exports = Status;