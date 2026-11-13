const express = require('express');
const router = express.Router();
const {
  generateMonthlyInvoices,
  getInvoices,
  getInvoiceById,
  recordRentPayment,
  getRentPayments,
  downloadReceiptPDF,
} = require('../controllers/rentController');
const { protectOwner } = require('../middleware/authMiddleware');

router.use(protectOwner);

router.post('/generate-invoices', generateMonthlyInvoices);
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceById);

router.route('/payments')
  .get(getRentPayments)
  .post(recordRentPayment);

router.get('/receipts/:paymentId/pdf', downloadReceiptPDF);

module.exports = router;

