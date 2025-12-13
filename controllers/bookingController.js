const Booking = require('../models/bookings');
const BookingRooms = require('../models/bookingRooms');
const User = require('../models/users');
const Hotel = require('../models/hotels');
const Status = require('../models/status');
const Rooms = require('../models/rooms');
const { Op } = require('sequelize');
const { STATUS_FK_VALUE } = require('../utility/statusConstant');
const Transaction = require('../models/transactions');
const sequelize = require("../config/db");
const moment = require('moment');

exports.createBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { hotelfk, userfk, amount, rooms, advance, remaining, startDateTime, endDateTime, remark, paymentMode, adults, children } = req.body;

    const roomIds = rooms.map((item) => item.id);

    const rooomsTotalPrice = rooms.reduce(
      (acc, r) => acc + parseFloat(r.price || 0),
      0
    );

    // const noOfAdults = rooms.reduce(
    //   (acc, r) => acc + parseFloat(r.adults || 0),
    //   0
    // );

    // const noOfChildren = rooms.reduce(
    //   (acc, r) => acc + parseFloat(r.children || 0),
    //   0
    // );

    // if (adults !== noOfAdults) {
    //   await transaction.rollback();
    //   return res.status(400).json({ error: "no. of adults does not match."});
    // }

    // if (children !== noOfChildren) {
    //   await transaction.rollback();
    //   return res.status(400).json({ error: "no. of children does not match."});
    // }

    const dbRooms = await Rooms.findAll({
      where: { id: roomIds, hotelfk },
      transaction,
    });

    if (dbRooms.length !== rooms.length) {
      await transaction.rollback();
      return res.status(400).json({ error: "Some rooms are invalid or do not belong to the hotel."});
    }

    // Validate room details and calculate the total on the backend
    let calculatedTotal = 0;

    for (let dbRoom of dbRooms) {
      const clientRoom = rooms.find(r => r.id === dbRoom.id);

      if (!clientRoom) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Room ID ${dbRoom.id} missing from request.`
        });
      }

      if (
        Number(clientRoom.price) !== Number(dbRoom.price) ||
        clientRoom.type !== dbRoom.type || clientRoom.price <= 0
      ) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Invalid details for room ID ${dbRoom.id}.`
        });
      }

      calculatedTotal += Number(dbRoom.price);
    }

    // Validate the total amount
    if (calculatedTotal !== rooomsTotalPrice) {
      await transaction.rollback();
      return res.status(400).json({ error: "Total amount mismatch. Please verify your booking."});
    }

    const parsedAdvance = parseFloat(advance);
    const parsedAmount = parseFloat(amount);
    const parsedRemaining = parseFloat(remaining);

    if (isNaN(parsedAdvance) || isNaN(parsedAmount) || isNaN(parsedRemaining)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Price, advance, and balance must be valid numbers" });
    }

    if ((parsedAmount - parsedAdvance) !== parsedRemaining) {
      await transaction.rollback();
      return res.status(400).json({ message: "remaining amount does not match" });
    }

    if (parsedAdvance > parsedAmount) {
      await transaction.rollback();
      return res.status(400).json({ message: "advance cannot be greater than price" });
    }

    let statusfk;
    if(parsedRemaining == 0){
      statusfk = 1;
    }else if(parsedRemaining == parsedAmount){
      statusfk = 2;
    }else{
      statusfk = 3;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid slot date format" });
    }
  
    if (start >= end) {
      await transaction.rollback();
      return res.status(400).json({ message: "Slot start must be before end" });
    }

    const booking1 = await Booking.create({
      hotelfk,
      userfk,
      amount,
      advance,
      startDateTime,
      endDateTime,
      remaining,
      statusfk,
      adults,
      children : children || 0
    },
    { transaction });

    await BookingRooms.bulkCreate(
      rooms.map(r => ({
        bookingfk: booking1.id,
        roomfk: r.id
      })),
      { transaction }
    );

    let transactionEntry;
    if ((STATUS_FK_VALUE[statusfk] !== 'unpaid') && (amount - remaining !== 0)){
      // Insert Transaction (assuming payment is made)
      transactionEntry = await Transaction.create(
       {
         userfk,
         bookingfk: booking1.id,
         amount: amount - remaining,
         transactionStatus: "credit",
         paymentMode,
         remark,
       },
       { transaction }
      );
    }

    await transaction.commit();

    const booking = await Booking.findOne({
      where: {
        id: booking1.id
      },
      include: [
        { model: Rooms, as: 'rooms'}
      ]
    })

    return res.status(201).json({ message: "Booking created", booking, transactionEntry });
  } catch (error) {
    await transaction.rollback();
    console.error("Booking Create Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.checkAvailableRooms = async (req, res) => {
  try {
    const { hotelfk, startDateTime, endDateTime, adults, children } = req.body;

    if (!hotelfk || !startDateTime || !endDateTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const requestedStart = new Date(startDateTime);
    const requestedEnd = new Date(endDateTime);

    if (requestedStart >= requestedEnd) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    // STEP 1: Find room IDs that are ALREADY BOOKED (overlapping bookings)
    const bookedRoomRows = await BookingRooms.findAll({
      attributes: ["roomfk"],
      include: [
        {
          model: Booking,
          as: 'booking',
          required: true,
          where: {
            bookingStatus: "inprogress",
            startDateTime: { [Op.lt]: requestedEnd },
            endDateTime: { [Op.gt]: requestedStart },
          },
        },
      ],
      raw: true,
    });

    const bookedRoomIds = bookedRoomRows.map(r => r.roomfk);

    // STEP 2: Fetch AVAILABLE rooms
    const availableRooms = await Rooms.findAll({
      where: {
        hotelfk,
        maxAdults: { [Op.gte]: adults },
        maxChildren: { [Op.gte]: children },

        // exclude booked rooms
        ...(bookedRoomIds.length > 0 && {
          id: { [Op.notIn]: bookedRoomIds },
        }),
      },
    });

    return res.status(200).json({
      message: "Available rooms",
      count: availableRooms.length,
      rooms: availableRooms,
    });

  } catch (error) {
    console.error("Check Rooms Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "mobile"] },
        { model: Hotel, as: "hotel" },
        { model: Rooms, as: 'rooms'},
        { model: Status, as: "status" }
      ]
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.log("error:-", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: "user" },
        { model: Hotel, as: "hotel" },
        { model: Rooms, as: 'rooms'},
        { model: Status, as: "status" },
      ],
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    res.status(200).json(booking);

  } catch (error) {
    console.log("error:-", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    await booking.update(req.body);

    res.status(200).json({ message: "Booking updated", booking });

  } catch (error) {
    console.log("error:-", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    await Transaction.destroy({
      where: {
        bookingfk: booking.id
      }
    });

    await BookingRooms.destroy({
      where: {
        bookingfk: booking.id
      }
    });
    await booking.destroy();
    res.status(200).json({ message: "Booking deleted" });

  } catch (error) {
    console.log("error:-", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const { searchTerm, hotelfk, userfk, statusfk, bookingStatus, id } = req.query;

    let whereClause = {};

    if(id){
      whereClause.id = id;
    }

    if(hotelfk){
      whereClause.hotelfk = hotelfk;
    }

    if(userfk){
      whereClause.userfk = userfk;
    }

    if(statusfk){
      whereClause.statusfk = statusfk;
    }

    if(bookingStatus){
      whereClause.bookingStatus = bookingStatus;
    }

    // Try to parse the search term as a date (assuming YYYY-MM-DD format)
    let dateSearch = null;
    if (moment(searchTerm, "DD-MM-YYYY", true).isValid()) {
      dateSearch = moment(searchTerm, "DD-MM-YYYY").startOf("day").toDate();
    }

    if (searchTerm && searchTerm.trim() !== ""){
      whereClause[Op.or]= [
        // Adjust the fields to search based on your model
        { amount: { [Op.like]: `%${searchTerm}%` } },
        { bookingStatus: { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.hotelName$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.details$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.name$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.mobile$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.aadharCard$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.email$": { [Op.like]: `%${searchTerm}%` } },
        { "$status.statusName$": { [Op.like]: `%${searchTerm}%` } },
        { "$rooms.roomNumber$": { [Op.like]: `%${searchTerm}%` } },
        { "$rooms.type$": { [Op.like]: `%${searchTerm}%` } },
        { "$rooms.details$": { [Op.like]: `%${searchTerm}%` } },
        ...(dateSearch
          ? [{ createdAt: { [Op.between]: [dateSearch, moment(dateSearch).endOf("day").toDate()] } }]
          : []),
      ];
    }

    // Fetch orders filtered by search term
    const booking = await Booking.findAll({
      where: {
        ...whereClause,
      },
      include: [
        { model: User, as: "user" },
        {
          model: Hotel,
          as: 'hotel',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ["mobile", "name", "email", "address"]
            }
          ]
        },
        { model: Rooms, as: 'rooms'},
        {
          model: Status,
          as: 'status',
        }
      ],
    });

    return res.status(200).json(booking);
  } catch (error) {
    console.log("Error is:-", error);
    return res
      .status(500)
      .json({ message: "Error fetching bookings", error });
  }
};
