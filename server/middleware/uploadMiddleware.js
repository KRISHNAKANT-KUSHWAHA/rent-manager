const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folders exist
const uploadDirs = ['documents', 'photos', 'meters', 'receipts'];
uploadDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, '..', 'uploads', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'documents';
    if (file.fieldname === 'photo' || file.fieldname === 'tenantPhoto') {
      subfolder = 'photos';
    } else if (file.fieldname === 'meterPhoto') {
      subfolder = 'meters';
    } else if (file.fieldname === 'receipt' || file.fieldname === 'receiptFile') {
      subfolder = 'receipts';
    }
    const dest = path.join(__dirname, '..', 'uploads', subfolder);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${file.fieldname}-${cleanBase}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Unsupported file format. Please upload PDF, JPG, PNG or WEBP files only.'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
  fileFilter,
});

module.exports = upload;

