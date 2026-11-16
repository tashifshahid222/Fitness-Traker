const { ApiError } = require('../utils/ApiError');
const { isAllowedOrigin } = require('../config/allowedOrigins');

const csrfProtection = (req, res, next) => {
  const origin = req.get('origin');
  const csrfHeader = req.get('x-csrf-protection');

  if (csrfHeader !== '1' || (origin && !isAllowedOrigin(origin))) {
    return next(ApiError.forbidden('Request could not be verified'));
  }

  return next();
};

module.exports = csrfProtection;
