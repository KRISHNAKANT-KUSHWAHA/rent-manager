const mongoose = require('mongoose');

const rentalAgreementSchema = new mongoose.Schema(
  {
    agreementNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    monthlyRent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: 0,
    },
    securityDeposit: {
      type: Number,
      required: [true, 'Security deposit is required'],
      min: 0,
    },
    rentDueDay: {
      type: Number,
      default: 5,
      min: 1,
      max: 31,
    },
    electricityBillingType: {
      type: String,
      enum: ['submeter', 'fixed', 'per_unit', 'shared'],
      default: 'submeter',
    },
    ratePerUnit: {
      type: Number,
      default: 9.5,
    },
    fixedElectricityAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Terminated', 'Renewed'],
      default: 'Active',
    },
    agreementDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TenantDocument',
      default: null,
    },
    renewalHistory: [
      {
        previousAgreementId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalAgreement' },
        renewedAt: { type: Date, default: Date.now },
        oldEndDate: Date,
        newEndDate: Date,
        oldRent: Number,
        newRent: Number,
        notes: String,
      },
    ],
    vacatingDate: {
      type: Date,
      default: null,
    },
    securityDepositRefund: {
      status: {
        type: String,
        enum: ['Pending', 'Partially Refunded', 'Refunded', 'Forfeited', 'Not Applicable'],
        default: 'Not Applicable',
      },
      refundAmount: { type: Number, default: 0 },
      deductionAmount: { type: Number, default: 0 },
      deductionReason: { type: String, default: '' },
      refundDate: { type: Date, default: null },
      paymentMethod: { type: String, default: 'UPI' },
      transactionRef: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    terms: {
      type: [String],
      default: [
        'Rent must be paid on or before the due date each month.',
        'Electricity charges are payable separately as per the monthly sub-meter reading.',
        'Notice period for vacating the room is 30 days in advance.',
        'Damage to property or fittings will be deducted from the security deposit.',
        'Subletting of the rented room is strictly prohibited.',
      ],
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

rentalAgreementSchema.index({ tenant: 1 });
rentalAgreementSchema.index({ room: 1 });
rentalAgreementSchema.index({ status: 1 });
rentalAgreementSchema.index({ endDate: 1 });

module.exports = mongoose.model('RentalAgreement', rentalAgreementSchema);
