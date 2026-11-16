import { http } from './api';

const list = (params, config) => http.get('/notifications', { ...config, params });
const markRead = (id) => http.put(`/notifications/${id}/read`);
const markAllRead = () => http.put('/notifications/read-all');
const remove = (id) => http.del(`/notifications/${id}`);

export default { list, markRead, markAllRead, remove };