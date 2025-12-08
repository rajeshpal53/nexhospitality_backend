const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { upload, compressAndSaveImage } = require('../middleware/multer');

router.post('/', upload.fields([
    { name: 'hotelImages', maxCount: 5},
    { name: 'coverImages', maxCount: 5},
    { name: 'spotsImages', maxCount: 5}]), compressAndSaveImage, hotelController.createHotel);
router.get('/', hotelController.getAllHotels);
router.get('/getHotel', hotelController.getHotel);
router.get('/getAddressOfHotels', hotelController.getAddressOfHotels);
router.get('/:id', hotelController.getHotelById);
router.put('/:id', upload.fields([
    { name: 'hotelImages', maxCount: 5},
    { name: 'coverImages', maxCount: 5},
    { name: 'spotsImages', maxCount: 5}]), compressAndSaveImage, hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);

module.exports = router;
