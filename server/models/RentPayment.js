const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentInvoice',
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
    agreement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalAgreement',
      required: true,
    },
    amountPaid: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be greater than 0'],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'],
      default: 'UPI',
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    isAdvance: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

rentPaymentSchema.index({ invoice: 1 });
rentPaymentSchema.index({ tenant: 1 });
rentPaymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('RentPayment', rentPaymentSchema);
