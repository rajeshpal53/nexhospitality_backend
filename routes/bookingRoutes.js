const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/checkAvailableRooms', bookingController.checkAvailableRooms);
router.post('/', bookingController.createBooking);
router.get('/', bookingController.getAllBookings);
router.get('/getBookings', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
