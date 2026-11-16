const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const { sendError } = require('../utils/apiResponse');

const buildHandler = (message) => (req, res) => {
  sendError(res, { statusCode: 429, message });
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Too many requests, please try again later'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Too many login attempts. Please try again in a few minutes.'),
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Too many refresh requests. Please try again later.'),
});

module.exports = { apiLimiter, authLimiter, refreshLimiter };
