// routes/configRoutes.js
const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// GET /api/config?key=RAZORPAY_KEY_ID
router.get('/', configController.getConfig);

// POST /api/config (create or update)
router.post('/', configController.upsertConfig);

module.exports = router;
