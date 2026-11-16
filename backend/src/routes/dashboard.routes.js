const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getDashboard,
  workoutAnalytics,
  nutritionAnalytics,
  progressAnalytics,
} = require('../controllers/dashboard.controller');

router.use(protect);

router.get('/', getDashboard);
router.get('/workout-analytics', workoutAnalytics);
router.get('/nutrition-analytics', nutritionAnalytics);
router.get('/progress-analytics', progressAnalytics);

module.exports = router;