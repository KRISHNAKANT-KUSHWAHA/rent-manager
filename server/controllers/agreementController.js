const RentalAgreement = require('../models/RentalAgreement');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { generateAgreementPDF } = require('../services/pdfService');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all rental agreements
 * @route   GET /api/agreements
 * @access  Private (Owner)
 */
const getAllAgreements = async (req, res) => {
  try {
    const { status, roomId, tenantId } = req.query;
    let query = {};

    if (status && status !== 'all') query.status = status;
    if (roomId && roomId !== 'all') query.room = roomId;
    if (tenantId && tenantId !== 'all') query.tenant = tenantId;

    const agreements = await RentalAgreement.find(query)
      .populate('tenant', 'fullName primaryMobile permanentAddress maskedAadhaar')
      .populate('room', 'roomNumber floor floorName monthlyRent')
      .populate('agreementDocument')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: agreements.length,
      agreements,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get single agreement by ID
 * @route   GET /api/agreements/:id
 * @access  Private (Owner)
 */
const getAgreementById = async (req, res) => {
  try {
    const agreement = await RentalAgreement.findById(req.params.id)
      .populate('tenant')
      .populate('room')
      .populate('agreementDocument');

    if (!agreement) {
      return res.status(404).json({ success: false, message: 'Agreement not found' });
    }

    res.json({
      success: true,
      agreement,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Create new rental agreement
 * @route   POST /api/agreements
 * @access  Private (Owner)
 */
const createAgreement = async (req, res) => {
  try {
    const {
      tenantId,
      roomId,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      rentDueDay,
      ratePerUnit,
      terms,
      notes,
    } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if room already has an active agreement
    const existingActive = await RentalAgreement.findOne({
      room: roomId,
      status: 'Active',
    });
    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `Room ${room.roomNumber} already has an active rental agreement (${existingActive.agreementNumber}). Multiple active agreements are prohibited.`,
      });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const agrNumber = `AGR-${room.roomNumber}-${Date.now().toString().slice(-4)}`;

    const agreement = await RentalAgreement.create({
      agreementNumber: agrNumber,
      tenant: tenantId,
      room: roomId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit),
      rentDueDay: Number(rentDueDay) || 5,
      ratePerUnit: Number(ratePerUnit) || 9.5,
      terms: Array.isArray(terms) && terms.length > 0 ? terms : undefined,
      notes: notes || '',
      status: 'Active',
    });

    // Update room status
    room.status = 'Occupied';
    room.currentTenant = tenantId;
    room.currentAgreement = agreement._id;
    await room.save();

    // Update tenant current room
    tenant.currentRoom = roomId;
    tenant.status = 'Active';
    await tenant.save();

    await logAudit(
      'CREATE_AGREEMENT',
      'AGREEMENT',
      { agreementNumber: agrNumber, room: room.roomNumber, tenant: tenant.fullName },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Rental agreement created successfully',
      agreement,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Renew rental agreement
 * @route   POST /api/agreements/:id/renew
 * @access  Private (Owner)
 */
const renewAgreement = async (req, res) => {
  try {
    const { newEndDate, newMonthlyRent, notes } = req.body;

    const agreement = await RentalAgreement.findById(req.params.id);
    if (!agreement) {
      return res.status(404).json({ success: false, message: 'Agreement not found' });
    }

    const oldEnd = agreement.endDate;
    const oldRent = agreement.monthlyRent;

    agreement.renewalHistory.push({
      previousAgreementId: agreement._id,
      renewedAt: new Date(),
      oldEndDate: oldEnd,
      newEndDate: new Date(newEndDate),
      oldRent,
      newRent: Number(newMonthlyRent) || oldRent,
      notes: notes || 'Agreement renewed by owner',
    });

    agreement.endDate = new Date(newEndDate);
    if (newMonthlyRent) agreement.monthlyRent = Number(newMonthlyRent);
    agreement.status = 'Active';
    await agreement.save();

    // Also update room's rent if revised
    if (newMonthlyRent) {
      await Room.findByIdAndUpdate(agreement.room, {
        monthlyRent: Number(newMonthlyRent),
      });
    }

    await logAudit(
      'RENEW_AGREEMENT',
      'AGREEMENT',
      { agreementNumber: agreement.agreementNumber, newMonthlyRent },
      req
    );

    res.json({
      success: true,
      message: 'Agreement renewed successfully',
      agreement,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Process Security Deposit Refund / Settlement
 * @route   POST /api/agreements/:id/refund-deposit
 * @access  Private (Owner)
 */
const processDepositRefund = async (req, res) => {
  try {
    const {
      status,
      refundAmount,
      deductionAmount,
      deductionReason,
      paymentMethod,
      transactionRef,
      notes,
    } = req.body;

    const agreement = await RentalAgreement.findById(req.params.id);
    if (!agreement) {
      return res.status(404).json({ success: false, message: 'Agreement not found' });
    }

    agreement.securityDepositRefund = {
      status: status || 'Refunded',
      refundAmount: Number(refundAmount) || 0,
      deductionAmount: Number(deductionAmount) || 0,
      deductionReason: deductionReason || '',
      refundDate: new Date(),
      paymentMethod: paymentMethod || 'UPI',
      transactionRef: transactionRef || '',
      notes: notes || '',
    };

    await agreement.save();

    await logAudit(
      'REFUND_DEPOSIT',
      'AGREEMENT',
      { agreementNumber: agreement.agreementNumber, refundAmount, deductionAmount },
      req
    );

    res.json({
      success: true,
      message: 'Security deposit refund updated',
      agreement,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Download Printable Agreement Summary PDF
 * @route   GET /api/agreements/:id/pdf
 * @access  Private (Owner)
 */
const downloadAgreementPDF = async (req, res) => {
  try {
    const agreement = await RentalAgreement.findById(req.params.id)
      .populate('tenant')
      .populate('room');

    if (!agreement) {
      return res.status(404).json({ success: false, message: 'Agreement not found' });
    }

    const owner = await User.findById(req.user._id);

    generateAgreementPDF(res, {
      agreement,
      tenant: agreement.tenant,
      room: agreement.room,
      owner,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllAgreements,
  getAgreementById,
  createAgreement,
  renewAgreement,
  processDepositRefund,
  downloadAgreementPDF,
};

