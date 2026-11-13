const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protectOwner = async (req, res, next) => {
  let token;

  // 1) Read token from cookies or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in as property owner.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'rent_manager_super_secret_jwt_key_2026'
    );

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Owner account not found. Authorization failed.',
      });
    }

    if (user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Owner credentials required.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.',
    });
  }
};

module.exports = { protectOwner };

