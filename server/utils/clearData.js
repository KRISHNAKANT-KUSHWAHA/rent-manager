const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const TenantDocument = require('../models/TenantDocument');
const RentalAgreement = require('../models/RentalAgreement');
const RentInvoice = require('../models/RentInvoice');
const RentPayment = require('../models/RentPayment');
const ElectricityMeter = require('../models/ElectricityMeter');
const ElectricityReading = require('../models/ElectricityReading');
const ElectricityBill = require('../models/ElectricityBill');
const ElectricityPayment = require('../models/ElectricityPayment');
const Expense = require('../models/Expense');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const clearAllData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rent_manager';
    await mongoose.connect(mongoUri);
    console.log('[ClearData] Connected to MongoDB at:', mongoUri);

    // Clean all collections
    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      Tenant.deleteMany({}),
      TenantDocument.deleteMany({}),
      RentalAgreement.deleteMany({}),
      RentInvoice.deleteMany({}),
      RentPayment.deleteMany({}),
      ElectricityMeter.deleteMany({}),
      ElectricityReading.deleteMany({}),
      ElectricityBill.deleteMany({}),
      ElectricityPayment.deleteMany({}),
      Expense.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[ClearData] All collections successfully purged.');

    // Clean uploaded files except .gitkeep
    const uploadDirs = ['documents', 'photos', 'meters', 'receipts'];
    uploadDirs.forEach((sub) => {
      const dirPath = path.join(__dirname, '..', 'uploads', sub);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          if (file !== '.gitkeep') {
            fs.unlinkSync(path.join(dirPath, file));
          }
        }
      }
    });

    console.log('[ClearData] Cleaned upload directories.');
    console.log('====================================================');
    console.log('Database is now 100% clean and ready for real usage.');
    console.log('Open http://localhost:5173 to complete real owner setup.');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('[ClearData] Error clearing database:', err);
    process.exit(1);
  }
};

clearAllData();

