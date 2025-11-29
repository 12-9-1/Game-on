const jwt = require('jsonwebtoken');
const User = require('../models/User');

const tokenRequired = async (req, res, next) => {
  try {
    const token = req.headers['x-access-token'];
    
    if (!token) {
      return res.status(401).json({ message: 'Token is missing!' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    const user = await User.findOne({ public_id: decoded.public_id });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found!' });
    }
    
    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Token is invalid!', 
      error: error.message 
    });
  }
};

module.exports = { tokenRequired };
