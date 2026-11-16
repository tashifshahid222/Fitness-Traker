const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { list, getById, create, update, remove } = require('../controllers/workout.controller');
const validate = require('../middleware/validate.middleware');
const { workoutBodySchema, workoutQuerySchema } = require('../validators/workout.validator');

router.use(protect);

router.get('/', validate(workoutQuerySchema, 'query'), list);
router.post('/', validate(workoutBodySchema), create);
router.get('/:id', getById);
router.put('/:id', validate(workoutBodySchema), update);
router.delete('/:id', remove);

module.exports = router;