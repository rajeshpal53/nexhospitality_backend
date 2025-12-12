const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Booking = require('./bookings');
const Rooms = require('./rooms');

const BookingRooms = sequelize.define('BookingRooms', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  bookingfk: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Booking,
      key: 'id',
    },
  },
  roomfk: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Rooms,
      key: 'id',
    },
  },
});

module.exports = BookingRooms;
