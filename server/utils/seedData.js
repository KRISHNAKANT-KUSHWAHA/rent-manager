const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

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

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rent_manager';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB at', mongoUri);

    // Clean existing collections
    await User.deleteMany();
    await Room.deleteMany();
    await Tenant.deleteMany();
    await TenantDocument.deleteMany();
    await RentalAgreement.deleteMany();
    await RentInvoice.deleteMany();
    await RentPayment.deleteMany();
    await ElectricityMeter.deleteMany();
    await ElectricityReading.deleteMany();
    await ElectricityBill.deleteMany();
    await ElectricityPayment.deleteMany();
    await Expense.deleteMany();
    await AuditLog.deleteMany();

    console.log('[Seeder] Cleared previous collections');

    // 1. Create Owner User
    const owner = await User.create({
      name: 'Radheshyam Sharma',
      email: 'owner@rentmanager.com',
      password: 'Password123!',
      phone: '+91 98290 12345',
      role: 'owner',
      houseName: 'Shanti Niwas (Property #104)',
      houseAddress: 'Plot 42, Green Avenue, Sector 15, Near City Park, Jaipur, Rajasthan - 302020',
      defaultElectricityRate: 9.5,
      upiId: 'radheshyam@okhdfcbank',
      bankDetails: {
        accountName: 'Radheshyam Sharma',
        accountNumber: '50100234891234',
        bankName: 'HDFC Bank, Sector 15 Branch',
        ifscCode: 'HDFC0001234',
      },
    });
    console.log('[Seeder] Created Owner:', owner.email);

    // 2. Create 4 Rooms in the house
    const room101 = await Room.create({
      roomNumber: 'ROOM-101',
      floor: 0,
      floorName: 'Ground Floor',
      description: 'Spacious room with attached western bathroom and direct garden view.',
      monthlyRent: 8500,
      securityDeposit: 0,
      electricityMeterNumber: 'MTR-101',
      electricityBillingType: 'submeter',
      status: 'Occupied',
      amenities: ['Attached Bathroom', 'Ceiling Fan', 'LED Lights', 'Cupboard', 'Garden Facing'],
      notes: 'Freshly painted in January 2026',
    });

    const room102 = await Room.create({
      roomNumber: 'ROOM-102',
      floor: 0,
      floorName: 'Ground Floor',
      description: 'Deluxe master room with private side-terrace access and marble flooring.',
      monthlyRent: 9500,
      securityDeposit: 0,
      electricityMeterNumber: 'MTR-102',
      electricityBillingType: 'submeter',
      status: 'Occupied',
      amenities: ['Attached Bathroom', 'Private Terrace', 'Ceiling Fan', 'Double Bed Frame'],
      notes: 'Includes reserved two-wheeler parking slot',
    });

    const room201 = await Room.create({
      roomNumber: 'ROOM-201',
      floor: 1,
      floorName: '1st Floor',
      description: 'Breezy first-floor studio room with kitchen slab, pantry, and east-facing balcony.',
      monthlyRent: 8000,
      securityDeposit: 0,
      electricityMeterNumber: 'MTR-201',
      electricityBillingType: 'submeter',
      status: 'Occupied',
      amenities: ['Attached Bathroom', 'Balcony', 'Kitchen Slab', 'Exhaust Fan'],
      notes: 'Morning sunlight, very well ventilated',
    });

    const room202 = await Room.create({
      roomNumber: 'ROOM-202',
      floor: 1,
      floorName: '1st Floor',
      description: 'Bright executive room with wooden study nook and wardrobe.',
      monthlyRent: 7000,
      securityDeposit: 0,
      electricityMeterNumber: 'MTR-202',
      electricityBillingType: 'submeter',
      status: 'Available',
      amenities: ['Attached Bathroom', 'Study Table', 'Cupboard', 'Ceiling Fan'],
      notes: 'Vacant since last week. Ready for new tenant occupancy.',
    });

    console.log('[Seeder] Created 4 Rooms');

    // 3. Create Electricity Meters for each room
    await ElectricityMeter.create([
      { meterNumber: 'MTR-101', room: room101._id, initialReading: 1200, currentReading: 1395, ratePerUnit: 9.5 },
      { meterNumber: 'MTR-102', room: room102._id, initialReading: 2150, currentReading: 2360, ratePerUnit: 9.5 },
      { meterNumber: 'MTR-201', room: room201._id, initialReading: 800, currentReading: 965, ratePerUnit: 9.5 },
      { meterNumber: 'MTR-202', room: room202._id, initialReading: 500, currentReading: 610, ratePerUnit: 9.5 },
    ]);

    // 4. Create Active Tenants
    const tenant1 = await Tenant.create({
      fullName: 'Vikram Malhotra',
      fatherName: 'Rajesh Malhotra',
      dob: new Date('1997-04-15'),
      gender: 'Male',
      occupation: 'Senior Software Engineer',
      employerOrCollege: 'Infosys Ltd, Mahindra World City',
      permanentAddress: 'House 88, Civil Lines, Kota, Rajasthan',
      currentAddress: 'Shanti Niwas, Room 101, Sector 15, Jaipur',
      primaryMobile: '9876543210',
      alternateMobile: '9876543211',
      email: 'vikram.malhotra@example.com',
      familyMembers: [
        { name: 'Sunita Malhotra', relationship: 'Mother', age: 52, phone: '9829099887', occupation: 'Homemaker' },
      ],
      emergencyContactName: 'Rajesh Malhotra',
      emergencyContactNumber: '9829011223',
      emergencyContactRelation: 'Father',
      aadhaarNumber: '987654324589',
      voterId: 'RJ/04/123/456789',
      panNumber: 'ABCDE1234F',
      currentRoom: room101._id,
      status: 'Active',
      moveInDate: new Date('2026-01-10'),
    });

    const tenant2 = await Tenant.create({
      fullName: 'Priya Sharma',
      fatherName: 'Anil Kumar Sharma',
      dob: new Date('1999-08-22'),
      gender: 'Female',
      occupation: 'Chartered Accountant',
      employerOrCollege: 'EY Global Delivery Services',
      permanentAddress: 'B-14, Shanti Nagar, Ajmer, Rajasthan',
      currentAddress: 'Shanti Niwas, Room 102, Sector 15, Jaipur',
      primaryMobile: '9823456789',
      alternateMobile: '',
      email: 'priya.sharma@example.com',
      familyMembers: [
        { name: 'Anil Kumar Sharma', relationship: 'Father', age: 56, phone: '9414012345', occupation: 'Govt Officer' },
      ],
      emergencyContactName: 'Anil Kumar Sharma',
      emergencyContactNumber: '9414012345',
      emergencyContactRelation: 'Father',
      aadhaarNumber: '876543218912',
      voterId: 'RJ/02/456/789123',
      panNumber: 'FGHIJ5678K',
      currentRoom: room102._id,
      status: 'Active',
      moveInDate: new Date('2026-02-01'),
    });

    const tenant3 = await Tenant.create({
      fullName: 'Aman Verma',
      fatherName: 'Mahesh Chand Verma',
      dob: new Date('2001-11-05'),
      gender: 'Male',
      occupation: 'UPSC Aspirant & Educator',
      employerOrCollege: 'Drishti IAS Institute',
      permanentAddress: 'Ward No 7, Near Old Bus Stand, Alwar, Rajasthan',
      currentAddress: 'Shanti Niwas, Room 201, Sector 15, Jaipur',
      primaryMobile: '9712345678',
      alternateMobile: '9712345679',
      email: 'aman.verma@example.com',
      familyMembers: [],
      emergencyContactName: 'Mahesh Chand Verma',
      emergencyContactNumber: '9414234567',
      emergencyContactRelation: 'Father',
      aadhaarNumber: '765432103341',
      voterId: 'RJ/06/789/123456',
      panNumber: 'KLMNO9012P',
      currentRoom: room201._id,
      status: 'Active',
      moveInDate: new Date('2026-03-01'),
    });

    // 1 Past Vacated Tenant
    const pastTenant = await Tenant.create({
      fullName: 'Sanjay Gupta',
      fatherName: 'Ramesh Gupta',
      dob: new Date('1995-02-14'),
      gender: 'Male',
      occupation: 'Banking Executive',
      employerOrCollege: 'State Bank of India',
      permanentAddress: '55 Jawahar Nagar, Bikaner, Rajasthan',
      primaryMobile: '9654321098',
      emergencyContactName: 'Ramesh Gupta',
      emergencyContactNumber: '9414567890',
      aadhaarNumber: '654321097723',
      status: 'Vacated',
      moveInDate: new Date('2025-06-01'),
      vacatedDate: new Date('2026-10-31'),
      notes: 'Vacated Room 202 on job transfer to Mumbai. Full security deposit settled cleanly.',
    });

    console.log('[Seeder] Created Tenants');

    // 5. Create Rental Agreements
    const agr1 = await RentalAgreement.create({
      agreementNumber: 'AGR-101-2026',
      tenant: tenant1._id,
      room: room101._id,
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-12-31'),
      monthlyRent: 8500,
      securityDeposit: 0,
      rentDueDay: 5,
      ratePerUnit: 9.5,
      status: 'Active',
    });

    const agr2 = await RentalAgreement.create({
      agreementNumber: 'AGR-102-2026',
      tenant: tenant2._id,
      room: room102._id,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2027-01-31'),
      monthlyRent: 9500,
      securityDeposit: 0,
      rentDueDay: 5,
      ratePerUnit: 9.5,
      status: 'Active',
    });

    const agr3 = await RentalAgreement.create({
      agreementNumber: 'AGR-201-2026',
      tenant: tenant3._id,
      room: room201._id,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2027-02-28'),
      monthlyRent: 8000,
      securityDeposit: 0,
      rentDueDay: 5,
      ratePerUnit: 9.5,
      status: 'Active',
    });

    // Historical agreement for past tenant
    await RentalAgreement.create({
      agreementNumber: 'AGR-202-2025',
      tenant: pastTenant._id,
      room: room202._id,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-10-31'),
      monthlyRent: 7000,
      securityDeposit: 0,
      rentDueDay: 5,
      ratePerUnit: 9.5,
      status: 'Terminated',
      vacatingDate: new Date('2026-10-31'),
      securityDepositRefund: {
        status: 'Not Applicable',
        refundAmount: 0,
        deductionAmount: 0,
        deductionReason: '',
        refundDate: new Date('2026-10-31'),
        paymentMethod: 'UPI',
        transactionRef: '',
      },
    });

    // Link current active agreements and tenants to rooms
    room101.currentTenant = tenant1._id;
    room101.currentAgreement = agr1._id;
    await room101.save();

    room102.currentTenant = tenant2._id;
    room102.currentAgreement = agr2._id;
    await room102.save();

    room201.currentTenant = tenant3._id;
    room201.currentAgreement = agr3._id;
    await room201.save();

    console.log('[Seeder] Created Rental Agreements and linked to Rooms');

    // 6. Generate Rent Invoices & Payments for recent months (September, October, November 2026)
    // September 2026 - Fully Paid
    const inv1Sep = await RentInvoice.create({
      invoiceNumber: 'INV-202609-101-001',
      agreement: agr1._id,
      tenant: tenant1._id,
      room: room101._id,
      billingMonth: '2026-09',
      rentAmount: 8500,
      previousBalance: 0,
      totalDue: 8500,
      amountPaid: 8500,
      remainingBalance: 0,
      dueDate: new Date('2026-09-05'),
      status: 'Paid',
      lastPaymentDate: new Date('2026-09-04'),
    });

    await RentPayment.create({
      paymentNumber: 'PMT-260901',
      receiptNumber: 'REC-202609-101-01',
      invoice: inv1Sep._id,
      tenant: tenant1._id,
      room: room101._id,
      agreement: agr1._id,
      amountPaid: 8500,
      paymentDate: new Date('2026-09-04'),
      paymentMethod: 'UPI',
      transactionReference: 'UPI/HDFC/99283710',
    });

    // October 2026 - Fully Paid
    const inv1Oct = await RentInvoice.create({
      invoiceNumber: 'INV-202610-101-002',
      agreement: agr1._id,
      tenant: tenant1._id,
      room: room101._id,
      billingMonth: '2026-10',
      rentAmount: 8500,
      previousBalance: 0,
      totalDue: 8500,
      amountPaid: 8500,
      remainingBalance: 0,
      dueDate: new Date('2026-10-05'),
      status: 'Paid',
      lastPaymentDate: new Date('2026-10-03'),
    });

    await RentPayment.create({
      paymentNumber: 'PMT-261001',
      receiptNumber: 'REC-202610-101-02',
      invoice: inv1Oct._id,
      tenant: tenant1._id,
      room: room101._id,
      agreement: agr1._id,
      amountPaid: 8500,
      paymentDate: new Date('2026-10-03'),
      paymentMethod: 'UPI',
      transactionReference: 'UPI/HDFC/99441122',
    });

    // November 2026 (Current Month)
    // Tenant 1: Paid ₹8,500
    const inv1Nov = await RentInvoice.create({
      invoiceNumber: 'INV-202611-101-003',
      agreement: agr1._id,
      tenant: tenant1._id,
      room: room101._id,
      billingMonth: '2026-11',
      rentAmount: 8500,
      previousBalance: 0,
      totalDue: 8500,
      amountPaid: 8500,
      remainingBalance: 0,
      dueDate: new Date('2026-11-05'),
      status: 'Paid',
      lastPaymentDate: new Date('2026-11-03'),
    });

    await RentPayment.create({
      paymentNumber: 'PMT-261101',
      receiptNumber: 'REC-202611-101-03',
      invoice: inv1Nov._id,
      tenant: tenant1._id,
      room: room101._id,
      agreement: agr1._id,
      amountPaid: 8500,
      paymentDate: new Date('2026-11-03'),
      paymentMethod: 'UPI',
      transactionReference: 'UPI/HDFC/99881122',
    });

    // Tenant 2: Partially Paid (Paid ₹5,000 out of ₹9,500)
    const inv2Nov = await RentInvoice.create({
      invoiceNumber: 'INV-202611-102-001',
      agreement: agr2._id,
      tenant: tenant2._id,
      room: room102._id,
      billingMonth: '2026-11',
      rentAmount: 9500,
      previousBalance: 0,
      totalDue: 9500,
      amountPaid: 5000,
      remainingBalance: 4500,
      dueDate: new Date('2026-11-05'),
      status: 'Partially Paid',
      lastPaymentDate: new Date('2026-11-05'),
      notes: 'Tenant promised to clear balance ₹4,500 by next week',
    });

    await RentPayment.create({
      paymentNumber: 'PMT-261102',
      receiptNumber: 'REC-202611-102-01',
      invoice: inv2Nov._id,
      tenant: tenant2._id,
      room: room102._id,
      agreement: agr2._id,
      amountPaid: 5000,
      paymentDate: new Date('2026-11-05'),
      paymentMethod: 'Bank Transfer',
      transactionReference: 'NEFT/EY/77221190',
    });

    // Tenant 3: Pending/Overdue (₹8,000 due)
    await RentInvoice.create({
      invoiceNumber: 'INV-202611-201-001',
      agreement: agr3._id,
      tenant: tenant3._id,
      room: room201._id,
      billingMonth: '2026-11',
      rentAmount: 8000,
      previousBalance: 0,
      totalDue: 8000,
      amountPaid: 0,
      remainingBalance: 8000,
      dueDate: new Date('2026-11-05'),
      status: 'Overdue',
      notes: 'Reminder sent on 6th Nov. Salary expected on 15th.',
    });

    console.log('[Seeder] Created Invoices and Payments');

    // 7. Electricity Readings & Bills
    // Room 101 Reading & Bill
    const read101 = await ElectricityReading.create({
      meterNumber: 'MTR-101',
      room: room101._id,
      tenant: tenant1._id,
      billingMonth: '2026-11',
      previousReading: 1310,
      currentReading: 1395,
      unitsConsumed: 85,
      ratePerUnit: 9.5,
      calculatedAmount: 808,
      readingDate: new Date('2026-11-01'),
      notes: 'Sub-meter regular monthly reading',
    });

    const bill101 = await ElectricityBill.create({
      billNumber: 'EBILL-202611-101',
      reading: read101._id,
      room: room101._id,
      tenant: tenant1._id,
      billingMonth: '2026-11',
      meterNumber: 'MTR-101',
      previousReading: 1310,
      currentReading: 1395,
      unitsConsumed: 85,
      ratePerUnit: 9.5,
      billAmount: 808,
      previousBalance: 0,
      totalDue: 808,
      amountPaid: 808,
      remainingBalance: 0,
      dueDate: new Date('2026-11-10'),
      status: 'Paid',
      lastPaymentDate: new Date('2026-11-04'),
    });

    await ElectricityPayment.create({
      paymentNumber: 'EPMT-261101',
      receiptNumber: 'EREC-202611-101',
      bill: bill101._id,
      tenant: tenant1._id,
      room: room101._id,
      amountPaid: 808,
      paymentDate: new Date('2026-11-04'),
      paymentMethod: 'UPI',
      transactionReference: 'UPI/HDFC/ELEC/88210',
    });

    // Room 102 Reading & Bill (Unpaid ₹1,045)
    const read102 = await ElectricityReading.create({
      meterNumber: 'MTR-102',
      room: room102._id,
      tenant: tenant2._id,
      billingMonth: '2026-11',
      previousReading: 2250,
      currentReading: 2360,
      unitsConsumed: 110,
      ratePerUnit: 9.5,
      calculatedAmount: 1045,
      readingDate: new Date('2026-11-01'),
    });

    await ElectricityBill.create({
      billNumber: 'EBILL-202611-102',
      reading: read102._id,
      room: room102._id,
      tenant: tenant2._id,
      billingMonth: '2026-11',
      meterNumber: 'MTR-102',
      previousReading: 2250,
      currentReading: 2360,
      unitsConsumed: 110,
      ratePerUnit: 9.5,
      billAmount: 1045,
      previousBalance: 0,
      totalDue: 1045,
      amountPaid: 0,
      remainingBalance: 1045,
      dueDate: new Date('2026-11-10'),
      status: 'Overdue',
    });

    // Room 201 Reading & Bill (Unpaid ₹713)
    const read201 = await ElectricityReading.create({
      meterNumber: 'MTR-201',
      room: room201._id,
      tenant: tenant3._id,
      billingMonth: '2026-11',
      previousReading: 890,
      currentReading: 965,
      unitsConsumed: 75,
      ratePerUnit: 9.5,
      calculatedAmount: 713,
      readingDate: new Date('2026-11-01'),
    });

    await ElectricityBill.create({
      billNumber: 'EBILL-202611-201',
      reading: read201._id,
      room: room201._id,
      tenant: tenant3._id,
      billingMonth: '2026-11',
      meterNumber: 'MTR-201',
      previousReading: 890,
      currentReading: 965,
      unitsConsumed: 75,
      ratePerUnit: 9.5,
      billAmount: 713,
      previousBalance: 0,
      totalDue: 713,
      amountPaid: 0,
      remainingBalance: 713,
      dueDate: new Date('2026-11-10'),
      status: 'Overdue',
    });

    console.log('[Seeder] Created Electricity Readings & Bills');

    // 8. Property Maintenance Expenses
    await Expense.create([
      {
        title: 'Overhead Water Tank Deep Cleaning',
        category: 'Cleaning',
        amount: 1500,
        date: new Date('2026-10-15'),
        description: 'Bi-annual professional cleaning and sanitization of terrace water tanks',
        paidTo: 'PureWater Solutions',
        paymentMethod: 'UPI',
      },
      {
        title: 'Common Staircase LED Fixtures Replacement',
        category: 'Electrical',
        amount: 950,
        date: new Date('2026-10-22'),
        description: 'Replaced 3 burnt 12W LED batten lamps in staircase and main gate',
        paidTo: 'Sharma Electricals',
        paymentMethod: 'Cash',
      },
      {
        title: 'Room 202 Bathroom Tap Washer & Pipe Fix',
        category: 'Plumbing',
        amount: 600,
        date: new Date('2026-11-02'),
        description: 'Fixed dripping tap and replaced PVC inlet pipe before re-renting',
        room: room202._id,
        paidTo: 'Ramesh Plumber',
        paymentMethod: 'Cash',
      },
      {
        title: 'Termite Inspection & Anti-Pest Spray',
        category: 'Pest Control',
        amount: 2200,
        date: new Date('2026-11-08'),
        description: 'Full perimeter pest control and anti-termite treatment for ground floor doors',
        paidTo: 'Jaipur Pest Busters',
        paymentMethod: 'UPI',
      },
    ]);

    console.log('[Seeder] Created Expenses');

    console.log('--------------------------------------------------');
    console.log('[Seeder] Database successfully populated with realistic data!');
    console.log('Owner Credentials:');
    console.log('Email:    owner@rentmanager.com');
    console.log('Password: Password123!');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Seeder] Error during seeding:', err);
    process.exit(1);
  }
};

seedDatabase();

