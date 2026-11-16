const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const authService = require('../services/auth.service');
const { setRefreshCookie, clearRefreshCookie, getRefreshCookie } = require('../utils/refreshCookie');

const register = asyncHandler(async (req, res) => {
  const { user } = await authService.register(req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  return sendSuccess(res, {
    message: 'Logged in successfully',
    data: { user, accessToken },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshCookie(req);
  if (!refreshToken) {
    clearRefreshCookie(res);
    return sendSuccess(res, {
      message: 'No active session',
      data: { authenticated: false },
    });
  }

  try {
    const tokens = await authService.refresh(refreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    return sendSuccess(res, {
      message: 'Token refreshed successfully',
      data: { accessToken: tokens.accessToken },
    });
  } catch (error) {
    if (error.statusCode === 401) clearRefreshCookie(res);
    throw error;
  }
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, {
    message: 'Current user',
    data: { user },
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.sessionId);
  clearRefreshCookie(res);
  return sendSuccess(res, {
    message: 'Logged out successfully',
  });
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearRefreshCookie(res);
  return sendSuccess(res, { message: 'Logged out from all devices successfully' });
});

module.exports = { register, login, refresh, me, logout, logoutAll };
