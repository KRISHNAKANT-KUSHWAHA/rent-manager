const express = require('express');
const router = express.Router();
const {
  getMeters,
  recordReading,
  getReadings,
  getBills,
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

router.get('/bills', getBills);
router.post('/payments', recordElectricityPayment);
router.get('/bills/:id/pdf', downloadElectricityBillPDF);

module.exports = router;

