
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const User = require('../models/users');
const Hotels = require('../models/hotels');

// // Helper function to get user name
const getUserName = async (usersfk) => {
  const user = await User.findByPk(usersfk);
  return user ? user?.name?.replace(/\s+/g, '_') : 'unknownUser';
};

const getHotel = async (hotelfk) => {
  const hotel = await Hotels.findByPk(hotelfk);
  return hotel;
};

const getUserMobile = async (usersfk) => {
    const user = await User.findByPk(usersfk);
    return user ? user?.mobile : 'unknownMobile';
  };

// Memory storage to hold the image temporarily
const storage = multer.memoryStorage();

// File filter to only accept image files
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /webp|jpeg|jpg|png|gif|xlsx|xls/;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/vnd.ms-excel', // For .xls files
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // For .xlsx files
  ];
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    console.log('Rejected file:', file.originalname, 'with MIME type:', file.mimetype);
    cb(new Error('Only image or Excel files are allowed'), false);
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage, // Store file in memory temporarily
  limits: { fileSize: 10 * 1024 * 1024 }, // Increase the limit to allow larger files for resizing
  fileFilter: fileFilter
});

// Middleware to compress and save images
const compressAndSaveImage = async (req, res, next) => {
    try {
      const baseUploadPath = process.env.UPLOAD_PATH || path.resolve(__dirname, '../../hospitality-frontend/assets');
  
      // Handle single or multiple files
      const files = req.files ? Object.values(req.files).flat() : req.file ? [req.file] : [];
  
      if (files.length === 0) {
        return next();
      }

      req.savedFiles = {
        hotelImages: [], // To group images
        coverImages: [],
        spotsImages: [],
        roomImages: [],
        nearbyImages: []
      };

      for (const file of files) {
        let specificPath;
        const fieldName = file.fieldname;

        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const originalExt = path.extname(file.originalname).toLowerCase();

        // Determine the upload path based on the file fieldname
        if (fieldName === 'hotelImages' || fieldName === 'coverImages') {
          const hotelName = req?.body?.hotelName?.replace(/\s+/g, '_') || 'hotelName';
          const whatsappnumber = req?.body?.whatsappnumber || 'whatsappnumber';
          const hotelFolder = `${hotelName}-${whatsappnumber}`;
          specificPath = path.join(baseUploadPath, 'hotels', hotelFolder);
        } else if (fieldName === 'nearbyImages' || fieldName === 'spotsImages') {
          const hotel = await getHotel(req?.body?.hotelfk);
          const spotFolder = `${hotel?.hotelName.replace(/\s+/g, '_')}-${hotel?.whatsappnumber}`;
          if(fieldName === 'spotsImages') {
            specificPath = path.join(baseUploadPath, 'spots', spotFolder);
          } else if (fieldName === 'nearbyImages') {
            specificPath = path.join(baseUploadPath, 'nearby_places', spotFolder);
          }
        } else if (fieldName === 'aadharCardFronturl' || fieldName === 'aadharCardBackurl') {
          const userName = req?.body?.name?.replace(/\s+/g, '_') || 'name';
          const aadharCard = req?.body?.aadharCard || 'unknownAadhar';
          const userFolder = `${userName}-${aadharCard}`;
          specificPath = path.join(baseUploadPath, 'aadharcards', userFolder);
        } else if (fieldName === 'profilePicUrl') {
          specificPath = path.join(baseUploadPath, 'profilepics');
        } else if (fieldName === 'certificateImage') {
          specificPath = path.join(baseUploadPath, 'vendors_certificates');
        } else if (fieldName === 'screenShotUrl') {
          specificPath = path.join(baseUploadPath, 'screenshots');
        } else if (fieldName === 'subcategoryImage') {
          specificPath = path.join(baseUploadPath, 'subcategory');
        } else if(fieldName === 'roomImages') {
          const hotel = await getHotel(req?.body?.hotelfk);
          const roomFolder = `${hotel?.hotelName.replace(/\s+/g, '_')}-${hotel?.whatsappnumber}`;
          specificPath = path.join(baseUploadPath, 'rooms', roomFolder);
        }
        else {
          return next(new Error('Invalid file field'));
        }
  
        // Ensure the directory exists
        fs.mkdirSync(specificPath, { recursive: true });
  
        // Generate the filename
        let prefix = 'file';
        let uniqueIdentifier;
        if (fieldName === 'hotelImages') {
          prefix = 'hotel';
          uniqueIdentifier = `${prefix}-${(req?.body?.hotelName || 'hotelName')?.replace(/\s+/g, '_')}-${timestamp}-${random}`;
        } else if (fieldName === 'coverImages') {
          prefix = 'hotel_cover';
          uniqueIdentifier = `${prefix}-${(req?.body?.hotelName || 'hotelName')?.replace(/\s+/g, '_')}-${timestamp}-${random}`;
        } else if (fieldName === 'spotsImages') {
          prefix = 'hotel_spots';
          const hotel = await getHotel(req?.body?.hotelfk);
          uniqueIdentifier = `${prefix}-${(hotel?.hotelName)?.replace(/\s+/g, '_')}-${timestamp}-${random}`;
        } else if (fieldName === 'nearbyImages') {
          prefix = 'hotel_nearby_places';
          const hotel = await getHotel(req?.body?.hotelfk);
          uniqueIdentifier = `${prefix}-${(hotel?.hotelName)?.replace(/\s+/g, '_')}-${timestamp}-${random}`;
        } else if (fieldName === 'roomImages') {
          prefix = 'room';
          const hotel = await getHotel(req?.body?.hotelfk);
          uniqueIdentifier = `${prefix}-${(hotel?.hotelName)?.replace(/\s+/g, '_')}-${timestamp}-${random}`;
        } else if (fieldName === 'aadharCardFronturl') {
          prefix = 'aadharfront';
          uniqueIdentifier = `${prefix}-${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${req?.body?.aadharCard || 'unknownAadhar'}`;
        } else if (fieldName === 'aadharCardBackurl') {
          prefix = 'aadharback';
          uniqueIdentifier = `${prefix}-${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${req?.body?.aadharCard || 'unknownAadhar'}`;
        } else if (fieldName === 'profilePicUrl') {
          prefix = 'profile';
          uniqueIdentifier = `${prefix}-${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${req?.body?.mobile || 'mobile'}`;
        } else if (fieldName === 'certificateImage') {
          prefix = 'vendor';
          uniqueIdentifier = `${prefix}-${(req?.body?.hotelName || 'hotelName')?.replace(/\s+/g, '_')}-${req.body.whatsappnumber || 'whatsappnumber'}`;
        } else if (fieldName === 'screenShotUrl') {
          uniqueIdentifier = `${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${Date.now()}`;
        } else if (fieldName === 'subcategoryImage') {
          uniqueIdentifier = `${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${Date.now()}`;
        } else if (fieldName === 'productCategoryImage') {
          uniqueIdentifier = `${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${Date.now()}`;
        } else {
          prefix = 'unknown';
          uniqueIdentifier = `${prefix}-${timestamp}-${random}`;
        }
  
        const finalFilename = uniqueIdentifier + path.extname(file.originalname);
        const fullPath = path.join(specificPath, finalFilename);
  
        // Compress and save the image
        if (/webp|jpeg|jpg|png|gif/.test(originalExt)) {
          await sharp(file.buffer)
            .resize({ width: 1024 }) // Resize to a max width of 1024px
            .toFormat(originalExt === '.gif' ? 'gif' : originalExt.slice(1), { quality: 80 })
            .toFile(fullPath);
        } else if (/xlsx|xls/.test(originalExt)) {
          // Save Excel file directly
          fs.writeFileSync(fullPath, file.buffer);
        }

        const arrayFields = ['hotelImages', 'coverImages', 'spotsImages', 'roomImages', 'nearbyImages'];

        if(arrayFields.includes(fieldName)){
          req.savedFiles[fieldName].push(
            fullPath?.replace(baseUploadPath, 'assets').split(path.sep).join('/')
          );
        } else{
          req.savedFiles[fieldName] = fullPath?.replace(baseUploadPath, 'assets').split(path.sep).join('/');
        }
      }
  
      next();
    } catch (error) {
      console.log("error:-", error);
      next(error);
    }
  };
  
module.exports = { upload, compressAndSaveImage };