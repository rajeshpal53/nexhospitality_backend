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
User.hasMany(Booking, { foreignKey: "userfk" });
Booking.belongsTo(User, { foreignKey: "userfk" });

// user - hotels
User.hasMany(Hotel, { foreignKey: "userfk" });
Hotel.belongsTo(User, { foreignKey: "userfk" });

// hotel - bookings
Hotel.hasMany(Booking, { foreignKey: "hotelfk" });
Booking.belongsTo(Hotel, { foreignKey: "hotelfk" });

// Hotel - offers
Hotel.hasMany(Offer, { foreignKey: "hotelfk" });
Offer.belongsTo(Hotel, { foreignKey: "hotelfk" });

// hotel - customers
Hotel.hasMany(Customer, { foreignKey: "hotelfk" });
Customer.belongsTo(Hotel, { foreignKey: "hotelfk" });

// Status - bookings
Status.hasMany(Booking, { foreignKey: "statusfk" });
Booking.belongsTo(Status, { foreignKey: "statusfk" });

// Transactions - booking
Transaction.belongsTo(Booking, { foreignKey: "bookingfk" });
Booking.hasMany(Transaction, { foreignKey: "bookingfk" });

// Transactions - hotel
Transaction.belongsTo(Hotel, { foreignKey: "hotelfk" });
Hotel.hasMany(Transaction, { foreignKey: "hotelfk" });

// Transactions - user
Transaction.belongsTo(User, { foreignKey: "userfk" });
User.hasMany(Transaction, { foreignKey: "userfk" });


sequelize.sync()
  //.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch((error) => console.error('Error syncing database:', error));

module.exports = models;
