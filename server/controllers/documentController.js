const path = require('path');
const fs = require('fs');
const TenantDocument = require('../models/TenantDocument');
const Tenant = require('../models/Tenant');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Upload document for a tenant
 * @route   POST /api/documents/upload
 * @access  Private (Owner)
 */
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { tenantId, documentType, title, documentNumber, notes } = req.body;

    if (!tenantId || !documentType || !title) {
      // Remove temporary uploaded file if validation fails
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Tenant ID, document type, and title are required',
      });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const doc = await TenantDocument.create({
      tenant: tenantId,
      documentType,
      title: title.trim(),
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentNumber: documentNumber ? documentNumber.trim() : '',
      notes: notes || '',
    });

    await logAudit(
      'UPLOAD_DOCUMENT',
      'DOCUMENT',
      { documentType, title, tenantName: tenant.fullName },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Document uploaded securely',
      document: doc,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all documents for a tenant or house
 * @route   GET /api/documents
 * @access  Private (Owner)
 */
const getDocuments = async (req, res) => {
  try {
    const { tenantId, documentType, search } = req.query;
    let query = {};

    if (tenantId && tenantId !== 'all') {
      query.tenant = tenantId;
    }

    if (documentType && documentType !== 'all') {
      query.documentType = documentType;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { documentNumber: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
      ];
    }

    const documents = await TenantDocument.find(query)
      .populate('tenant', 'fullName primaryMobile currentRoom status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    View / Stream Private Document (Secured for Owner only)
 * @route   GET /api/documents/:id/view
 * @access  Private (Owner)
 */
const viewDocument = async (req, res) => {
  try {
    const doc = await TenantDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const filePath = path.resolve(doc.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Download Private Document
 * @route   GET /api/documents/:id/download
 * @access  Private (Owner)
 */
const downloadDocument = async (req, res) => {
  try {
    const doc = await TenantDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const filePath = path.resolve(doc.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }

    res.download(filePath, doc.originalName);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Delete Document
 * @route   DELETE /api/documents/:id
 * @access  Private (Owner)
 */
const deleteDocument = async (req, res) => {
  try {
    const doc = await TenantDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const filePath = path.resolve(doc.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await TenantDocument.findByIdAndDelete(req.params.id);
    await logAudit('DELETE_DOCUMENT', 'DOCUMENT', { title: doc.title }, req);

    res.json({
      success: true,
      message: 'Document removed successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Serve tenant photos securely
 * @route   GET /api/documents/photos/:filename
 * @access  Private (Owner)
 */
const streamPhoto = (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', 'photos', req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ success: false, message: 'Photo not found' });
};

module.exports = {
  uploadDocument,
  getDocuments,
  viewDocument,
  downloadDocument,
  deleteDocument,
  streamPhoto,
};

