const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { upload, compressAndSaveImage } = require('../middleware/multer');

router.post('/', upload.fields([
    { name: 'hotelImages', maxCount: 5},]), compressAndSaveImage, hotelController.createHotel);
router.get('/', hotelController.getAllHotels);
router.get('/search', hotelController.searchHotel);
router.get('/:id', hotelController.getHotelById);
router.put('/:id', upload.array("hotelImages"), hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);

module.exports = router;
