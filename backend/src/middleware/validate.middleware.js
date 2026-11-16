const { ApiError } = require('../utils/ApiError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(ApiError.unprocessable('Validation failed', errors));
  }

  req[source] = result.data;
  return next();
};

module.exports = validate;
