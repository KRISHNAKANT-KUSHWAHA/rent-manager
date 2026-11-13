const Expense = require('../models/Expense');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all property expenses
 * @route   GET /api/expenses
 * @access  Private (Owner)
 */
const getExpenses = async (req, res) => {
  try {
    const { category, roomId, startDate, endDate } = req.query;
    let query = {};

    if (category && category !== 'all') query.category = category;
    if (roomId && roomId !== 'all') query.room = roomId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('room', 'roomNumber floor floorName')
      .sort({ date: -1 });

    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      success: true,
      count: expenses.length,
      totalAmount,
      expenses,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Create new property expense
 * @route   POST /api/expenses
 * @access  Private (Owner)
 */
const createExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      date,
      description,
      roomId,
      paidTo,
      paymentMethod,
    } = req.body;

    if (!title || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Title and amount are required',
      });
    }

    let receiptUrl = '';
    if (req.file) {
      receiptUrl = `/api/documents/receipts/${req.file.filename}`;
    }

    const expense = await Expense.create({
      title: title.trim(),
      category: category || 'Maintenance',
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      description: description || '',
      room: roomId && roomId !== '' ? roomId : null,
      paidTo: paidTo || '',
      paymentMethod: paymentMethod || 'Cash',
      receiptUrl,
    });

    await logAudit(
      'CREATE_EXPENSE',
      'EXPENSE',
      { title: expense.title, amount: expense.amount, category: expense.category },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update expense
 * @route   PUT /api/expenses/:id
 * @access  Private (Owner)
 */
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const { title, category, amount, date, description, roomId, paidTo, paymentMethod } =
      req.body;

    if (title) expense.title = title.trim();
    if (category) expense.category = category;
    if (amount) expense.amount = Number(amount);
    if (date) expense.date = new Date(date);
    if (description !== undefined) expense.description = description;
    if (roomId !== undefined) expense.room = roomId || null;
    if (paidTo !== undefined) expense.paidTo = paidTo;
    if (paymentMethod) expense.paymentMethod = paymentMethod;

    if (req.file) {
      expense.receiptUrl = `/api/documents/receipts/${req.file.filename}`;
    }

    await expense.save();

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private (Owner)
 */
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await logAudit(
      'DELETE_EXPENSE',
      'EXPENSE',
      { title: expense.title, amount: expense.amount },
      req
    );

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};

