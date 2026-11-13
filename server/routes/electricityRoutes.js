const express = require('express');
const router = express.Router();
const {
  getMeters,
  recordReading,
  updateReading,
  deleteReading,
  getReadings,
  getBills,
  updateBill,
  deleteBill,
  recordElectricityPayment,
  downloadElectricityBillPDF,
} = require('../controllers/electricityController');
const { protectOwner } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protectOwner);

router.get('/meters', getMeters);

router.route('/readings')
  .get(getReadings)
  .post(upload.single('meterPhoto'), recordReading);

router.route('/readings/:id')
  .put(updateReading)
  .delete(deleteReading);

router.get('/bills', getBills);
router.route('/bills/:id')
  .put(updateBill)
  .delete(deleteBill);

router.post('/payments', recordElectricityPayment);
router.get('/bills/:id/pdf', downloadElectricityBillPDF);

module.exports = router;

