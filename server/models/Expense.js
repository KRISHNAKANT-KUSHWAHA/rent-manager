const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Plumbing',
        'Electrical',
        'Painting',
        'Cleaning',
        'Maintenance',
        'Taxes',
        'Pest Control',
        'Security',
        'Renovation',
        'Other',
      ],
      default: 'Maintenance',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Expense amount must be positive'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null, // null means whole house / common expense
    },
    paidTo: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'],
      default: 'Cash',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ room: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

