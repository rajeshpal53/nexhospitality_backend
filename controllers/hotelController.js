const Hotel = require('../models/hotels');
const User = require('../models/users');
const { Op } = require('sequelize');

exports.createHotel = async (req, res) => {
  try {
    const { userfk, hotelName, address, latitude, longitude } = req.body;

    let hotelImages = [];
    if (req.files && req.files.hotelImages) {
      hotelImages = req.files.hotelImages.map(img => img.filename);
    }

    const hotel = await Hotel.create({
      userfk,
      hotelName,
      address,
      latitude,
      longitude,
      hotelImages
    });

    res.status(201).json({ message: "Hotel created", hotel });
  } catch (error) {
    console.error("Hotel Create Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] }
      ]
    });

    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] }
      ]
    });

    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    res.status(200).json(hotel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    let hotelImages = hotel.hotelImages;

    if (req.files && req.files.hotelImages) {
      hotelImages = req.files.hotelImages.map(img => img.filename);
    }

    await hotel.update({
      ...req.body,
      hotelImages,
    });

    res.status(200).json({ message: "Hotel updated", hotel });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    await hotel.destroy();
    res.status(200).json({ message: "Hotel deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchHotel = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    let whereClause = {};

    if (searchTerm && searchTerm.trim() !== ""){
      whereClause[Op.or]= [
        { "$hotel.hotelName$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.address$": { [Op.like]: `%${searchTerm}%` } },
      ];
    }
    // Fetch orders filtered by search term
    const hotels = await Hotel.findAll({
      where: {
        ...whereClause,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ["mobile", "name", "email", "address"]
        }
      ],
    });

    return res.status(200).json(hotels);
  } catch (error) {
    console.log("Error is:-", error);
    return res
      .status(500)
      .json({ message: "Error searching hotels", error });
  }
};