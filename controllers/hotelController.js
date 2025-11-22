const Hotel = require('../models/hotels');
const User = require('../models/users');
const Rooms = require('../models/rooms');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

exports.createHotel = async (req, res) => {
  try {
    const { userfk, hotelName, address, latitude, longitude } = req.body;

    const { savedFiles = {} } = req;

    const hotel = await Hotel.create({
      userfk,
      hotelName,
      address,
      latitude,
      longitude,
      hotelImages: savedFiles.hotelImages || [],
      coverImages: savedFiles.coverImages || [],
      spotsImages: savedFiles.spotsImages || []
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
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Rooms, as: "rooms"}
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
        { model: Rooms, as: "rooms"}
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

    const baseUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../frontend/assets');

    // Step 1: Separate existing URLs and new files
    let existingUrls = [];
    console.log('img:---', body.hotelImages);
        
    if(Array.isArray(body.hotelImages)){
      for (const item of body.hotelImages) {
        if (typeof item === "string") {
          existingUrls.push(item);
        } 
      }
    } else if(typeof body.hotelImages === "string"){
      existingUrls.push(body.hotelImages);
    }

    console.log("existingUrls:---",existingUrls);

    // Step 2: Upload new files
    const newUploadedUrls = req.savedFiles?.hotelImages || [];

    // Step 3: Combine final imageUrls
    const finalImageUrls = [...existingUrls, ...newUploadedUrls];
    console.log("finalImageUrls:----",finalImageUrls);
    

    // Step 4: Delete removed images
    const existingDbImages = Array.isArray(hotel.hotelImages) ? hotel.hotelImages : [];

    const imagesToDelete = existingDbImages.filter(oldUrl => !existingUrls.includes(oldUrl));

    for (const imgPath of imagesToDelete) {
      const fullPath = path.join(baseUploadPath, imgPath.replace('assets/', ''));
      try {
        await fs.promises.access(fullPath);
        await fs.promises.unlink(fullPath);
        console.log(`Deleted old image: ${fullPath}`);
      } catch (err) {
        console.error(`Failed to delete image: ${fullPath}`, err.message);
      }
    }

    // Step 5: Save final image array in DB
    await hotel.update({
      ...body,
      hotelImages: finalImageUrls
    });

    return res.status(200).json({ message: 'hotel updated successfully', hotel });

  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    await hotel.destroy();
    return res.status(200).json({ message: "Hotel deleted" });

  } catch (error) {
    console.log("error is:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getHotel = async (req, res) => {
  try {
    const { searchTerm, id, userfk } = req.query;

    let whereClause = {};

    if(userfk){
      whereClause.userfk = userfk;
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
        { model: Rooms, as: "rooms"}
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