const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const progressService = require('../services/progress.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await progressService.list(req.user.id, req.query);
  return sendSuccess(res, { message: 'Progress entries retrieved successfully', data: items, meta });
});

const getById = asyncHandler(async (req, res) => {
  const entry = await progressService.getById(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Progress entry retrieved', data: entry });
});

const create = asyncHandler(async (req, res) => {
  const entry = await progressService.create(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Progress entry created successfully', data: entry });
});

const update = asyncHandler(async (req, res) => {
  const entry = await progressService.update(req.user.id, req.params.id, req.body);
  return sendSuccess(res, { message: 'Progress entry updated successfully', data: entry });
});

const remove = asyncHandler(async (req, res) => {
  await progressService.remove(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Progress entry deleted successfully' });
});

module.exports = { list, getById, create, update, remove };