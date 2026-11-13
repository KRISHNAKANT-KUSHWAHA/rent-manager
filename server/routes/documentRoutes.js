const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  viewDocument,
  downloadDocument,
  deleteDocument,
  streamPhoto,
} = require('../controllers/documentController');
const { protectOwner } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Photo viewing endpoint (protected)
router.get('/photos/:filename', protectOwner, streamPhoto);

router.use(protectOwner);

router.route('/')
  .get(getDocuments);

router.post('/upload', upload.single('document'), uploadDocument);

router.get('/:id/view', viewDocument);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

module.exports = router;

