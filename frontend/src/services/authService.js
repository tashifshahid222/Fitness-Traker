import { getAccessToken, http, refreshAccessToken } from './api';

const register = (payload) => http.post('/auth/register', payload);
const login = (credentials) => http.post('/auth/login', credentials);
const getMe = () => http.get('/auth/me');
const logoutConfig = () => {
  const token = getAccessToken();
  return {
    skipAuthRefresh: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};
const logout = () => http.post('/auth/logout', {}, logoutConfig());
const logoutAll = () => http.post('/auth/logout-all', {}, logoutConfig());
const refresh = (config) => refreshAccessToken(config);

export default { register, login, getMe, logout, logoutAll, refresh };