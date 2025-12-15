const Hotel = require('../models/hotels');
const User = require('../models/users');
const Rooms = require('../models/rooms');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const Spots = require('../models/spots');
const NearbyPlaces = require('../models/nearbyPlaces');
const {processImages, deleteUploadedImages} = require("../utility/processImages");

exports.createHotel = async (req, res) => {
  try {
    const { userfk, whatsappnumber, details, hotelName, address, latitude, longitude } = req.body;

    const { savedFiles = {} } = req;

    const hotel = await Hotel.create({
      userfk,
      hotelName,
      address,
      latitude,
      longitude,
      whatsappnumber,
      details,
      hotelImages: savedFiles.hotelImages || [],
      coverImages: savedFiles.coverImages || []
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
        { model: User, as: "user", attributes: ["id", "name", "email", "mobile"] },
        { model: Rooms, as: "rooms"},
        { model: Spots, as: "spots"},
        { model: NearbyPlaces, as: "nearbyPlaces"}
      ]
    });

    return res.status(200).json(hotels);
  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Rooms, as: "rooms"},
        { model: Spots, as: "spots"},
        { model: NearbyPlaces, as: "nearbyPlaces"}
      ]
    });

    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    return res.status(200).json(hotel);
  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const { body } = req;
    const hotel = await Hotel.findByPk(req.params.id);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const finalHotelImages = await processImages({
      fieldName: "hotelImages",
      req,
      dbFieldValue: hotel.hotelImages,
    });

    const finalCoverImages = await processImages({
      fieldName: "coverImages",
      req,
      dbFieldValue: hotel.coverImages,
    });

    // UPDATE HOTEL RECORD
    await hotel.update({
      ...body,
      hotelImages: finalHotelImages,
      coverImages: finalCoverImages
    });

    return res.status(200).json({
      message: "Hotel updated successfully",
      hotel,
    });

  } catch (error) {
     if (req.savedFiles && typeof req.savedFiles === "object") {
      for (const field in req.savedFiles) {
        await deleteUploadedImages(req.savedFiles[field]);
      }
    }
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    await deleteUploadedImages(hotel.hotelImages);
    await deleteUploadedImages(hotel.coverImages);
    await hotel.destroy();
    return res.status(200).json({ message: "Hotel deleted" });

  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getHotel = async (req, res) => {
  try {
    const { searchTerm, id, userfk, address } = req.query;

    let whereClause = {};

    if(userfk){
      whereClause.userfk = userfk;
    }

    if(id){
      whereClause.id = id;
    }

    if(address){
      whereClause.address = address;
    }

    let dateSearch = null;
    if (moment(searchTerm, "DD-MM-YYYY", true).isValid()) {
      dateSearch = moment(searchTerm, "DD-MM-YYYY").startOf("day").toDate();
    }

    if (searchTerm && searchTerm.trim() !== ""){
      whereClause[Op.or]= [
        { hotelName: { [Op.like]: `%${searchTerm}%` } },
        { address: { [Op.like]: `%${searchTerm}%` } },
        { whatsappnumber: { [Op.like]: `%${searchTerm}%` } },
        { "$user.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.mobile$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.name$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.email$": { [Op.like]: `%${searchTerm}%` } },
        ...(dateSearch
            ? [{ createdAt: { [Op.between]: [dateSearch, moment(dateSearch).endOf("day").toDate()] } }]
            : []),
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
        },
        { model: Rooms, as: "rooms"},
        { model: Spots, as: "spots"},
        { model: NearbyPlaces, as: "nearbyPlaces"}
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

exports.getAddressOfHotels = async (req, res) => {
  try {
    const addresses = await Hotel.findAll({
      attributes: ["address"],
      raw: true
    });

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ error: "No addresses found" });
    }

    // Extract only strings into a single array
    const addressList = addresses.map(h => h.address);

    return res.status(200).json(addressList);

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
