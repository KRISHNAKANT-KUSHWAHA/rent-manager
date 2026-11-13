const express = require('express');
const router = express.Router();
const {
  getAuthStatus,
  loginOwner,
  getMe,
  changePassword,
  updateProfile,
  logoutOwner,
  setupOwner,
  resetData,
} = require('../controllers/authController');
const { protectOwner } = require('../middleware/authMiddleware');

router.get('/status', getAuthStatus);
router.post('/login', loginOwner);
router.post('/logout', logoutOwner);
router.post('/setup', setupOwner);

// Protected routes
router.get('/me', protectOwner, getMe);
router.put('/change-password', protectOwner, changePassword);
router.put('/profile', protectOwner, updateProfile);
router.post('/reset-data', protectOwner, resetData);

module.exports = router;
