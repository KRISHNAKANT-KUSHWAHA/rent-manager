const RentInvoice = require('../models/RentInvoice');
const RentPayment = require('../models/RentPayment');
const RentalAgreement = require('../models/RentalAgreement');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { generateRentReceiptPDF } = require('../services/pdfService');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Generate monthly rent invoices for active agreements
 * @route   POST /api/rent/generate-invoices
 * @access  Private (Owner)
 */
const generateMonthlyInvoices = async (req, res) => {
  try {
    const { month } = req.body; // 'YYYY-MM'
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    // Find all active rental agreements
    const activeAgreements = await RentalAgreement.find({ status: 'Active' })
      .populate('tenant')
      .populate('room');

    if (activeAgreements.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active rental agreements found to generate invoices.',
      });
    }

    let createdCount = 0;
    let skippedCount = 0;
    const generatedInvoices = [];

    for (const agreement of activeAgreements) {
      // Check if invoice already exists for this agreement & month (avoid duplicates)
      const existing = await RentInvoice.findOne({
        agreement: agreement._id,
        billingMonth: targetMonth,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Calculate previous outstanding balance from latest prior invoice
      const prevInvoice = await RentInvoice.findOne({
        agreement: agreement._id,
        billingMonth: { $lt: targetMonth },
      }).sort({ billingMonth: -1 });

      const previousBalance = prevInvoice ? Math.max(0, prevInvoice.remainingBalance) : 0;
      const rentAmount = agreement.monthlyRent;
      const totalDue = rentAmount + previousBalance;

      // Set due date as the specified day of target month (e.g., 5th)
      const [yearStr, monthStr] = targetMonth.split('-');
      const dueDay = agreement.rentDueDay || 5;
      const dueDate = new Date(Number(yearStr), Number(monthStr) - 1, dueDay);

      const invoiceNumber = `INV-${targetMonth.replace('-', '')}-${agreement.room.roomNumber}-${Date.now().toString().slice(-3)}`;

      const newInvoice = await RentInvoice.create({
        invoiceNumber,
        agreement: agreement._id,
        tenant: agreement.tenant._id,
        room: agreement.room._id,
        billingMonth: targetMonth,
        rentAmount,
        previousBalance,
        totalDue,
        amountPaid: 0,
        remainingBalance: totalDue,
        dueDate,
        status: new Date() > dueDate ? 'Overdue' : 'Pending',
      });

      generatedInvoices.push(newInvoice);
      createdCount++;
    }

    await logAudit(
      'GENERATE_INVOICES',
      'RENT',
      { targetMonth, createdCount, skippedCount },
      req
    );

    res.json({
      success: true,
      message: `Generated ${createdCount} invoices for ${targetMonth}. ${skippedCount} were already generated.`,
      createdCount,
      skippedCount,
      generatedInvoices,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all rent invoices with filters
 * @route   GET /api/rent/invoices
 * @access  Private (Owner)
 */
const getInvoices = async (req, res) => {
  try {
    const { month, status, roomId, tenantId, search } = req.query;
    let query = {};

    if (month && month !== 'all') query.billingMonth = month;
    if (status && status !== 'all') query.status = status;
    if (roomId && roomId !== 'all') query.room = roomId;
    if (tenantId && tenantId !== 'all') query.tenant = tenantId;

    const invoices = await RentInvoice.find(query)
      .populate('tenant', 'fullName primaryMobile maskedAadhaar')
      .populate('room', 'roomNumber floor floorName')
      .populate('agreement', 'agreementNumber monthlyRent')
      .sort({ billingMonth: -1, createdAt: -1 });

    res.json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get single invoice by ID with payment records
 * @route   GET /api/rent/invoices/:id
 * @access  Private (Owner)
 */
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await RentInvoice.findById(req.params.id)
      .populate('tenant')
      .populate('room')
      .populate('agreement');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const payments = await RentPayment.find({ invoice: invoice._id }).sort({
      paymentDate: -1,
    });

    res.json({
      success: true,
      invoice,
      payments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Record rent payment (Full, Partial, or Advance)
 * @route   POST /api/rent/payments
 * @access  Private (Owner)
 */
const recordRentPayment = async (req, res) => {
  try {
    const {
      invoiceId,
      amountPaid,
      paymentDate,
      paymentMethod,
      transactionReference,
      notes,
    } = req.body;

    const invoice = await RentInvoice.findById(invoiceId)
      .populate('tenant')
      .populate('room')
      .populate('agreement');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const paymentAmount = Number(amountPaid);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero',
      });
    }

    const pmtNum = `PMT-${Date.now().toString().slice(-6)}`;
    const recNum = `REC-${invoice.billingMonth.replace('-', '')}-${Date.now().toString().slice(-4)}`;

    const payment = await RentPayment.create({
      paymentNumber: pmtNum,
      receiptNumber: recNum,
      invoice: invoice._id,
      tenant: invoice.tenant._id,
      room: invoice.room._id,
      agreement: invoice.agreement._id,
      amountPaid: paymentAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'UPI',
      transactionReference: transactionReference || '',
      notes: notes || '',
    });

    // Update Invoice balances
    const newAmountPaid = (invoice.amountPaid || 0) + paymentAmount;
    const newRemaining = Math.max(0, invoice.totalDue - newAmountPaid);

    invoice.amountPaid = newAmountPaid;
    invoice.remainingBalance = newRemaining;
    invoice.lastPaymentDate = payment.paymentDate;

    if (newRemaining === 0) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Partially Paid';
    }

    await invoice.save();

    await logAudit(
      'RECORD_RENT_PAYMENT',
      'RENT',
      {
        receiptNumber: recNum,
        amount: paymentAmount,
        invoiceNumber: invoice.invoiceNumber,
        tenant: invoice.tenant.fullName,
      },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Rent payment recorded successfully',
      payment,
      invoice,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get rent payment history
 * @route   GET /api/rent/payments
 * @access  Private (Owner)
 */
const getRentPayments = async (req, res) => {
  try {
    const { tenantId, roomId, month } = req.query;
    let query = {};

    if (tenantId && tenantId !== 'all') query.tenant = tenantId;
    if (roomId && roomId !== 'all') query.room = roomId;

    const payments = await RentPayment.find(query)
      .populate('tenant', 'fullName primaryMobile')
      .populate('room', 'roomNumber floor floorName')
      .populate('invoice', 'invoiceNumber billingMonth totalDue remainingBalance')
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Download Official Rent Receipt PDF
 * @route   GET /api/rent/receipts/:paymentId/pdf
 * @access  Private (Owner)
 */
const downloadReceiptPDF = async (req, res) => {
  try {
    const payment = await RentPayment.findById(req.params.paymentId)
      .populate('tenant')
      .populate('room')
      .populate('invoice');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const owner = await User.findById(req.user._id);

    generateRentReceiptPDF(res, {
      payment,
      invoice: payment.invoice,
      tenant: payment.tenant,
      room: payment.room,
      owner,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  generateMonthlyInvoices,
  getInvoices,
  getInvoiceById,
  recordRentPayment,
  getRentPayments,
  downloadReceiptPDF,
};

