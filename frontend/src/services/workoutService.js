import { http } from './api';

const list = (params) => http.get('/workouts', { params });
const get = (id) => http.get(`/workouts/${id}`);
const create = (body) => http.post('/workouts', body);
const update = (id, body) => http.put(`/workouts/${id}`, body);
const remove = (id) => http.del(`/workouts/${id}`);

export default { list, get, create, update, remove };