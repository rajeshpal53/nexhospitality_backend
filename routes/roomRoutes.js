const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/roomsController');
const { upload, compressAndSaveImage } = require('../middleware/multer');

router.post('/', upload.fields([
    { name: 'roomImages', maxCount: 5}]), compressAndSaveImage, roomsController.createRoom);
router.get('/', roomsController.getAllRooms);
router.get('/getRooms', roomsController.getRooms);
router.get('/:id', roomsController.getRoomById);
router.put('/:id', upload.fields([
    { name: 'roomImages', maxCount: 5}]), compressAndSaveImage, roomsController.updateRoom);
router.delete('/:id', roomsController.deleteRoom);

module.exports = router;
