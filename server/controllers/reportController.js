const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const RentInvoice = require('../models/RentInvoice');
const RentPayment = require('../models/RentPayment');
const ElectricityBill = require('../models/ElectricityBill');
const ElectricityPayment = require('../models/ElectricityPayment');
const Expense = require('../models/Expense');
const RentalAgreement = require('../models/RentalAgreement');

/**
 * @desc    Get comprehensive financial and occupancy reports
 * @route   GET /api/reports/analytics
 * @access  Private (Owner)
 */
const getReportsData = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    const startDate = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
    const endDate = month
      ? new Date(Number(year), Number(month), 0, 23, 59, 59)
      : new Date(Number(year), 11, 31, 23, 59, 59);

    // 1. Rent Collections in period
    const rentPayments = await RentPayment.find({
      paymentDate: { $gte: startDate, $lte: endDate },
    })
      .populate('tenant', 'fullName')
      .populate('room', 'roomNumber');

    const totalRentCollected = rentPayments.reduce((acc, p) => acc + p.amountPaid, 0);

    // 2. Electricity Collections in period
    const electricityPayments = await ElectricityPayment.find({
      paymentDate: { $gte: startDate, $lte: endDate },
    })
      .populate('tenant', 'fullName')
      .populate('room', 'roomNumber');

    const totalElectricityCollected = electricityPayments.reduce(
      (acc, p) => acc + p.amountPaid,
      0
    );

    // 3. Maintenance Expenses in period
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    }).populate('room', 'roomNumber');

    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // 4. Room-wise rental income
    const rooms = await Room.find();
    const roomIncomeMap = {};
    rooms.forEach((r) => {
      roomIncomeMap[r._id.toString()] = {
        roomNumber: r.roomNumber,
        floor: r.floorName || `Floor ${r.floor}`,
        status: r.status,
        monthlyRent: r.monthlyRent,
        rentCollected: 0,
        electricityCollected: 0,
        expenseIncurred: 0,
      };
    });

    rentPayments.forEach((p) => {
      if (p.room && roomIncomeMap[p.room._id.toString()]) {
        roomIncomeMap[p.room._id.toString()].rentCollected += p.amountPaid;
      }
    });

    electricityPayments.forEach((p) => {
      if (p.room && roomIncomeMap[p.room._id.toString()]) {
        roomIncomeMap[p.room._id.toString()].electricityCollected += p.amountPaid;
      }
    });

    expenses.forEach((e) => {
      if (e.room && roomIncomeMap[e.room._id.toString()]) {
        roomIncomeMap[e.room._id.toString()].expenseIncurred += e.amount;
      }
    });

    const roomPerformance = Object.values(roomIncomeMap);

    // 5. Expense breakdown by category
    const expenseCategoryMap = {};
    expenses.forEach((e) => {
      expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
    });

    const expenseBreakdown = Object.keys(expenseCategoryMap).map((cat) => ({
      category: cat,
      amount: expenseCategoryMap[cat],
    }));

    // 6. Outstanding Summary
    const outstandingInvoices = await RentInvoice.find({
      status: { $in: ['Pending', 'Partially Paid', 'Overdue'] },
    }).populate('tenant', 'fullName').populate('room', 'roomNumber');

    const totalOutstandingRent = outstandingInvoices.reduce(
      (acc, inv) => acc + inv.remainingBalance,
      0
    );

    const outstandingElectricity = await ElectricityBill.find({
      status: { $in: ['Pending', 'Partially Paid', 'Overdue'] },
    }).populate('tenant', 'fullName').populate('room', 'roomNumber');

    const totalOutstandingElectricity = outstandingElectricity.reduce(
      (acc, b) => acc + b.remainingBalance,
      0
    );

    // 7. Net Profit
    const totalGrossRevenue = totalRentCollected + totalElectricityCollected;
    const netProfit = totalGrossRevenue - totalExpenses;

    res.json({
      success: true,
      period: { year, month: month || 'Full Year' },
      summary: {
        totalRentCollected,
        totalElectricityCollected,
        totalGrossRevenue,
        totalExpenses,
        netProfit,
        totalOutstandingRent,
        totalOutstandingElectricity,
      },
      roomPerformance,
      expenseBreakdown,
      outstandingInvoices,
      outstandingElectricity,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Export financial reports to CSV
 * @route   GET /api/reports/export-csv
 * @access  Private (Owner)
 */
const exportCSV = async (req, res) => {
  try {
    const { type = 'rent' } = req.query;

    if (type === 'rent') {
      const payments = await RentPayment.find()
        .populate('tenant', 'fullName primaryMobile')
        .populate('room', 'roomNumber')
        .populate('invoice', 'billingMonth')
        .sort({ paymentDate: -1 });

      let csv = 'Receipt No,Date,Tenant Name,Mobile,Room No,Billing Month,Amount Paid,Method,Transaction Ref\n';
      payments.forEach((p) => {
        csv += `"${p.receiptNumber}","${p.paymentDate.toISOString().slice(0, 10)}","${p.tenant?.fullName || ''}","${p.tenant?.primaryMobile || ''}","${p.room?.roomNumber || ''}","${p.invoice?.billingMonth || ''}","${p.amountPaid}","${p.paymentMethod}","${p.transactionReference || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="rent_payments_report.csv"');
      return res.send(csv);
    } else if (type === 'electricity') {
      const bills = await ElectricityBill.find()
        .populate('tenant', 'fullName')
        .populate('room', 'roomNumber')
        .sort({ billingMonth: -1 });

      let csv = 'Bill No,Month,Room No,Tenant Name,Units Consumed,Rate Per Unit,Bill Amount,Amount Paid,Remaining Balance,Status\n';
      bills.forEach((b) => {
        csv += `"${b.billNumber}","${b.billingMonth}","${b.room?.roomNumber || ''}","${b.tenant?.fullName || ''}","${b.unitsConsumed}","${b.ratePerUnit}","${b.billAmount}","${b.amountPaid}","${b.remainingBalance}","${b.status}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="electricity_bills_report.csv"');
      return res.send(csv);
    } else if (type === 'expenses') {
      const expenses = await Expense.find().populate('room', 'roomNumber').sort({ date: -1 });

      let csv = 'Date,Title,Category,Amount,Room No,Paid To,Payment Method,Description\n';
      expenses.forEach((e) => {
        csv += `"${e.date.toISOString().slice(0, 10)}","${e.title}","${e.category}","${e.amount}","${e.room?.roomNumber || 'Whole House'}","${e.paidTo || ''}","${e.paymentMethod}","${e.description || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="property_expenses_report.csv"');
      return res.send(csv);
    }

    res.status(400).json({ success: false, message: 'Invalid report type' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getReportsData,
  exportCSV,
};

