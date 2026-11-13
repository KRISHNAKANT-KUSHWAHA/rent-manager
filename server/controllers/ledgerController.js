const Tenant = require('../models/Tenant');
const RentInvoice = require('../models/RentInvoice');
const RentPayment = require('../models/RentPayment');
const ElectricityBill = require('../models/ElectricityBill');
const ElectricityPayment = require('../models/ElectricityPayment');
const RentalAgreement = require('../models/RentalAgreement');

/**
 * @desc    Get complete individual financial ledger for a tenant
 * @route   GET /api/ledger/tenant/:tenantId
 * @access  Private (Owner)
 */
const getTenantLedger = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { year, month } = req.query;

    const tenant = await Tenant.findById(tenantId).populate('currentRoom');
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Filter conditions for invoices & bills
    let monthRegex = null;
    if (year && month) {
      const padM = String(month).padStart(2, '0');
      monthRegex = new RegExp(`^${year}-${padM}`);
    } else if (year) {
      monthRegex = new RegExp(`^${year}-`);
    }

    let invoiceFilter = { tenant: tenant._id };
    let billFilter = { tenant: tenant._id };

    if (monthRegex) {
      invoiceFilter.billingMonth = monthRegex;
      billFilter.billingMonth = monthRegex;
    }

    // 1. Fetch Agreements (Security Deposit, Start/End)
    const agreements = await RentalAgreement.find({ tenant: tenant._id })
      .populate('room', 'roomNumber')
      .sort({ startDate: -1 });

    const totalSecurityDepositHeld = agreements.reduce(
      (acc, a) => acc + (a.status === 'Active' ? a.securityDeposit : 0),
      0
    );

    const totalSecurityDepositRefunded = agreements.reduce(
      (acc, a) => acc + (a.securityDepositRefund?.refundAmount || 0),
      0
    );

    // 2. Fetch Rent Invoices
    const rentInvoices = await RentInvoice.find(invoiceFilter)
      .populate('room', 'roomNumber')
      .sort({ billingMonth: 1 });

    // 3. Fetch Rent Payments
    const rentPayments = await RentPayment.find({ tenant: tenant._id })
      .populate('room', 'roomNumber')
      .populate('invoice', 'billingMonth invoiceNumber')
      .sort({ paymentDate: 1 });

    // 4. Fetch Electricity Bills
    const electricityBills = await ElectricityBill.find(billFilter)
      .populate('room', 'roomNumber')
      .sort({ billingMonth: 1 });

    // 5. Fetch Electricity Payments
    const electricityPayments = await ElectricityPayment.find({ tenant: tenant._id })
      .populate('room', 'roomNumber')
      .populate('bill', 'billingMonth billNumber')
      .sort({ paymentDate: 1 });

    // Financial Summaries
    const totalRentBilled = rentInvoices.reduce((acc, i) => acc + i.rentAmount, 0);
    const totalRentPaid = rentInvoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
    const pendingRent = rentInvoices.reduce(
      (acc, i) => acc + (i.remainingBalance || 0),
      0
    );

    const totalElectricityBilled = electricityBills.reduce(
      (acc, b) => acc + b.billAmount,
      0
    );
    const totalElectricityPaid = electricityBills.reduce(
      (acc, b) => acc + (b.amountPaid || 0),
      0
    );
    const pendingElectricity = electricityBills.reduce(
      (acc, b) => acc + (b.remainingBalance || 0),
      0
    );

    const totalOutstandingBalance = pendingRent + pendingElectricity;

    // Build unified sorted transaction timeline (Debit vs Credit)
    const timeline = [];

    // Add Rent Invoices (Debit)
    rentInvoices.forEach((inv) => {
      timeline.push({
        id: inv._id,
        date: inv.createdAt,
        type: 'RENT_INVOICE',
        category: 'Rent',
        description: `Rent Invoice for ${inv.billingMonth} (${inv.room?.roomNumber || 'Room'})`,
        reference: inv.invoiceNumber,
        debit: inv.rentAmount,
        credit: 0,
        status: inv.status,
      });
    });

    // Add Rent Payments (Credit)
    rentPayments.forEach((pmt) => {
      timeline.push({
        id: pmt._id,
        date: pmt.paymentDate,
        type: 'RENT_PAYMENT',
        category: 'Rent',
        description: `Rent Payment via ${pmt.paymentMethod} (Ref: ${pmt.transactionReference || 'N/A'})`,
        reference: pmt.receiptNumber,
        debit: 0,
        credit: pmt.amountPaid,
        status: 'Completed',
      });
    });

    // Add Electricity Bills (Debit)
    electricityBills.forEach((eb) => {
      timeline.push({
        id: eb._id,
        date: eb.createdAt,
        type: 'ELECTRICITY_BILL',
        category: 'Electricity',
        description: `Electricity Bill for ${eb.billingMonth} (${eb.unitsConsumed} units @ Rs.${eb.ratePerUnit})`,
        reference: eb.billNumber,
        debit: eb.billAmount,
        credit: 0,
        status: eb.status,
      });
    });

    // Add Electricity Payments (Credit)
    electricityPayments.forEach((ep) => {
      timeline.push({
        id: ep._id,
        date: ep.paymentDate,
        type: 'ELECTRICITY_PAYMENT',
        category: 'Electricity',
        description: `Electricity Payment via ${ep.paymentMethod}`,
        reference: ep.receiptNumber,
        debit: 0,
        credit: ep.amountPaid,
        status: 'Completed',
      });
    });

    // Sort timeline chronologically
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    timeline.forEach((item) => {
      runningBalance += item.debit - item.credit;
      item.runningBalance = runningBalance;
    });

    res.json({
      success: true,
      tenant,
      agreements,
      summary: {
        totalSecurityDepositHeld,
        totalSecurityDepositRefunded,
        totalRentBilled,
        totalRentPaid,
        pendingRent,
        totalElectricityBilled,
        totalElectricityPaid,
        pendingElectricity,
        totalOutstandingBalance,
      },
      timeline: timeline.reverse(), // display newest first
      rentInvoices,
      rentPayments,
      electricityBills,
      electricityPayments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTenantLedger,
};

