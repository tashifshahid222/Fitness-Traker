const logger = require('../config/logger');
const { ApiError } = require('../utils/ApiError');
const { sendError } = require('../utils/apiResponse');
const { env } = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || null;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for '${err.path}'`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `A record with that ${field} already exists`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body too large';
  }

  if (err.name === 'ZodError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = (err.issues || []).map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }

  const logDetails = {
    method: req.method,
    url: req.originalUrl,
    status: statusCode,
    userId: req.user?.id,
    ip: req.ip,
  };

  if (statusCode >= 500) {
    logger.error({ message, ...logDetails, stack: err.stack });
  } else {
    logger.warn({ message, ...logDetails });
  }

  const showStack = env.NODE_ENV !== 'production' && statusCode >= 500;

  return sendError(res, {
    statusCode,
    message: statusCode >= 500 && env.NODE_ENV === 'production' ? 'Something went wrong' : message,
    errors,
    stack: showStack ? err.stack : undefined,
  });
};

module.exports = errorHandler;
