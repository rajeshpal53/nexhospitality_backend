const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.post('/createCustomer', customerController.createCustomer); // Create
router.get('/getAllCustomers', customerController.getAllCustomers); // Read All
router.get('/getCustomerById/:id', customerController.getCustomerById); // Read One
router.get('/getCustomersByHotelId/:hotelfk', customerController.getCustomersByHotelId);
router.put('/updateCustomer/:id', customerController.updateCustomer); // Update
router.delete('/deleteCustomer/:id', customerController.deleteCustomer); // Delete
router.get('/searchCustomer', customerController.searchCustomer); //search

module.exports = router;
