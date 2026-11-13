const express = require('express');
const router = express.Router();
const {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  vacateTenant,
  uploadTenantPhoto,
  deleteTenant,
} = require('../controllers/tenantController');
const { protectOwner } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protectOwner);

router.route('/')
  .get(getAllTenants)
  .post(createTenant);

router.route('/:id')
  .get(getTenantById)
  .put(updateTenant)
  .delete(deleteTenant);

router.post('/:id/vacate', vacateTenant);
router.post('/:id/photo', upload.single('photo'), uploadTenantPhoto);

module.exports = router;

