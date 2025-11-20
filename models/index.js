const sequelize = require('../config/db');
const User = require('./users');
const Hotel = require("./hotels");
const Offer = require("./offers");
const Booking = require("./bookings");
const Status = require("./status");
const Transaction = require("./transactions");
const Customer = require("./customers");

const models = {
  User,
  Hotel,
  Offer,
  Booking,
  Status,
  Transaction,
  Customer,
};

// user - bookings
User.hasMany(Booking, { foreignKey: "userfk", as: 'bookings' });
Booking.belongsTo(User, { foreignKey: "userfk", as: 'user' });

// user - hotels
User.hasMany(Hotel, { foreignKey: "userfk", as: 'hotels' });
Hotel.belongsTo(User, { foreignKey: "userfk", as: 'user' });

// hotel - bookings
Hotel.hasMany(Booking, { foreignKey: "hotelfk", as: 'bookings' });
Booking.belongsTo(Hotel, { foreignKey: "hotelfk", as: 'hotel' });

// Hotel - offers
Hotel.hasMany(Offer, { foreignKey: "hotelfk", as: 'offers' });
Offer.belongsTo(Hotel, { foreignKey: "hotelfk", as: 'hotel' });

// hotel - customers
Hotel.hasMany(Customer, { foreignKey: "hotelfk", as: 'customers' });
Customer.belongsTo(Hotel, { foreignKey: "hotelfk", as: 'hotel' });

// Status - bookings
Status.hasMany(Booking, { foreignKey: "statusfk", as: 'bookings' });
Booking.belongsTo(Status, { foreignKey: "statusfk", as: 'status' });

// Transactions - booking
Transaction.belongsTo(Booking, { foreignKey: "bookingfk", as: 'booking' });
Booking.hasMany(Transaction, { foreignKey: "bookingfk", as: "transactions" });

// Transactions - hotel
Transaction.belongsTo(Hotel, { foreignKey: "hotelfk", as: 'hotel' });
Hotel.hasMany(Transaction, { foreignKey: "hotelfk", as: 'transactions' });

// Transactions - user
Transaction.belongsTo(User, { foreignKey: "userfk", as: 'user' });
User.hasMany(Transaction, { foreignKey: "userfk", as: 'transactions' });


sequelize.sync()
  //.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch((error) => console.error('Error syncing database:', error));

module.exports = models;
