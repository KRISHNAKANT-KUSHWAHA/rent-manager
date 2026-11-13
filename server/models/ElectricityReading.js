const mongoose = require('mongoose');

const electricityReadingSchema = new mongoose.Schema(
  {
    meterNumber: {
      type: String,
      required: true,
      trim: true,
    },
    meter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ElectricityMeter',
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
    },
    billingMonth: {
      type: String, // 'YYYY-MM'
      required: true,
      trim: true,
    },
    previousReading: {
      type: Number,
      required: true,
      min: 0,
    },
    currentReading: {
      type: Number,
      required: true,
      validate: {
        validator: function (val) {
          return val >= this.previousReading;
        },
        message: 'Current reading must be greater than or equal to previous reading',
      },
    },
    unitsConsumed: {
      type: Number,
      required: true,
      min: 0,
    },
    ratePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    calculatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    readingDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    photoUrl: {
      type: String,
      default: '',
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

// Prevent duplicate readings for the same room/meter and month
electricityReadingSchema.index({ room: 1, billingMonth: 1 }, { unique: true });
electricityReadingSchema.index({ meterNumber: 1, billingMonth: 1 });
electricityReadingSchema.index({ billingMonth: 1 });

module.exports = mongoose.model('ElectricityReading', electricityReadingSchema);

