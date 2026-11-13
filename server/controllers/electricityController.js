const fs = require('fs');
const ElectricityMeter = require('../models/ElectricityMeter');
const ElectricityReading = require('../models/ElectricityReading');
const ElectricityBill = require('../models/ElectricityBill');
const ElectricityPayment = require('../models/ElectricityPayment');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { generateElectricityReceiptPDF } = require('../services/pdfService');
const { logAudit } = require('../services/auditService');
const { uploadToImageKit } = require('../services/imagekitService');

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
      try {
        if (fs.existsSync(req.file.path)) {
          const fileBuffer = fs.readFileSync(req.file.path);
          const cloud = await uploadToImageKit(fileBuffer, req.file.originalname, '/meters');
          if (cloud && cloud.url) {
            photoUrl = cloud.url;
          }
        }
      } catch (cloudErr) {
        console.warn('[ImageKit Meter Photo Warning]', cloudErr.message);
      }
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

/**
 * @desc    Update electricity bill
 * @route   PUT /api/electricity/bills/:id
 * @access  Private (Owner)
 */
const updateBill = async (req, res) => {
  try {
    const bill = await ElectricityBill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Electricity bill not found' });
    }

    const {
      currentReading,
      previousReading,
      ratePerUnit,
      unitsConsumed,
      dueDate,
      notes,
    } = req.body;

    if (currentReading !== undefined) bill.currentReading = Number(currentReading);
    if (previousReading !== undefined) bill.previousReading = Number(previousReading);
    if (ratePerUnit !== undefined) bill.ratePerUnit = Number(ratePerUnit);

    const calculatedUnits =
      unitsConsumed !== undefined
        ? Number(unitsConsumed)
        : Math.max(0, bill.currentReading - bill.previousReading);

    bill.unitsConsumed = calculatedUnits;
    bill.billAmount = Math.round(calculatedUnits * bill.ratePerUnit);
    bill.totalDue = bill.billAmount + (bill.previousBalance || 0);
    bill.remainingBalance = Math.max(0, bill.totalDue - (bill.amountPaid || 0));

    if (dueDate) bill.dueDate = new Date(dueDate);

    if (bill.remainingBalance === 0) {
      bill.status = 'Paid';
    } else if (bill.amountPaid > 0) {
      bill.status = 'Partially Paid';
    } else {
      bill.status = new Date() > new Date(bill.dueDate) ? 'Overdue' : 'Pending';
    }

    await bill.save();

    // Also sync the associated reading if it exists
    if (bill.reading) {
      const reading = await ElectricityReading.findById(bill.reading);
      if (reading) {
        reading.currentReading = bill.currentReading;
        reading.previousReading = bill.previousReading;
        reading.unitsConsumed = bill.unitsConsumed;
        reading.ratePerUnit = bill.ratePerUnit;
        reading.calculatedAmount = bill.billAmount;
        if (notes !== undefined) reading.notes = notes;
        await reading.save();
      }
    }

    // Sync meter reading
    if (bill.room) {
      const latestReading = await ElectricityReading.findOne({ room: bill.room }).sort({
        billingMonth: -1,
      });
      if (latestReading) {
        await ElectricityMeter.findOneAndUpdate(
          { room: bill.room },
          { currentReading: latestReading.currentReading }
        );
      }
    }

    await logAudit(
      'UPDATE_ELECTRICITY_BILL',
      'ELECTRICITY',
      {
        billNumber: bill.billNumber,
        totalDue: bill.totalDue,
        unitsConsumed: bill.unitsConsumed,
      },
      req
    );

    res.json({
      success: true,
      message: 'Electricity bill updated successfully',
      bill,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Delete electricity bill & its reading
 * @route   DELETE /api/electricity/bills/:id
 * @access  Private (Owner)
 */
const deleteBill = async (req, res) => {
  try {
    const bill = await ElectricityBill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Electricity bill not found' });
    }

    const roomId = bill.room;

    // Delete associated payments
    await ElectricityPayment.deleteMany({ bill: bill._id });

    // Delete associated reading
    if (bill.reading) {
      await ElectricityReading.findByIdAndDelete(bill.reading);
    } else {
      await ElectricityReading.findOneAndDelete({
        room: bill.room,
        billingMonth: bill.billingMonth,
      });
    }

    await ElectricityBill.findByIdAndDelete(bill._id);

    // Re-sync meter current reading
    if (roomId) {
      const latestReading = await ElectricityReading.findOne({ room: roomId }).sort({
        billingMonth: -1,
      });
      const meter = await ElectricityMeter.findOne({ room: roomId });
      const currentReading = latestReading
        ? latestReading.currentReading
        : meter?.initialReading || 0;
      await ElectricityMeter.findOneAndUpdate({ room: roomId }, { currentReading });
    }

    await logAudit(
      'DELETE_ELECTRICITY_BILL',
      'ELECTRICITY',
      { billNumber: bill.billNumber },
      req
    );

    res.json({
      success: true,
      message: 'Electricity bill and associated meter reading deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update electricity meter reading
 * @route   PUT /api/electricity/readings/:id
 * @access  Private (Owner)
 */
const updateReading = async (req, res) => {
  try {
    const reading = await ElectricityReading.findById(req.params.id);
    if (!reading) {
      return res.status(404).json({ success: false, message: 'Meter reading not found' });
    }

    const {
      currentReading,
      previousReading,
      ratePerUnit,
      readingDate,
      notes,
    } = req.body;

    if (currentReading !== undefined) reading.currentReading = Number(currentReading);
    if (previousReading !== undefined) reading.previousReading = Number(previousReading);
    if (ratePerUnit !== undefined) reading.ratePerUnit = Number(ratePerUnit);
    if (readingDate) reading.readingDate = new Date(readingDate);
    if (notes !== undefined) reading.notes = notes;

    reading.unitsConsumed = Math.max(0, reading.currentReading - reading.previousReading);
    reading.calculatedAmount = Math.round(reading.unitsConsumed * reading.ratePerUnit);
    await reading.save();

    // Sync any associated bill
    const bill = await ElectricityBill.findOne({
      $or: [{ reading: reading._id }, { room: reading.room, billingMonth: reading.billingMonth }],
    });

    if (bill) {
      bill.previousReading = reading.previousReading;
      bill.currentReading = reading.currentReading;
      bill.unitsConsumed = reading.unitsConsumed;
      bill.ratePerUnit = reading.ratePerUnit;
      bill.billAmount = reading.calculatedAmount;
      bill.totalDue = bill.billAmount + (bill.previousBalance || 0);
      bill.remainingBalance = Math.max(0, bill.totalDue - (bill.amountPaid || 0));

      if (bill.remainingBalance === 0) {
        bill.status = 'Paid';
      } else if (bill.amountPaid > 0) {
        bill.status = 'Partially Paid';
      } else {
        bill.status = new Date() > new Date(bill.dueDate) ? 'Overdue' : 'Pending';
      }
      await bill.save();
    }

    // Sync meter
    if (reading.room) {
      const latestReading = await ElectricityReading.findOne({ room: reading.room }).sort({
        billingMonth: -1,
      });
      if (latestReading) {
        await ElectricityMeter.findOneAndUpdate(
          { room: reading.room },
          { currentReading: latestReading.currentReading }
        );
      }
    }

    res.json({
      success: true,
      message: 'Meter reading and bill updated successfully',
      reading,
      bill,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Delete electricity meter reading
 * @route   DELETE /api/electricity/readings/:id
 * @access  Private (Owner)
 */
const deleteReading = async (req, res) => {
  try {
    const reading = await ElectricityReading.findById(req.params.id);
    if (!reading) {
      return res.status(404).json({ success: false, message: 'Meter reading not found' });
    }

    const roomId = reading.room;

    // Delete associated bill and payments
    const bill = await ElectricityBill.findOne({
      $or: [{ reading: reading._id }, { room: reading.room, billingMonth: reading.billingMonth }],
    });

    if (bill) {
      await ElectricityPayment.deleteMany({ bill: bill._id });
      await ElectricityBill.findByIdAndDelete(bill._id);
    }

    await ElectricityReading.findByIdAndDelete(reading._id);

    // Re-sync meter current reading
    if (roomId) {
      const latestReading = await ElectricityReading.findOne({ room: roomId }).sort({
        billingMonth: -1,
      });
      const meter = await ElectricityMeter.findOne({ room: roomId });
      const currentReading = latestReading
        ? latestReading.currentReading
        : meter?.initialReading || 0;
      await ElectricityMeter.findOneAndUpdate({ room: roomId }, { currentReading });
    }

    res.json({
      success: true,
      message: 'Meter reading and associated bill deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
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
};

