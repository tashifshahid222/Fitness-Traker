const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { list, getById, create, update, remove } = require('../controllers/progress.controller');
const validate = require('../middleware/validate.middleware');
const { progressBodySchema, progressQuerySchema } = require('../validators/progress.validator');

router.use(protect);

router.get('/', validate(progressQuerySchema, 'query'), list);
router.post('/', validate(progressBodySchema), create);
router.get('/:id', getById);
router.put('/:id', validate(progressBodySchema), update);
router.delete('/:id', remove);

module.exports = router;