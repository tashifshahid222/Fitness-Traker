const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const goalService = require('../services/goal.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await goalService.list(req.user.id, req.query);
  return sendSuccess(res, { message: 'Goals retrieved successfully', data: items, meta });
});

const getById = asyncHandler(async (req, res) => {
  const goal = await goalService.getById(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Goal retrieved', data: goal });
});

const create = asyncHandler(async (req, res) => {
  const goal = await goalService.create(req.user.id, req.body, req.user.notifications);
  return sendSuccess(res, { statusCode: 201, message: 'Goal created successfully', data: goal });
});

const update = asyncHandler(async (req, res) => {
  const goal = await goalService.update(req.user.id, req.params.id, req.body, req.user.notifications);
  return sendSuccess(res, { message: 'Goal updated successfully', data: goal });
});

const remove = asyncHandler(async (req, res) => {
  await goalService.remove(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Goal deleted successfully' });
});

module.exports = { list, getById, create, update, remove };