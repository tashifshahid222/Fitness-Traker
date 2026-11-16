const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { list, getById, create, update, remove } = require('../controllers/goal.controller');
const validate = require('../middleware/validate.middleware');
const { goalBodySchema, goalQuerySchema } = require('../validators/goal.validator');

router.use(protect);

router.get('/', validate(goalQuerySchema, 'query'), list);
router.post('/', validate(goalBodySchema), create);
router.get('/:id', getById);
router.put('/:id', validate(goalBodySchema), update);
router.delete('/:id', remove);

module.exports = router;