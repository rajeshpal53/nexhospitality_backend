const Hotel = require('../models/hotels');
const Transaction = require('../models/transactions');
const User = require('../models/users');
const Booking = require('../models/bookings');
const { Op } = require('sequelize');
const moment = require('moment');

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { hotelfk, userfk, bookingfk, amount, transactionDate, transactionStatus, paymentMode, remark } = req.body;

    // Check booking
    const booking = await Booking.findByPk(bookingfk);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    if (transactionStatus === "credit" && amount > booking.remaining) {
      return res.status(400).json({ error: "Amount exceeds remaining amount" });
    }
    
    // Create transaction and update invoice in one transaction
    const transaction = await Transaction.create({
      hotelfk,
      userfk,
      bookingfk,
      amount,
      transactionDate: transactionDate || new Date(),
      transactionStatus,
      paymentMode,
      remark
    });

    if(transactionStatus == 'credit'){
      await customer.update({ remainingAmount: customer.remainingAmount - amount});
    } else if( transactionStatus == 'debit'){
      await customer.update({ remainingAmount: customer.remainingAmount + amount});
    }

    return res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    console.error('Transaction Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
try {
    const transactions = await Transaction.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "name", "mobile", "email", "address"] },
        { model: Hotel, as: "hotel" },
        { model: Booking, as: "booking" },
      ],
    });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a transaction by ID
exports.getTransactionById = async (req, res) => {
try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "mobile", "email", "address"] },
        { model: Hotel, as: "hotel" },
        { model: Booking, as: "booking" },
      ],
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a transaction by ID
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { hotelfk, userfk, amount, transactionStatus } = req.body;

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    Object.assign(transaction, { hotelfk, userfk, amount, transactionStatus });
    await transaction.save();

    res.status(200).json({ message: 'Transaction updated successfully', transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTransactionsByUsersfk = async (req, res) => {
  try {
    const { userfk, hotelfk } = req.query;
    let { page = 1, limit = 10 } = req.query; // Default to page 1, 10 records per page

    if (!userfk) {
      return res.status(400).json({ message: "userfk is required" });
    }

    let whereClause = {};

    if (userfk) {
      whereClause.userfk = userfk
    }

    if (hotelfk) {
      whereClause.hotelfk = hotelfk
    }

    // Convert pagination params to integers
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    // Fetch transactions with pagination
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "mobile", "email", "address"] },
        { model: Hotel, as: "hotel" },
        { model: Booking, as: "booking" },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    if (!transactions.length) {
      return res.status(404).json({ message: "No transactions found for this userfk" });
    }

    res.status(200).json({
      message: "Transactions retrieved successfully",
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions by userfk", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getTransactionsByHotelfk = async (req, res) => {
  try {
    const { hotelfk } = req.params;
    let { page = 1, limit = 10 } = req.query; // Default to page 1, 10 records per page

    if (!hotelfk) {
      return res.status(400).json({ message: 'hotelfk is required' });
    }

    // Convert pagination params to integers
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;
    
    // Fetch all users who have transactions with the given vendor
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where:{hotelfk : hotelfk},
      include: [
        { model: User, as: "user", attributes: ["id", "name", "mobile", "email", "address"] },
        { model: Hotel, as: "hotel" },
        { model: Booking, as: "booking" },
      ],
      limit,
      offset,
    });

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found for this hotelfk' });
    }

    res.status(200).json({
      message: "Transactions retrieved successfully",
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      transactions,
    });  
  } catch (error) {
    console.error('Error fetching transactions by hotelfk', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.searchTransaction = async (req, res) => {
  try {
    // Get search term and pagination parameters from the query string
    const { searchTerm, hotelfk, userfk, bookingfk, transactionStatus, paymentMode } = req.query;

    let whereClause = {};

    if(hotelfk){
      whereClause.hotelfk = hotelfk;
    }

    if(userfk){
      whereClause.userfk = userfk;
    }

    if(bookingfk){
      whereClause.bookingfk = bookingfk;
    }
    
    if(transactionStatus){
      whereClause.transactionStatus = transactionStatus;
    }

    if(paymentMode){
      whereClause.paymentMode = paymentMode;
    }

    // Try to parse the search term as a date (assuming YYYY-MM-DD format)
    let dateSearch = null;
    if (moment(searchTerm, "YYYY-MM-DD", true).isValid()) {
      dateSearch = moment(searchTerm, "YYYY-MM-DD").startOf("day").toDate();
    }

    if (searchTerm && searchTerm.trim() !== ""){
      whereClause[Op.or]= [
        // Adjust the fields to search based on your model
        { amount: { [Op.like]: `%${searchTerm}%` } },
        { remark: { [Op.like]: `%${searchTerm}%` } },
        { paymentMode: { [Op.like]: `%${searchTerm}%` } },
        { "$user.name$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.email$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.mobile$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.hotelName$": { [Op.like]: `%${searchTerm}%` } },
        { "$hotel.address$": { [Op.like]: `%${searchTerm}%` } },
        { transactionStatus: { [Op.like]: `%${searchTerm}%` } },
        ...(dateSearch
          ? [{ createdAt: { [Op.between]: [dateSearch, moment(dateSearch).endOf("day").toDate()] } }]
          : []),
      ];
    }
    
    // Fetch orders filtered by search term
    const transaction = await Transaction.findAll({
      where: {
        ...whereClause,
      },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "mobile", "email", "address"] },
        { model: Hotel, as: "hotel" },
        { model: Booking, as: "booking" },
      ],
    });

    return res.status(200).json(transaction);
  } catch (error) {
    console.log("Error is:-", error);
    return res
      .status(500)
      .json({ message: "Error searching transactions", error });
  }
};

// Delete a transaction by ID
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.destroy();
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
