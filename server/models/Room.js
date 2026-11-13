const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number or name is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      default: 1,
    },
    floorName: {
      type: String,
      trim: true,
      default: function () {
        if (this.floor === 0) return 'Ground Floor';
        if (this.floor === 1) return '1st Floor';
        if (this.floor === 2) return '2nd Floor';
        return `${this.floor}th Floor`;
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    monthlyRent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: [0, 'Rent cannot be negative'],
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
    },
    electricityMeterNumber: {
      type: String,
      trim: true,
      default: '',
    },
    electricityBillingType: {
      type: String,
      enum: ['submeter', 'fixed', 'per_unit', 'shared'],
      default: 'submeter',
    },
    fixedElectricityAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance'],
      default: 'Available',
    },
    currentTenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
    },
    currentAgreement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalAgreement',
      default: null,
    },
    amenities: {
      type: [String],
      default: ['Attached Bathroom', 'Ceiling Fan', 'LED Lights', 'Balcony'],
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

roomSchema.index({ status: 1 });

module.exports = mongoose.model('Room', roomSchema);
