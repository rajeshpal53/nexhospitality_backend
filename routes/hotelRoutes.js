const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { upload } = require('../middleware/multer');

router.post('/', upload.array("hotelImages"), hotelController.createHotel);
router.get('/', hotelController.getAllHotels);
router.get('/search', hotelController.searchHotel);
router.get('/:id', hotelController.getHotelById);
router.put('/:id', upload.array("hotelImages"), hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);

module.exports = router;
