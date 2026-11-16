const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');
const analyticsService = require('../services/analytics.service');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(req.user.id);
  return sendSuccess(res, { message: 'Dashboard data retrieved successfully', data });
});

const workoutAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.workoutAnalytics(req.user.id);
  return sendSuccess(res, { message: 'Workout analytics retrieved successfully', data });
});

const nutritionAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.nutritionAnalytics(req.user.id);
  return sendSuccess(res, { message: 'Nutrition analytics retrieved successfully', data });
});

const progressAnalytics = asyncHandler(async (req, res) => {
  const parsed = Number(req.query.days);
  const days = Number.isFinite(parsed) ? Math.min(365, Math.max(1, Math.floor(parsed))) : 30;
  const data = await analyticsService.progressAnalytics(req.user.id, days);
  return sendSuccess(res, { message: 'Progress analytics retrieved successfully', data });
});

module.exports = { getDashboard, workoutAnalytics, nutritionAnalytics, progressAnalytics };