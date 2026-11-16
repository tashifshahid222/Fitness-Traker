const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const workoutService = require('../services/workout.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await workoutService.list(req.user.id, req.query);
  return sendSuccess(res, { message: 'Workouts retrieved successfully', data: items, meta });
});

const getById = asyncHandler(async (req, res) => {
  const workout = await workoutService.getById(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Workout retrieved', data: workout });
});

const create = asyncHandler(async (req, res) => {
  const workout = await workoutService.create(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Workout created successfully', data: workout });
});

const update = asyncHandler(async (req, res) => {
  const workout = await workoutService.update(req.user.id, req.params.id, req.body);
  return sendSuccess(res, { message: 'Workout updated successfully', data: workout });
});

const remove = asyncHandler(async (req, res) => {
  await workoutService.remove(req.user.id, req.params.id);
  return sendSuccess(res, { message: 'Workout deleted successfully' });
});

module.exports = { list, getById, create, update, remove };