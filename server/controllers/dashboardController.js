const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const RentalAgreement = require('../models/RentalAgreement');
const RentInvoice = require('../models/RentInvoice');
const RentPayment = require('../models/RentPayment');
const ElectricityBill = require('../models/ElectricityBill');
const ElectricityPayment = require('../models/ElectricityPayment');
const Expense = require('../models/Expense');
const TenantDocument = require('../models/TenantDocument');

/**
 * @desc    Get complete real-time dashboard analytics
 * @route   GET /api/dashboard/stats
 * @access  Private (Owner)
 */
const getDashboardStats = async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    // 1. Rooms stats
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: 'Occupied' });
    const availableRooms = await Room.countDocuments({ status: 'Available' });
    const maintenanceRooms = await Room.countDocuments({ status: 'Maintenance' });

    // 2. Tenants stats
    const totalActiveTenants = await Tenant.countDocuments({ status: 'Active' });

    // 3. Expected Monthly Rent (sum of active agreements monthly rent)
    const activeAgreements = await RentalAgreement.find({ status: 'Active' });
    const expectedMonthlyRent = activeAgreements.reduce(
      (acc, agr) => acc + (agr.monthlyRent || 0),
      0
    );

    // 4. Rent Received This Month
    const currentMonthInvoices = await RentInvoice.find({ billingMonth: currentMonth });
    const rentReceivedThisMonth = currentMonthInvoices.reduce(
      (acc, inv) => acc + (inv.amountPaid || 0),
      0
    );

    // 5. Total Pending Rent (all unpaid balances across all active invoices)
    const allPendingInvoices = await RentInvoice.find({
      status: { $in: ['Pending', 'Partially Paid', 'Overdue'] },
    });
    const pendingRent = allPendingInvoices.reduce(
      (acc, inv) => acc + (inv.remainingBalance || 0),
      0
    );

    // 6. Pending Electricity Payments
    const allPendingElectricity = await ElectricityBill.find({
      status: { $in: ['Pending', 'Partially Paid', 'Overdue'] },
    });
    const pendingElectricity = allPendingElectricity.reduce(
      (acc, bill) => acc + (bill.remainingBalance || 0),
      0
    );

    // 7. Room occupancy overview list
    const roomsOverview = await Room.find()
      .populate('currentTenant', 'fullName primaryMobile maskedAadhaar photoUrl moveInDate')
      .populate('currentAgreement', 'monthlyRent rentDueDay endDate')
      .sort({ floor: 1, roomNumber: 1 });

    // 8. Recent rent payments (last 5)
    const recentRentPayments = await RentPayment.find()
      .populate('tenant', 'fullName primaryMobile photoUrl')
      .populate('room', 'roomNumber floor')
      .populate('invoice', 'billingMonth')
      .sort({ paymentDate: -1 })
      .limit(6);

    // 9. Upcoming rent dues & Overdue rent
    const upcomingDues = await RentInvoice.find({
      status: { $in: ['Pending', 'Partially Paid'] },
    })
      .populate('tenant', 'fullName primaryMobile photoUrl')
      .populate('room', 'roomNumber floor')
      .sort({ dueDate: 1 })
      .limit(6);

    const overdueRentInvoices = await RentInvoice.find({
      status: 'Overdue',
    })
      .populate('tenant', 'fullName primaryMobile')
      .populate('room', 'roomNumber')
      .sort({ dueDate: 1 });

    // 10. Electricity payment status summary
    const electricitySummary = {
      totalBillsThisMonth: await ElectricityBill.countDocuments({ billingMonth: currentMonth }),
      pendingAmount: pendingElectricity,
      pendingCount: allPendingElectricity.length,
    };

    // 11. Recent tenant registrations
    const recentTenants = await Tenant.find()
      .populate('currentRoom', 'roomNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    // 12. Monthly Income & Expense Chart data (last 6 months)
    const monthsData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toISOString().slice(0, 7);
      const mLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      // Start & end of month
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      // Rent collected in this month
      const rentPmts = await RentPayment.find({
        paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
      });
      const rentCollected = rentPmts.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

      // Electricity collected in this month
      const elecPmts = await ElectricityPayment.find({
        paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
      });
      const elecCollected = elecPmts.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

      // Expenses in this month
      const exps = await Expense.find({
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });
      const expenseAmount = exps.reduce((acc, e) => acc + (e.amount || 0), 0);

      const totalIncome = rentCollected + elecCollected;
      const netProfit = totalIncome - expenseAmount;

      monthsData.push({
        month: mStr,
        label: mLabel,
        rent: rentCollected,
        electricity: elecCollected,
        totalIncome,
        expenses: expenseAmount,
        netProfit,
      });
    }

    // 13. Smart Reminders & Notifications
    const reminders = [];

    // Check overdue rent
    if (overdueRentInvoices.length > 0) {
      reminders.push({
        id: 'overdue-rent',
        type: 'rent_overdue',
        severity: 'urgent',
        title: `${overdueRentInvoices.length} Overdue Rent Payments`,
        message: `Total overdue rent: Rs. ${overdueRentInvoices.reduce((a, b) => a + b.remainingBalance, 0).toLocaleString('en-IN')}`,
        link: '/rent',
      });
    }

    // Check pending electricity
    if (allPendingElectricity.length > 0) {
      reminders.push({
        id: 'pending-elec',
        type: 'electricity_pending',
        severity: 'high',
        title: `${allPendingElectricity.length} Pending Electricity Bills`,
        message: `Outstanding electricity: Rs. ${pendingElectricity.toLocaleString('en-IN')}`,
        link: '/electricity',
      });
    }

    // Check expiring agreements (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringAgreements = await RentalAgreement.find({
      status: 'Active',
      endDate: { $lte: thirtyDaysFromNow },
    }).populate('tenant', 'fullName');

    expiringAgreements.forEach((agr) => {
      reminders.push({
        id: `exp-${agr._id}`,
        type: 'agreement_expiry',
        severity: 'medium',
        title: `Agreement Expiring: ${agr.tenant?.fullName || 'Tenant'}`,
        message: `Rental agreement ${agr.agreementNumber} expires on ${new Date(agr.endDate).toLocaleDateString('en-IN')}`,
        link: '/agreements',
      });
    });

    // Check missing documents for active tenants
    const activeTenantsList = await Tenant.find({ status: 'Active' });
    for (const t of activeTenantsList) {
      const docCount = await TenantDocument.countDocuments({ tenant: t._id });
      if (docCount === 0) {
        reminders.push({
          id: `doc-${t._id}`,
          type: 'missing_doc',
          severity: 'low',
          title: `No Documents on Record: ${t.fullName}`,
          message: `Please upload identity documents (Aadhaar / Voter ID) for ${t.fullName}.`,
          link: `/tenants/${t._id}`,
        });
      }
    }

    res.json({
      success: true,
      currentMonth,
      summary: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        totalActiveTenants,
        expectedMonthlyRent,
        rentReceivedThisMonth,
        pendingRent,
        pendingElectricity,
      },
      roomsOverview,
      recentRentPayments,
      upcomingDues,
      overdueRentInvoices,
      electricitySummary,
      recentTenants,
      monthlyIncomeChart: monthsData,
      reminders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDashboardStats,
};

