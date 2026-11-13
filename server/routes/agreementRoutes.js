const express = require('express');
const router = express.Router();
const {
  getAllAgreements,
  getAgreementById,
  createAgreement,
  renewAgreement,
  processDepositRefund,
  downloadAgreementPDF,
} = require('../controllers/agreementController');
const { protectOwner } = require('../middleware/authMiddleware');

router.use(protectOwner);

router.route('/')
  .get(getAllAgreements)
  .post(createAgreement);

router.get('/:id', getAgreementById);
router.post('/:id/renew', renewAgreement);
router.post('/:id/refund-deposit', processDepositRefund);
router.get('/:id/pdf', downloadAgreementPDF);

module.exports = router;

