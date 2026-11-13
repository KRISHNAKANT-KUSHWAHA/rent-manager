const AuditLog = require('../models/AuditLog');

const logAudit = async (action, category, details = {}, req = null) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    await AuditLog.create({
      action,
      category,
      details,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { logAudit };

