const Booking = require('../models/bookings');
const User = require('../models/users');
const Hotel = require('../models/hotels');
const Status = require('../models/status');
const { Op } = require('sequelize');

exports.createBooking = async (req, res) => {
  try {
    const { hotelfk, userfk, amount, statusfk, bookingStatus } = req.body;

    const booking = await Booking.create({
      hotelfk,
      userfk,
      amount,
      remaining: amount,
      statusfk,
      bookingStatus,
    });

    res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    console.error("Booking Create Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Hotel, as: "hotel" },
        { model: Status, as: "status" }
      ]
    });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: "user" },
        { model: Hotel, as: "hotel" },
        { model: Status, as: "status" },
      ],
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    res.status(200).json(booking);

  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    await booking.destroy();
    res.status(200).json({ message: "Booking deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingsByHotel = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { hotelfk: req.params.hotelfk },
      include: [
        { model: User, as: "user" },
        { model: Hotel, as: "hotel" },
        { model: Status, as: "status" },
      ],
    });

    res.status(200).json(bookings);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchBooking = async (req, res) => {
  try {
    const { searchTerm, hotelfk, userfk, statusfk, bookingStatus } = req.query;

    let whereClause = {};

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
    if (moment(searchTerm, "YYYY-MM-DD", true).isValid()) {
      dateSearch = moment(searchTerm, "YYYY-MM-DD").startOf("day").toDate();
    }

    if (searchTerm && searchTerm.trim() !== ""){
      whereClause[Op.or]= [
        // Adjust the fields to search based on your model
        { amount: { [Op.like]: `%${searchTerm}%` } },
        { bookingStatus: { [Op.like]: `%${searchTerm}%` } },
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
      .json({ message: "Error searching transactions", error });
  }
};
