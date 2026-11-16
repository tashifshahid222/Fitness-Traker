import { http } from './api';

const list = (params) => http.get('/support', { params });
const get = (id) => http.get(`/support/${id}`);
const create = (body) => http.post('/support', body);
const close = (id) => http.put(`/support/${id}`, { status: 'closed' });

export default { list, get, create, close };