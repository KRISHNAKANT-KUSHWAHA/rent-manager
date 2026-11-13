const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['AUTH', 'ROOM', 'TENANT', 'AGREEMENT', 'DOCUMENT', 'RENT', 'ELECTRICITY', 'EXPENSE', 'SYSTEM'],
      default: 'SYSTEM',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ category: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

