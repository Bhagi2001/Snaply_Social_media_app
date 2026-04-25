const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  register,
  login,
  refreshToken,
  getMe,
  updateFcmToken,
  logout,
  registerValidation,
  loginValidation
} = require('../controllers/authController');

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', auth, getMe);
router.put('/fcm-token', auth, updateFcmToken);
router.post('/logout', auth, logout);

module.exports = router;
