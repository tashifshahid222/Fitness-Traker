import { http } from './api';

const getSummary = (signal) => http.get('/dashboard', { signal });
const workoutAnalytics = () => http.get('/dashboard/workout-analytics');
const nutritionAnalytics = () => http.get('/dashboard/nutrition-analytics');
const progressAnalytics = (days) => http.get('/dashboard/progress-analytics', { params: days ? { days } : {} });

export default { getSummary, workoutAnalytics, nutritionAnalytics, progressAnalytics };