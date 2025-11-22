const sequelize = require('../config/db');
const User = require('./users');
const Hotel = require("./hotels");
const Offer = require("./offers");
const Booking = require("./bookings");
const Status = require("./status");
const Transaction = require("./transactions");
const Customer = require("./customers");
const Rooms = require("./rooms");

const models = {
  User,
  Hotel,
  Offer,
  Booking,
  Status,
  Transaction,
  Customer,
  Rooms
};

User.hasMany(Booking, { foreignKey: "userfk", as: 'bookings' });
User.hasMany(Hotel, { foreignKey: "userfk", as: 'hotels' });
User.hasMany(Transaction, { foreignKey: "userfk", as: 'transactions' });

Booking.belongsTo(User, { foreignKey: "userfk", as: 'user' });
Booking.belongsTo(Hotel, { foreignKey: "hotelfk", as: 'hotel' });
Booking.belongsTo(Status, { foreignKey: "statusfk", as: 'status' });
Booking.hasMany(Transaction, { foreignKey: "bookingfk", as: "transactions" });

Hotel.belongsTo(User, { foreignKey: "userfk", as: 'user' });
Hotel.hasMany(Booking, { foreignKey: "hotelfk", as: 'bookings' });
Hotel.hasMany(Offer, { foreignKey: "hotelfk", as: 'offers' });
Hotel.hasMany(Customer, { foreignKey: "hotelfk", as: 'customers' });
Hotel.hasMany(Transaction, { foreignKey: "hotelfk", as: 'transactions' });
Hotel.hasMany(Rooms, {foreignKey: "hotelfk", as: 'rooms'});

Rooms.belongsTo(Hotel, { foreignKey: "hotelfk", as: 'hotel'});

Offer.belongsTo(Hotel, { foreignKey: "hotelfk", as: 'hotel' });

Customer.belongsTo(Hotel, { foreignKey: "hotelfk", as: 'hotel' });

Status.hasMany(Booking, { foreignKey: "statusfk", as: 'bookings' });

Transaction.belongsTo(Booking, { foreignKey: "bookingfk", as: 'booking' });
Transaction.belongsTo(Hotel, { foreignKey: "hotelfk", as: 'hotel' });
Transaction.belongsTo(User, { foreignKey: "userfk", as: 'user' });

sequelize.sync()
  //.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch((error) => console.error('Error syncing database:', error));

module.exports = models;
