const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = undefined } = {}) => {
  const payload = { success: true, message };
  if (data !== undefined && data !== null) payload.data = data;
  if (meta !== undefined) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const sendError = (res, { statusCode = 500, message = 'Something went wrong', errors = null, stack = undefined } = {}) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  if (stack) payload.stack = stack;
  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendError };
