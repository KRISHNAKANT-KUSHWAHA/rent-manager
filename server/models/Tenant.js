const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    age: { type: Number },
    phone: { type: String, trim: true },
    occupation: { type: String, trim: true },
  },
  { _id: true }
);

const tenantSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    husbandName: {
      type: String,
      trim: true,
      default: '',
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    occupation: {
      type: String,
      trim: true,
      default: '',
    },
    employerOrCollege: {
      type: String,
      trim: true,
      default: '',
    },
    permanentAddress: {
      type: String,
      required: [true, 'Permanent address is required'],
      trim: true,
    },
    currentAddress: {
      type: String,
      trim: true,
      default: '',
    },
    primaryMobile: {
      type: String,
      required: [true, 'Primary mobile number is required'],
      trim: true,
    },
    alternateMobile: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    photoUrl: {
      type: String,
      default: '',
    },

    // Family Details
    familyMembers: [familyMemberSchema],
    emergencyContactName: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true,
    },
    emergencyContactNumber: {
      type: String,
      required: [true, 'Emergency contact number is required'],
      trim: true,
    },
    emergencyContactRelation: {
      type: String,
      trim: true,
      default: 'Parent/Relative',
    },

    // Identity Details (Masked & Protected)
    aadhaarNumber: {
      type: String,
      trim: true,
      default: '',
    },
    maskedAadhaar: {
      type: String,
      trim: true,
      default: '',
    },
    voterId: {
      type: String,
      trim: true,
      default: '',
    },
    panNumber: {
      type: String,
      trim: true,
      default: '',
    },
    otherIdType: {
      type: String,
      trim: true,
      default: '',
    },
    otherIdNumber: {
      type: String,
      trim: true,
      default: '',
    },

    // Rental Details
    currentRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Vacated', 'Inactive'],
      default: 'Active',
    },
    moveInDate: {
      type: Date,
      default: Date.now,
    },
    vacatedDate: {
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

// Pre-save helper to auto-generate masked Aadhaar
tenantSchema.pre('save', function (next) {
  if (this.aadhaarNumber && this.aadhaarNumber.length >= 4) {
    const clean = this.aadhaarNumber.replace(/\D/g, '');
    if (clean.length >= 4) {
      const last4 = clean.slice(-4);
      this.maskedAadhaar = `XXXX-XXXX-${last4}`;
    }
  }
  next();
});

tenantSchema.index({ fullName: 'text', primaryMobile: 'text', permanentAddress: 'text' });
tenantSchema.index({ status: 1 });
tenantSchema.index({ currentRoom: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);

