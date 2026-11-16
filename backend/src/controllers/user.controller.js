const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const userService = require('../services/user.service');
const { clearRefreshCookie } = require('../utils/refreshCookie');

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  return sendSuccess(res, { message: 'Profile retrieved', data: { user } });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  return sendSuccess(res, { message: 'Profile updated successfully', data: { user } });
});

const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.id, req.body);
  return sendSuccess(res, { message: 'Password changed successfully' });
});

const deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user.id, req.body);
  clearRefreshCookie(res);
  return sendSuccess(res, { message: 'Account deleted successfully' });
});

module.exports = { getMe, updateMe, changePassword, deleteMe };