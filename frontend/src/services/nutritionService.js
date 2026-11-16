import { http } from './api';

const list = (params) => http.get('/nutrition', { params });
const get = (id) => http.get(`/nutrition/${id}`);
const create = (body) => http.post('/nutrition', body);
const update = (id, body) => http.put(`/nutrition/${id}`, body);
const remove = (id) => http.del(`/nutrition/${id}`);

export default { list, get, create, update, remove };