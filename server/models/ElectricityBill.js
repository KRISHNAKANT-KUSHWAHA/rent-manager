const mongoose = require('mongoose');

const electricityBillSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reading: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ElectricityReading',
      default: null,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    billingMonth: {
      type: String, // 'YYYY-MM'
      required: true,
      trim: true,
    },
    meterNumber: {
      type: String,
      trim: true,
      default: '',
    },
    billingType: {
      type: String,
      enum: ['submeter', 'fixed', 'per_unit', 'shared'],
      default: 'submeter',
    },
    previousReading: {
      type: Number,
      default: 0,
    },
    currentReading: {
      type: Number,
      default: 0,
    },
    unitsConsumed: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratePerUnit: {
      type: Number,
      default: 9.5,
      min: 0,
    },
    billAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    previousBalance: {
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

electricityBillSchema.index({ room: 1, billingMonth: 1 }, { unique: true });
electricityBillSchema.index({ tenant: 1, billingMonth: 1 });
electricityBillSchema.index({ status: 1 });
electricityBillSchema.index({ billingMonth: 1 });

module.exports = mongoose.model('ElectricityBill', electricityBillSchema);

