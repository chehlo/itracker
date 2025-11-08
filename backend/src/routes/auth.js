const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');
const { validateRegister } = require('../middleware/validate');
const { getProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { login } = require('../controllers/authController');


router.post('/register', validateRegister, register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
module.exports = router;
