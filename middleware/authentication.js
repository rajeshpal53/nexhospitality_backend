const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/users');

const authenticateToken = async(req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { mobile, iat } = decoded;
    let user = await User.findOne({ where: { mobile } });
    if (!user) return res.status(404).send({ message: 'User not found' });
    const tokenValidityTimestamp = user.token_validity ? new Date(user.token_validity).getTime() / 1000 : 0;
  
    // Check if token is still valid
    if (iat < tokenValidityTimestamp) {
        return res.status(401).send({ message: 'Token is expired or invalid' });
      }
  
    req.user = {
      ...decoded,
      roles: user.roles,
    }; // Attach decoded token to request
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'Invalid token.' });
  }
  };

module.exports = authenticateToken;
