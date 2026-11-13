const ElectricityMeter = require('../models/ElectricityMeter');
const ElectricityReading = require('../models/ElectricityReading');
const ElectricityBill = require('../models/ElectricityBill');
const ElectricityPayment = require('../models/ElectricityPayment');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { generateElectricityReceiptPDF } = require('../services/pdfService');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all electricity meters
 * @route   GET /api/electricity/meters
 * @access  Private (Owner)
 */
const getMeters = async (req, res) => {
  try {
    const meters = await ElectricityMeter.find()
      .populate('room', 'roomNumber floor status currentTenant')
      .sort({ meterNumber: 1 });

    res.json({
      success: true,
      count: meters.length,
      meters,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Record monthly meter reading & auto-generate electricity bill
 * @route   POST /api/electricity/readings
 * @access  Private (Owner)
 */
const recordReading = async (req, res) => {
  try {
    const {
      roomId,
      meterNumber,
      billingMonth, // 'YYYY-MM'
      currentReading,
      readingDate,
      ratePerUnit,
      notes,
    } = req.body;

    const room = await Room.findById(roomId).populate('currentTenant');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const curRead = Number(currentReading);
    if (isNaN(curRead) || curRead < 0) {
      return res.status(400).json({
        success: false,
        message: 'Current reading must be a valid positive number',
      });
    }

    const month = billingMonth || new Date().toISOString().slice(0, 7);

    // Prevent duplicate reading for the same room and billing month
    const existingReading = await ElectricityReading.findOne({
      room: roomId,
      billingMonth: month,
    });

    if (existingReading) {
      return res.status(400).json({
        success: false,
        message: `An electricity reading has already been recorded for Room ${room.roomNumber} in ${month}.`,
      });
    }

    // Find previous reading for this room
    const lastReading = await ElectricityReading.findOne({
      room: roomId,
      billingMonth: { $lt: month },
    }).sort({ billingMonth: -1 });

    let prevReading = 0;
    if (lastReading) {
      prevReading = lastReading.currentReading;
    } else {
      // Check meter initial reading
      const meter = await ElectricityMeter.findOne({ room: roomId });
      if (meter) {
        prevReading = meter.initialReading || 0;
      }
    }

    if (curRead < prevReading) {
      return res.status(400).json({
        success: false,
        message: `Current reading (${curRead}) cannot be less than previous reading (${prevReading})`,
      });
    }

    const unitsConsumed = curRead - prevReading;
    const unitRate = Number(ratePerUnit) || 9.5;
    const billAmount = Math.round(unitsConsumed * unitRate);

    // Photo if uploaded
    let photoUrl = '';
    if (req.file) {
      photoUrl = `/api/documents/meters/${req.file.filename}`;
    }

    const reading = await ElectricityReading.create({
      meterNumber: meterNumber || room.electricityMeterNumber || `MTR-${room.roomNumber}`,
      room: room._id,
      tenant: room.currentTenant ? room.currentTenant._id : null,
      billingMonth: month,
      previousReading: prevReading,
      currentReading: curRead,
      unitsConsumed,
      ratePerUnit: unitRate,
      calculatedAmount: billAmount,
      readingDate: readingDate ? new Date(readingDate) : new Date(),
      photoUrl,
      notes: notes || '',
    });

    // Update meter's current reading
    await ElectricityMeter.findOneAndUpdate(
      { room: room._id },
      { currentReading: curRead },
      { upsert: true }
    );

    // Auto-generate Electricity Bill if tenant exists
    let bill = null;
    if (room.currentTenant) {
      // Check previous unpaid balance
      const prevBill = await ElectricityBill.findOne({
        room: room._id,
        billingMonth: { $lt: month },
      }).sort({ billingMonth: -1 });

      const prevBalance = prevBill ? Math.max(0, prevBill.remainingBalance) : 0;
      const totalDue = billAmount + prevBalance;

      const [y, m] = month.split('-');
      const dueDate = new Date(Number(y), Number(m) - 1, 10); // 10th of the month

      const billNumber = `EBILL-${month.replace('-', '')}-${room.roomNumber}-${Date.now().toString().slice(-3)}`;

      bill = await ElectricityBill.create({
        billNumber,
        reading: reading._id,
        room: room._id,
        tenant: room.currentTenant._id,
        billingMonth: month,
        meterNumber: reading.meterNumber,
        billingType: room.electricityBillingType || 'submeter',
        previousReading: prevReading,
        currentReading: curRead,
        unitsConsumed,
        ratePerUnit: unitRate,
        billAmount,
        previousBalance: prevBalance,
        totalDue,
        amountPaid: 0,
        remainingBalance: totalDue,
        dueDate,
        status: new Date() > dueDate ? 'Overdue' : 'Pending',
      });
    }

    await logAudit(
      'RECORD_ELECTRICITY_READING',
      'ELECTRICITY',
      {
        room: room.roomNumber,
        billingMonth: month,
        unitsConsumed,
        billAmount,
      },
      req
    );

    res.status(201).json({
      success: true,
      message: `Reading recorded: ${unitsConsumed} units consumed. Bill generated: Rs. ${billAmount}.`,
      reading,
      bill,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get electricity readings
 * @route   GET /api/electricity/readings
 * @access  Private (Owner)
 */
const getReadings = async (req, res) => {
  try {
    const { roomId, month } = req.query;
    let query = {};

    if (roomId && roomId !== 'all') query.room = roomId;
    if (month && month !== 'all') query.billingMonth = month;

    const readings = await ElectricityReading.find(query)
      .populate('room', 'roomNumber floor floorName')
      .populate('tenant', 'fullName primaryMobile')
      .sort({ billingMonth: -1, readingDate: -1 });

    res.json({
      success: true,
      count: readings.length,
      readings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all electricity bills
 * @route   GET /api/electricity/bills
 * @access  Private (Owner)
 */
const getBills = async (req, res) => {
  try {
    const { month, status, roomId, tenantId } = req.query;
    let query = {};

    if (month && month !== 'all') query.billingMonth = month;
    if (status && status !== 'all') query.status = status;
    if (roomId && roomId !== 'all') query.room = roomId;
    if (tenantId && tenantId !== 'all') query.tenant = tenantId;

    const bills = await ElectricityBill.find(query)
      .populate('tenant', 'fullName primaryMobile')
      .populate('room', 'roomNumber floor floorName')
      .populate('reading')
      .sort({ billingMonth: -1, createdAt: -1 });

    res.json({
      success: true,
      count: bills.length,
      bills,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Record electricity payment
 * @route   POST /api/electricity/payments
 * @access  Private (Owner)
 */
const recordElectricityPayment = async (req, res) => {
  try {
    const {
      billId,
      amountPaid,
      paymentDate,
      paymentMethod,
      transactionReference,
      notes,
    } = req.body;

    const bill = await ElectricityBill.findById(billId)
      .populate('tenant')
      .populate('room')
      .populate('reading');

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Electricity bill not found' });
    }

    const paidAmt = Number(amountPaid);
    if (!paidAmt || paidAmt <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero',
      });
    }

    const pmtNum = `EPMT-${Date.now().toString().slice(-6)}`;
    const recNum = `EREC-${bill.billingMonth.replace('-', '')}-${Date.now().toString().slice(-4)}`;

    const payment = await ElectricityPayment.create({
      paymentNumber: pmtNum,
      receiptNumber: recNum,
      bill: bill._id,
      tenant: bill.tenant._id,
      room: bill.room._id,
      amountPaid: paidAmt,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'UPI',
      transactionReference: transactionReference || '',
      notes: notes || '',
    });

    const newAmountPaid = (bill.amountPaid || 0) + paidAmt;
    const newRemaining = Math.max(0, bill.totalDue - newAmountPaid);

    bill.amountPaid = newAmountPaid;
    bill.remainingBalance = newRemaining;
    bill.lastPaymentDate = payment.paymentDate;

    if (newRemaining === 0) {
      bill.status = 'Paid';
    } else {
      bill.status = 'Partially Paid';
    }

    await bill.save();

    await logAudit(
      'RECORD_ELECTRICITY_PAYMENT',
      'ELECTRICITY',
      {
        billNumber: bill.billNumber,
        amount: paidAmt,
        tenant: bill.tenant.fullName,
      },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Electricity payment recorded successfully',
      payment,
      bill,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Download Electricity Bill PDF
 * @route   GET /api/electricity/bills/:id/pdf
 * @access  Private (Owner)
 */
const downloadElectricityBillPDF = async (req, res) => {
  try {
    const bill = await ElectricityBill.findById(req.params.id)
      .populate('tenant')
      .populate('room')
      .populate('reading');

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const owner = await User.findById(req.user._id);

    generateElectricityReceiptPDF(res, {
      bill,
      reading: bill.reading,
      tenant: bill.tenant,
      room: bill.room,
      owner,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMeters,
  recordReading,
  getReadings,
  getBills,
  recordElectricityPayment,
  downloadElectricityBillPDF,
};

