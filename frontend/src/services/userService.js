import { http } from './api';

const getProfile = () => http.get('/users/me');
const updateProfile = (body) => http.put('/users/me', body);
const changePassword = (body) => http.put('/users/me/password', body);
const updatePreferences = (preferences) => http.put('/users/me', { preferences });
const deleteAccount = (body) => http.del('/users/me', { data: body });

export default { getProfile, updateProfile, changePassword, updatePreferences, deleteAccount };