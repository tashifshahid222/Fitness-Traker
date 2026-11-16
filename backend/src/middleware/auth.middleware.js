const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Invalid or expired access token');
    }
    throw error;
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  req.user = {
    id: user._id.toString(),
    sessionId: decoded.sessionId,
    username: user.username,
    notifications: user.preferences?.notifications,
    weightUnit: user.preferences?.weightUnit === 'lb' ? 'lb' : 'kg',
  };

  next();
});

module.exports = { protect };
