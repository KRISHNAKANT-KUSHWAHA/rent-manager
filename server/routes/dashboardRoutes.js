const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protectOwner } = require('../middleware/authMiddleware');

router.use(protectOwner);

router.get('/stats', getDashboardStats);

module.exports = router;

