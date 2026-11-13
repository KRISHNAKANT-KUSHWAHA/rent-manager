const mongoose = require('mongoose');

const rentInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    agreement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalAgreement',
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    billingMonth: {
      type: String, // 'YYYY-MM' format, e.g., '2026-11'
      required: [true, 'Billing month is required'],
      trim: true,
    },
    rentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    previousBalance: {
      type: Number,
      default: 0,
    },
    lateFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalDue: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    remainingBalance: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue'],
      default: 'Pending',
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique invoice per agreement and billing month to avoid duplicates
rentInvoiceSchema.index({ agreement: 1, billingMonth: 1 }, { unique: true });
rentInvoiceSchema.index({ tenant: 1, billingMonth: 1 });
rentInvoiceSchema.index({ room: 1, billingMonth: 1 });
rentInvoiceSchema.index({ status: 1 });
rentInvoiceSchema.index({ billingMonth: 1 });

module.exports = mongoose.model('RentInvoice', rentInvoiceSchema);

