const Hotel = require('../models/hotels');
const User = require('../models/users');
const Spots = require('../models/spots');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const {processImages, deleteUploadedImages} = require("../utility/processImages");

exports.createSpot = async (req, res) => {
  try {
    const { details, hotelfk, address, latitude, longitude } = req.body;

    const { savedFiles = {} } = req;

    const spot = await Spots.create({
      hotelfk,
      details,
      address,
      latitude,
      longitude,
      spotsImages: savedFiles.spotsImages || []
    });

    res.status(201).json({ message: "Spot created", spot });
  } catch (error) {
    console.error("Spot Create Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateSpots = async (req, res) => {
  try {
    const { body } = req;
    const spots = await Spots.findByPk(req.params.id);
    if (!spots) return res.status(404).json({ error: "spots not found" });

    const finalImageUrls = await processImages({
      fieldName: "spotsImages",
      req,
      dbFieldValue: spots.spotsImages,
    });

    // Step 5: Save final image array in DB
    await spots.update({
      ...body,
      spotsImages: finalImageUrls
    });

    return res.status(200).json({ message: 'spots updated successfully', spots });

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

exports.deleteNearbyPlace = async (req, res) => {
  try {
    const spots = await Spots.findByPk(req.params.id);
    if (!spots) return res.status(404).json({ error: "spots not found" });

    await deleteUploadedImages(spots.spotsImages);
    await spots.destroy();
    return res.status(200).json({ message: "spots deleted" });

  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSpots = async (req, res) => {
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
    const spots = await Spots.findAll({
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

    return res.status(200).json(spots);
  } catch (error) {
    console.log("Error is:-", error);
    return res
      .status(500)
      .json({ message: "Error fetching spots", error });
  }
};
