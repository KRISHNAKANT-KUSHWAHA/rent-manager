const express = require('express');
const router = express.Router();
const { getReportsData, exportCSV } = require('../controllers/reportController');
const { protectOwner } = require('../middleware/authMiddleware');

router.use(protectOwner);

router.get('/analytics', getReportsData);
router.get('/export-csv', exportCSV);

module.exports = router;

