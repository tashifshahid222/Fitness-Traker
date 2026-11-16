const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getMe, updateMe, changePassword, deleteMe } = require('../controllers/user.controller');
const validate = require('../middleware/validate.middleware');
const { updateUserSchema, changePasswordSchema, deleteAccountSchema } = require('../validators/user.validator');

router.use(protect);

router.get('/me', getMe);
router.put('/me', validate(updateUserSchema), updateMe);
router.put('/me/password', validate(changePasswordSchema), changePassword);
router.delete('/me', validate(deleteAccountSchema), deleteMe);

module.exports = router;