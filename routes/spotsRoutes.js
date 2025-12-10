const express = require('express');
const router = express.Router();
const spotsController = require('../controllers/spotsController');
const { upload, compressAndSaveImage } = require('../middleware/multer');

router.post('/', upload.fields([
    { name: 'spotsImages', maxCount: 5}]), compressAndSaveImage, spotsController.createSpot);
router.get('/', spotsController.getSpots);

module.exports = router;
