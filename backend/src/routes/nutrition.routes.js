const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { list, getById, create, update, remove } = require('../controllers/nutrition.controller');
const validate = require('../middleware/validate.middleware');
const { nutritionBodySchema, nutritionQuerySchema } = require('../validators/nutrition.validator');

router.use(protect);

router.get('/', validate(nutritionQuerySchema, 'query'), list);
router.post('/', validate(nutritionBodySchema), create);
router.get('/:id', getById);
router.put('/:id', validate(nutritionBodySchema), update);
router.delete('/:id', remove);

module.exports = router;