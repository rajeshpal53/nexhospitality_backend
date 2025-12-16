const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/checkAvailableRooms', bookingController.checkAvailableRooms);
router.get('/getHotelStats', bookingController.getHotelStats);
router.post('/', bookingController.createBooking);
router.post('/createBooking1', bookingController.createBooking1);
router.post('/confirmBooking', bookingController.confirmBooking);
router.get('/', bookingController.getAllBookings);
router.get('/getBookings', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
