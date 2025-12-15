const Hotel = require('../models/hotels');
const User = require('../models/users');
const Rooms = require('../models/rooms');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const {processImages, deleteUploadedImages} = require("../utility/processImages");

exports.createRoom = async (req, res) => {
  try {
    const { hotelfk, isAc, isWifi, isTv, type, details, price, maxAdults, maxChildren, roomNumber } = req.body;

    const { savedFiles = {} } = req;

    const room = await Rooms.create({
      hotelfk,
      isAc,
      isTv,
      isWifi,
      type,
      details,
      maxAdults,
      maxChildren,
      price,
      roomNumber,
      roomImages: savedFiles.roomImages || []
    });

    res.status(201).json({ message: "room created", room });
  } catch (error) {
    console.error("Room Create Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Rooms.findAll({
      include: [
        { model: Hotel, as: "hotel"}
      ]
    });

    return res.status(200).json(rooms);
  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await Rooms.findByPk(req.params.id, {
      include: [
        { model: Hotel, as: "hotel"}
      ]
    });

    if (!room) return res.status(404).json({ error: "Room not found" });

    return res.status(200).json(room);
  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { body } = req;
    const room = await Rooms.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const finalImageUrls = await processImages({
      fieldName: "roomImages",
      req,
      dbFieldValue: room.roomImages,
    });

    // Step 5: Save final image array in DB
    await room.update({
      ...body,
      roomImages: finalImageUrls
    });

    return res.status(200).json({ message: 'room updated successfully', room });

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

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Rooms.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    await deleteUploadedImages(room.roomImages);
    await room.destroy();
    return res.status(200).json({ message: "Room deleted" });

  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const { searchTerm, id, hotelfk, type } = req.query;

    let whereClause = {};

    if(hotelfk){
      whereClause.hotelfk = hotelfk;
    }

    if(id){
      whereClause.id = id
    }

    if(type){
      whereClause.type = type;
    }
    
    let dateSearch = null;
    if (moment(searchTerm, "DD-MM-YYYY", true).isValid()) {
      dateSearch = moment(searchTerm, "DD-MM-YYYY").startOf("day").toDate();
    }

    if (searchTerm && searchTerm.trim() !== ""){
      whereClause[Op.or]= [
        { "$hotel.hotelName$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.details$": { [Op.like]: `%${searchTerm}%` } },
        { details: { [Op.like]: `%${searchTerm}%` } },
        { type: { [Op.like]: `%${searchTerm}%` } },
        ...(dateSearch
            ? [{ createdAt: { [Op.between]: [dateSearch, moment(dateSearch).endOf("day").toDate()] } }]
            : []),
      ];
    }
    // Fetch orders filtered by search term
    const rooms = await Rooms.findAll({
      where: {
        ...whereClause,
      },
      include: [
        {
          model: Hotel,
          as: 'hotel',
        }
      ],
    });

    return res.status(200).json(rooms);
  } catch (error) {
    console.log("Error is:-", error);
    return res
      .status(500)
      .json({ message: "Error searching rooms", error });
  }
};