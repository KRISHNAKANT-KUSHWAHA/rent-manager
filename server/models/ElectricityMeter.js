const mongoose = require('mongoose');

const electricityMeterSchema = new mongoose.Schema(
  {
    meterNumber: {
      type: String,
      required: [true, 'Meter number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    meterType: {
      type: String,
      enum: ['submeter', 'main', 'shared'],
      default: 'submeter',
    },
    initialReading: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currentReading: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratePerUnit: {
      type: Number,
      required: true,
      default: 9.5,
      min: 0,
    },
    installationDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
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

electricityMeterSchema.index({ room: 1 });

module.exports = mongoose.model('ElectricityMeter', electricityMeterSchema);
