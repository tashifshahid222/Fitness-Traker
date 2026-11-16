const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getReport, exportCSV, exportPDF } = require('../controllers/report.controller');

router.use(protect);

router.get('/workouts', getReport('workouts'));
router.get('/nutrition', getReport('nutrition'));
router.get('/progress', getReport('progress'));
router.get('/export/csv', exportCSV);
router.get('/export/pdf', exportPDF);

module.exports = router;