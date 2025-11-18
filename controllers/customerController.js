const { Model } = require("sequelize");
const sequelize = require("../config/db");
const Customer = require('../models/customer');
const User = require('../models/user');
const Hotel = require('../models/hotels');
const userController = require('./userController');

const { Op, where } = require("sequelize");

// Create a new customer
exports.createCustomer = async (req, res) => {
  const transaction = await sequelize.transaction();
    try {
      const { usersfk, hotelfk, mobile, name, address, email, details } = req.body;

    if (!mobile || !name || !hotelfk) {
      return res.status(400).json({ error: 'Missing required fields: mobile, name, hotelfk' });
    }

    // Find or create the user
    let user = await User.findOne({ where: { mobile } });

    if (!user) {
      const password = "user@123";

      user = await userController.upsertOnlyUser(
        mobile,
        address,
        password,
        transaction,
        name,
        email
      );
    }

    // Check if customer already exists in this hotel
    const existingCustomer = await Customer.findOne({
      where: { usersfk: user.id, hotelfk }
    });

    if (existingCustomer) {
      return res.status(409).json({ message: "Customer already exists for this hotel" });
    }

    // Create customer
    const customer = await Customer.create(
      { 
        usersfk: user.id,
        hotelfk,
        details 
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Customer created successfully",
      customer
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error in createCustomer:", error);
    return res.status(500).json({ error: error.message });
  }
};
  
  // Get all customer
  exports.getAllCustomers = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const { count, rows: customers } = await Customer.findAndCountAll({
            include: [
                { model: User, as: 'user', attributes: { exclude: ['password'] } }, // Exclude password field
                { model: Hotel, as: 'hotel' }
            ],
            limit,
            offset
        });

        if (customers.length === 0) {
            return res.status(404).json({ error: 'No customers found' });
        }

        res.status(200).json({
            totalCustomers: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            customers
        });
    } catch (error) {
        console.log("Error is:-", error);
        res.status(500).json({ error: error.message });
    }
  };  

  // Get a customer by ID
  exports.getCustomerById = async (req, res) => {
    try {
      const { id } = req.params;
      const customer1 = await Customer.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password'] } }, // Exclude password field
          { model: Hotel, as: 'hotel' }
        ]
      });
      if (!customer1) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.status(200).json(customer);
    } catch (error) {
      console.log("Error is:-", error);
      res.status(500).json({ error: error.message });
    }
  };
  
  // Get a customer by vendorId
  exports.getCustomersByHotelId = async (req, res) => {
    try {
        const { hotelfk } = req.params;
        let { page = 1, limit = 10 } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const { count, rows: customers } = await Customer.findAndCountAll({
            where: { hotelfk },
            include: [
                { model: User, as: 'user', attributes: { exclude: ['password'] } },// Exclude password field
                { model: Hotel, as: 'hotel' }
            ],
            limit,
            offset
        });

        if (customers.length === 0) {
            return res.status(404).json({ error: 'No customers found' });
        }

        res.status(200).json({
            totalCustomers: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            customers
        });
    } catch (error) {
        console.log("Error is:-", error);
        res.status(500).json({ error: error.message });
    }
  };
  
  // Update a customer by ID
  exports.updateCustomer = async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await Customer.findByPk(id);
      if (!customer) {
        return res.status(404).json({ error: 'customer not found' });
      }
      await customer.update(req.body);
      res.status(200).json({ message: 'Customer updated successfully', customer });
    } catch (error) {
      console.log("error is :-", error);
      res.status(500).json({ error: error.message });
    }
  };
  
  // Delete a customer by ID
  exports.deleteCustomer = async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await Customer.findByPk(id);
      if (!customer) {
        return res.status(404).json({ error: 'customer not found' });
      }
      await customer.destroy();
      res.status(200).json({ message: 'customer deleted successfully' });
    } catch (error) {
      console.log("error is:-", error);
      res.status(500).json({ error: error.message });
    }
  };
  
  // Search customers for a particular vendor
exports.searchCustomer = async (req, res) => {
  try {
    // Extract query parameter
    const { searchTerm, hotelfk } = req.query;

    if (!hotelfk) {
      return res.status(400).json({ message: "hotel ID is required" });
    }

    // Base condition → vendor scope
    const whereClause = { hotelfk };

    // Optional search term
    if (searchTerm && searchTerm.trim() !== "") {
      whereClause[Op.or] = [
        {"$user.name$": { [Op.like]: `%${searchTerm}%` } },
        {"$user.address$": { [Op.like]: `%${searchTerm}%` }},
        {"$user.mobile$": { [Op.like]: `%${searchTerm}%` }},
        {"$user.email$": { [Op.like]: `%${searchTerm}%` }},
      ];
    }

    const customers = await Customer.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "mobile", "email", "address"], // hide password
          required: true, // Ensures INNER JOIN for accurate filtering
        },
      ],
      where: whereClause,
      order: [["id", "DESC"]],
    });

    if (!customers.length) {
      return res.status(404).json({ message: "No customers found for this vendor" });
    }

    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error in searching customers:", error);
    return res.status(500).json({ message: "Error searching for customers", error });
  }
};