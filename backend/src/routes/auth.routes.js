const router = require('express').Router();
const { register, login, refresh, me, logout, logoutAll } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const csrfProtection = require('../middleware/csrf.middleware');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimit.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

router.post('/register', authLimiter, csrfProtection, validate(registerSchema), register);
router.post('/login', authLimiter, csrfProtection, validate(loginSchema), login);
router.post('/refresh', refreshLimiter, csrfProtection, refresh);
router.get('/me', protect, me);
router.post('/logout', csrfProtection, protect, logout);
router.post('/logout-all', csrfProtection, protect, logoutAll);

module.exports = router;
