const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const nutritionService = require('../services/nutrition.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await nutritionService.list(req.user.id, req.query);
  return sendSuccess(res, { message: 'Nutrition entries retrieved successfully', data: items, meta });
});

const getById = asyncHandler(async (req, res) => {
  const entry = await nutritionService.getById(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Nutrition entry retrieved', data: entry });
});

const create = asyncHandler(async (req, res) => {
  const entry = await nutritionService.create(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Nutrition entry created successfully', data: entry });
});

const update = asyncHandler(async (req, res) => {
  const entry = await nutritionService.update(req.user.id, req.params.id, req.body);
  return sendSuccess(res, { message: 'Nutrition entry updated successfully', data: entry });
});

const remove = asyncHandler(async (req, res) => {
  await nutritionService.remove(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Nutrition entry deleted successfully' });
});

module.exports = { list, getById, create, update, remove };