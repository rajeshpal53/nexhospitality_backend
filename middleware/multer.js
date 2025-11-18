const multer = require('multer'); //Handles file uploads.
const path = require('path');     //Helps manipulate file and directory paths.
const fs = require('fs');         //(File System) – For creating directories and file handling.
const sharp = require('sharp');   //Used to compress/resize image files.
const User = require('../models/users');

const getUserName = async (usersfk) => {
  const user = await User.findByPk(usersfk);
  return user ? user?.name?.replace(/\s+/g, '_') : 'unknownUser';
};

// Memory storage to hold the image temporarily using sharp
const storage = multer.memoryStorage();

const allowedFileTypes = /jpeg|jpg|png|gif|pdf/;
const allowedMimeTypes = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'application/pdf'
];

// File filter to only accept image files
const fileFilter = (req, file, cb) => {
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);  //accept file
  }
  else {
    console.log('Rejected file:', file.originalname, 'with MIME type:', file.mimetype);
    cb(new Error('Only image or PDF files are allowed'), false);
  }
};

//upload multer with parameters
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

const compressAndSaveImage = async (req, res, next) => {
  try {
    //Sets base path to save files 
    const baseUploadPath = process.env.UPLOAD_PATH || path.resolve(__dirname, '../../nexHospitality_frontend/assets');
    //Handles multiple fields with multiple or single file & Converts everything into a flat array of files to loop through.
    const files = req.files ? Object.values(req.files).flat() : req.file ? [req.file] : [];

    if (files.length === 0) 
      return next();
    req.savedFiles = {}; //will hold all saved paths for later use (e.g., to store in DB).

    //Loop Through Each File and creat unique path 
    for (const file of files) {
      const originalExt = path.extname(file.originalname).toLowerCase();
      const isImage = file.mimetype.startsWith('image');
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      let specificPath;
  
      // Determine the upload path based on the file fieldname
      if (file.fieldname === 'profilePicUrl') {
        specificPath = path.join(baseUploadPath, 'profilepics');
      } 
      else if (file.fieldname === 'aadharCardFronturl' || file.fieldname === 'aadharCardBackurl') {
        // const usersfk = req.body.usersfk;
        const userName = req?.body?.name?.replace(/\s+/g, '_') || 'name';
        const aadharCard = req.body.aadharCard || 'unknownAadhar';
        const userFolder = `${userName}-${aadharCard}`;
        specificPath = path.join(baseUploadPath, 'aadharcards', userFolder);
      }
      else {
        return next(new Error('Invalid file field'));
      }

      fs.mkdirSync(specificPath, { recursive: true }); // frn/assets/pro

      let prefix = 'file';
      let uniqueIdentifier;

      switch (file.fieldname) {
        case 'profilePicUrl':
          prefix = 'profile';
          uniqueIdentifier = `${prefix}-${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${req?.body?.mobile || 'mobile'}`;
          break;
        case 'aadharCardFronturl':
          prefix = 'aadharfront';
          uniqueIdentifier = `${prefix}-${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${req?.body?.aadharCard || 'unknownAadhar'}`;
          break;
        case 'aadharCardBackurl':
          prefix = 'aadharBack';
          uniqueIdentifier = `${prefix}-${(req?.body?.name || 'name')?.replace(/\s+/g, '_')}-${req?.body?.aadharCard || 'unknownAadhar'}`;
          break;
        default:
          return next(new Error(`Unsupported file field: ${file.fieldname}`));
      }

      const finalFilename = uniqueIdentifier + path.extname(file.originalname);
      const fullPath = path.join(specificPath, finalFilename);

      // Compress image or save PDF
      if (isImage) {
        await sharp(file.buffer)
          .resize({ width: 1024 })
          .toFormat(originalExt === '.gif' ? 'gif' : originalExt.slice(1), { quality: 80 }) // Convert to JPEG with 80% quality
          .toFile(fullPath);
      } else {
        fs.writeFileSync(fullPath, file.buffer);
      }

      req.savedFiles[file.fieldname] = 
      fullPath?.replace(baseUploadPath, 'assets').split(path.sep).join('/');
    }

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = { upload, compressAndSaveImage };
