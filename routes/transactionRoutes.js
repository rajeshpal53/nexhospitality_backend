const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');


router.post('/transactions', transactionController.createTransaction); // Create
router.get('/transactions', transactionController.getAllTransactions); // Read All
router.get('/transactions/:id', transactionController.getTransactionById); // Read by ID
router.put('/transactions/:id', transactionController.updateTransaction); // Update
router.get('/getTransactionsByUsersfk', transactionController.getTransactionsByUsersfk);
router.get('/getTransactionsByHotelfk/:hotelfk', transactionController.getTransactionsByHotelfk);
router.get('/searchTransaction', transactionController.searchTransaction); //search
router.delete('/transactions/:id', transactionController.deleteTransaction); // Delete

module.exports = router;
