const Hotel = require('../models/hotels');
const User = require('../models/users');
const NearbyPlaces = require('../models/nearbyPlaces');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

exports.createNearbyPlaces = async (req, res) => {
  try {
    const { details, hotelfk, address, latitude, longitude } = req.body;

    const { savedFiles = {} } = req;

    const nearbyPlaces = await NearbyPlaces.create({
      hotelfk,
      details,
      address,
      latitude,
      longitude,
      nearbyImages: savedFiles.nearbyImages || []
    });

    res.status(201).json({ message: "nearbyPlaces created", nearbyPlaces });
  } catch (error) {
    console.error("nearbyPlaces Create Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getNearbyPlaces = async (req, res) => {
  try {
    const { searchTerm, id, hotelfk, address } = req.query;

    let whereClause = {};

    if(hotelfk){
      whereClause.hotelfk = hotelfk;
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
        { details: { [Op.like]: `%${searchTerm}%` } },
        { address: { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.hotelName$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.details$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.whatsappnumber$": { [Op.like]: `%${searchTerm}%` } },
        ...(dateSearch
            ? [{ createdAt: { [Op.between]: [dateSearch, moment(dateSearch).endOf("day").toDate()] } }]
            : []),
      ];
    }
    // Fetch orders filtered by search term
    const nearbyPlaces = await NearbyPlaces.findAll({
      where: {
        ...whereClause,
      },
      include: [
        {
          model: Hotel,
          as: 'hotel',
        },
      ],
    });

    return res.status(200).json(nearbyPlaces);
  } catch (error) {
    console.log("Error is:-", error);
    return res
      .status(500)
      .json({ message: "Error fetching nearbyPlaces", error });
  }
};

