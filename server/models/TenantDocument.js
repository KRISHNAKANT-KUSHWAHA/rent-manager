const mongoose = require('mongoose');

const tenantDocumentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant reference is required'],
    },
    documentType: {
      type: String,
      enum: [
        'aadhaar',
        'voter_id',
        'pan',
        'photo',
        'address_proof',
        'agreement',
        'police_verification',
        'other',
      ],
      required: [true, 'Document type is required'],
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    documentNumber: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

tenantDocumentSchema.index({ tenant: 1, documentType: 1 });

module.exports = mongoose.model('TenantDocument', tenantDocumentSchema);

