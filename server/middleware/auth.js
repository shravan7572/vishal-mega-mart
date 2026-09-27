const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ success: false, message: 'Access denied. Invalid token format.' });
    }

    const secret = process.env.JWT_SECRET || 'vishal_mega_mart_super_secret_jwt_key_2025';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    // Try finding user by ID
    let user = null;
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id).select('-password');
    }

    // Fallback: Try finding by email
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
    }

    // If user record is missing from current database (e.g. database was migrated/switched),
    // restore the user record automatically so user's valid JWT session is NEVER broken!
    if (!user && decoded.id) {
      try {
        const userId = mongoose.Types.ObjectId.isValid(decoded.id)
          ? new mongoose.Types.ObjectId(decoded.id)
          : new mongoose.Types.ObjectId();

        const userEmail = (decoded.email || `customer_${userId.toString().slice(-6)}@vishalmegamart.com`).toLowerCase();

        user = new User({
          _id: userId,
          name: decoded.name || 'Valued Customer',
          email: userEmail,
          password: 'AutoRestored@123',
          role: decoded.role || 'customer',
        });
        await user.save();
      } catch (err) {
        // Fallback user object if duplicate key or write collision
        user = await User.findOne({ email: (decoded.email || '').toLowerCase() });
        if (!user) {
          user = {
            _id: decoded.id,
            name: decoded.name || 'Valued Customer',
            email: decoded.email || 'customer@vishalmegamart.com',
            role: decoded.role || 'customer',
          };
        }
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account could not be found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin rights required.' });
  }
  next();
};

const requireCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Customer login required.' });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireCustomer,
};
