import { http } from './api';

const list = (params) => http.get('/goals', { params });
const get = (id) => http.get(`/goals/${id}`);
const create = (body) => http.post('/goals', body);
const update = (id, body) => http.put(`/goals/${id}`, body);
const remove = (id) => http.del(`/goals/${id}`);

export default { list, get, create, update, remove };