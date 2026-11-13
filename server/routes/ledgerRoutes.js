const express = require('express');
const router = express.Router();
const { getTenantLedger } = require('../controllers/ledgerController');
const { protectOwner } = require('../middleware/authMiddleware');

router.use(protectOwner);

router.get('/tenant/:tenantId', getTenantLedger);

module.exports = router;

