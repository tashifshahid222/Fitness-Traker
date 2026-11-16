const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { list, markRead, markAllRead, remove } = require('../controllers/notification.controller');

router.use(protect);

router.get('/', list);
router.delete('/:id', remove);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

module.exports = router;