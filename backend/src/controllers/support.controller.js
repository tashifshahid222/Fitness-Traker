const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const supportService = require('../services/support.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await supportService.list(req.user.id, req.query);
  return sendSuccess(res, { message: 'Support tickets retrieved successfully', data: items, meta });
});

const getById = asyncHandler(async (req, res) => {
  const ticket = await supportService.getById(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Support ticket retrieved', data: ticket });
});

const create = asyncHandler(async (req, res) => {
  const ticket = await supportService.create(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Support ticket submitted successfully', data: ticket });
});

const update = asyncHandler(async (req, res) => {
  const ticket = await supportService.update(req.user.id, req.params.id, req.body);
  return sendSuccess(res, { message: 'Support ticket updated successfully', data: ticket });
});

module.exports = { list, getById, create, update };