const express = require('express');
const router = express.Router();
const nearbyPlacesController = require('../controllers/nearbyPlacesController');
const { upload, compressAndSaveImage } = require('../middleware/multer');

router.post('/', upload.fields([
    { name: 'nearbyImages', maxCount: 5}]), compressAndSaveImage, nearbyPlacesController.createNearbyPlaces);
router.get('/', nearbyPlacesController.getNearbyPlaces);
router.put('/:id', upload.fields([
    { name: 'nearbyImages', maxCount: 5}]), compressAndSaveImage, nearbyPlacesController.updateNearbyPlaces);
router.delete('/:id', nearbyPlacesController.deleteNearbyPlace);

module.exports = router;
