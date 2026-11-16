const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { list, getById, create, update } = require('../controllers/support.controller');
const validate = require('../middleware/validate.middleware');
const {
  createTicketSchema,
  updateTicketSchema,
  ticketQuerySchema,
} = require('../validators/support.validator');

router.use(protect);

router.get('/', validate(ticketQuerySchema, 'query'), list);
router.post('/', validate(createTicketSchema), create);
router.get('/:id', getById);
router.put('/:id', validate(updateTicketSchema), update);

module.exports = router;