const { User } = require('../models/');
const { Op } = require('sequelize'); //Sequelize operators for complex queries
const jwt = require('jsonwebtoken'); //generating and verifying JWTs
const bcrypt = require('bcryptjs');  //password hashing
const admin = require('../config/firebase');
require('dotenv').config();    //managing secret keys

exports.loginUser = async (req, res) => {
  const { mobile, password, fcmtokens } = req.body;

  try {
    // Step 1: Check if the user exists
    let user = await User.findOne({ where: { mobile } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Compare the password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let newToken = null;

    if(fcmtokens && Array.isArray(fcmtokens)){
	  	console.log("getted", fcmtokens)
	    newToken = fcmtokens[0];//fcmtokens[0];
	  	console.log("new Token Test", newToken )
	  }

    // Step 3: Generate token and return updated user
    const resultUser = await getUserAndToken(user, newToken, req, res);
    const { user: updatedUser, token } = resultUser;

    return res.status(200).json({
      message: 'Login successful',
      user: updatedUser,
      token,
    });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

async function getUserAndToken(user, newToken, req, res) {
  if (user) {
    const existingTokens = Array.isArray(user.fcmtokens) ? user.fcmtokens : [];
    const newTokensArray = Array.isArray(newToken) ? newToken : [newToken].filter(Boolean);

    const updatedTokens = [...new Set([...existingTokens, ...newTokensArray ])];    
    console.log("Updated Tokens to Save:", updatedTokens);
      // Mobile number exists, update the user details
      user = await user.update({
        ...req.body,
        fcmtokens: updatedTokens,
        password : user.password
      });
  }

  const token = jwt.sign({ id: user.id, email: user.email, mobile: user.mobile }, process.env.JWT_SECRET, { expiresIn: req.body.device == "app" ? '180d' : '180d' });
  if(res && token) {
    storeToken(res, token);
  }
  return {user: user, token: token}
}

exports.logout = async (req, res) => {
  const { mobile } = req.body;

  // Validate input
  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required." });
  }

  try {
    // Find the user by mobile number
    const user = await User.findOne({ where: { mobile } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Invalidate all existing tokens by updating token_validity
    await user.update({ token_validity: new Date() });

    return res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.signUp = async (req, res) => {
  console.log("SignUp request received");
  try {
    const { mobile, password, device } = req.body;

    // 1. Validate required fields
    if (!mobile || !password) {
      return res.status(400).json({ message: 'Mobile number and password are required.' });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); //10:-It defines how many times the hashing algorithm will run internally.
                                                             //More secure the hash (harder to crack)
                                                             //More time it takes to compute (slower)
    // 3. Check if user already exists
    let user = await User.findOne({ where: { mobile } });

    if (user) {
      // Update password if user already exists (optional behavior)
      await user.update({ password: hashedPassword });
    } else {
      // 4. Create new user
      user = await User.create({
        ...req.body,
        password: hashedPassword,
      });
    }

    // 6. Send success response
    return res.status(200).json({
      message: 'Signup successful',
      user
    });

  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Upsert user by mobile number
exports.upsertUser = async (req, res) => {
  
  const { mobile, device, idToken } = req.body;

  // if (!idToken) {
  //   return res.status(400).json({ error: 'ID token is required.' });
  // }


  try {
      // // Verify the Firebase credential
      // const decodedToken = await admin.auth().verifyIdToken(idToken);

      // // Check if the phone number matches
      // if (!decodedToken.phone_number || decodedToken.phone_number !== "+91"+mobile) {
      //   return res.status(401).json({ error: 'Mobile number does not match the token.' });
      // }
    // Check if the mobile number exists
    let user = await User.findOne({ where: { mobile } });

    if (user) {
        // Mobile number exists, update the user details
        user = await user.update({
          ...req.body,
        });

       res.status(200)
    } else {
      // Mobile number does not exist, create a new user
      user = await User.create({
        ...req.body,
      });
      res.status(201)
    }
    const token = jwt.sign({ id: user.id, mobile: user.mobile }, process.env.JWT_SECRET, { expiresIn: device == "app" ? '180d' : '180d' });
    if(res && token) {
      storeToken(res, token);
    }
    return res.json({user: user, token: token});
  } catch (err) {
    console.log("error is:", err);
    return res.status(400).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { mobile, email, password } = req.body;

    if( !/^\d{10}$/.test(mobile) ) {
      return res.status(400).json( { error: 'Your mobile number must be exactly 10 digits numeric' } );
    }

    if( email && !/^\S+@\S+\.\S+$/.test(email) ) {
      return res.status(400).json( { error: 'Your email must be like "s@gmail.com"' } );
    }

    if( !password || password.length < 6 ) {
      return res.status(400).json( { error: 'Password must be of 6 characters' } );
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({...req.body, password: hashedPassword,});
    res.status(200).json(user);
  } catch (error) {
    console.log("error:-", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.log("error:-", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    let { page, limit } = req.query;
    
    // Convert query params to integers and set defaults
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10; // Default limit is 10

    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      limit,
      offset
    });

    res.status(200).json({
      totalUsers: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      users
    });
  } catch (error) {
    console.log("error is :-", error);
    res.status(500).json({ error: error.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update(req.body);
    res.status(200).json(user);
  } catch (error) {
    console.log("error:-", error);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({error: 'user not found'});

    await user.destroy();
    return res.status(200).json({message: 'User deleted successfully'});
  } catch (error) {
    console.log("error:-", error);
    res.status(400).json({error: error.message});
  }
};

exports.upsertOnlyUserProfileImg = async (req, res) => {
  try {
    const { mobile, ...body } = req.body; // Extract mobile separately

    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required.' });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits.' });
    }

    // Check if user exists
    let user = await User.findOne({ where: { mobile } });

    // Handle file paths for uploaded files
    const profilePicUrl = req.savedFiles?.profilePicUrl ?? user?.profilePicUrl ?? null;
    const aadharCardFronturl = req.savedFiles?.aadharCardFronturl ?? user?.aadharCardFronturl ?? null;
    const aadharCardBackurl = req.savedFiles?.aadharCardBackurl ?? user?.aadharCardBackurl ?? null;

    // Prepare updated/inserted data
    const upsertData = {
      mobile,
      ...body, // Include other fields from req.body
      profilePicUrl,
      aadharCardFronturl,
      aadharCardBackurl
    };

    if (user) {
      // Update the existing user
      await user.update(upsertData);
      return res.status(200).json(user);
    } 
    else {
      // Create a new user
      const hashedPassword = await bcrypt.hash("user@123", 10);
      upsertData.password = hashedPassword;
      user = await User.create(upsertData);
      return res.status(201).json(user);
    }
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ message: 'Error upserting user', error: error.message || error });
  }
}

function storeToken(res, token) {
  //production
  res.cookie('token', token, {
    httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not accessible via JavaScript
    secure: process.env.NODE_ENV === 'development', // Ensures the cookie is sent only over HTTPS
    maxAge: 6 * 30 * 24 * 60 * 60 * 1000, //  6 months
    sameSite: 'strict' // CSRF protection
  });
};

exports.searchUser = async (req, res) => {  
  try {
    let { limit, page, searchTerm } = req.query  // from query params

    //Pagination
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    //empty whereclause objects
    const whereClause = {}; 

    // Search Term (LIKE search across multiple fields)
    if (searchTerm && searchTerm.trim() !== "") {
      whereClause[Op.or] = [
        { "$user.id$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.name$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.aadharCard$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.mobile$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.role$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.email$": { [Op.like]: `%${searchTerm}%` } },
      ];
    }

  console.log("Final whereClause:", JSON.stringify(whereClause, null, 2));

    const { count, rows: user } = await User.findAndCountAll({
      where: whereClause,
      distinct: true, //no duplicate allowed
      limit,
      offset,
      include: [
        { model: User, as: 'user' }
      ],
      order: orderCondition,
      logging: console.log   //shows raw SQL
    });

    return res.status(200).json({
      totalBills: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      bills
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ error: error.message });
  }
};