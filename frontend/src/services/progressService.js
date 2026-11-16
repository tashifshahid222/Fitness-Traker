import { http } from './api';

const list = (params) => http.get('/progress', { params });
const get = (id) => http.get(`/progress/${id}`);
const create = (body) => http.post('/progress', body);
const update = (id, body) => http.put(`/progress/${id}`, body);
const remove = (id) => http.del(`/progress/${id}`);

export default { list, get, create, update, remove };