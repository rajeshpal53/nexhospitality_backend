const Hotel = require('../models/hotels');
const User = require('../models/users');
const Rooms = require('../models/rooms');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

exports.createRoom = async (req, res) => {
  try {
    const { hotelfk, isAc, isWifi, isTv, type } = req.body;

    const { savedFiles = {} } = req;

    const room = await Rooms.create({
      hotelfk,
      isAc,
      isTv,
      isWifi,
      type,
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

    // const baseUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../frontend/assets');

    // // Step 1: Separate existing URLs and new files
    // let existingUrls = [];
    // console.log('img:---', body.hotelImages);
        
    // if(Array.isArray(body.hotelImages)){
    //   for (const item of body.hotelImages) {
    //     if (typeof item === "string") {
    //       existingUrls.push(item);
    //     } 
    //   }
    // } else if(typeof body.hotelImages === "string"){
    //   existingUrls.push(body.hotelImages);
    // }

    // console.log("existingUrls:---",existingUrls);

    // // Step 2: Upload new files
    // const newUploadedUrls = req.savedFiles?.hotelImages || [];

    // // Step 3: Combine final imageUrls
    // const finalImageUrls = [...existingUrls, ...newUploadedUrls];
    // console.log("finalImageUrls:----",finalImageUrls);
    

    // // Step 4: Delete removed images
    // const existingDbImages = Array.isArray(hotel.hotelImages) ? hotel.hotelImages : [];

    // const imagesToDelete = existingDbImages.filter(oldUrl => !existingUrls.includes(oldUrl));

    // for (const imgPath of imagesToDelete) {
    //   const fullPath = path.join(baseUploadPath, imgPath.replace('assets/', ''));
    //   try {
    //     await fs.promises.access(fullPath);
    //     await fs.promises.unlink(fullPath);
    //     console.log(`Deleted old image: ${fullPath}`);
    //   } catch (err) {
    //     console.error(`Failed to delete image: ${fullPath}`, err.message);
    //   }
    // }

    // Step 5: Save final image array in DB
    await Rooms.update({
      ...body,
      roomImages: finalImageUrls
    });

    return res.status(200).json({ message: 'room updated successfully', room });

  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Rooms.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    await room.destroy();
    return res.status(200).json({ message: "Room deleted" });

  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const { searchTerm, id, hotelfk } = req.query;

    let whereClause = {};

    if(hotelfk){
      whereClause.hotelfk = hotelfk;
    }

    if(id){
      whereClause.id = id
    }

    let dateSearch = null;
    if (moment(searchTerm, "YYYY-MM-DD", true).isValid()) {
      dateSearch = moment(searchTerm, "YYYY-MM-DD").startOf("day").toDate();
    }

    if (searchTerm && searchTerm.trim() !== ""){
      whereClause[Op.or]= [
        { "$hotel.hotelName$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.details$": { [Op.like]: `%${searchTerm}%` } },
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