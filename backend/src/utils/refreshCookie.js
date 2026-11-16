const { env } = require('../config/env');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: REFRESH_COOKIE_PATH,
});

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...cookieOptions(), maxAge: COOKIE_MAX_AGE });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions());
};

const getRefreshCookie = (req) => {
  const cookies = req.headers.cookie || '';
  const prefix = `${REFRESH_COOKIE_NAME}=`;
  const entry = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : null;
};

module.exports = { setRefreshCookie, clearRefreshCookie, getRefreshCookie };
