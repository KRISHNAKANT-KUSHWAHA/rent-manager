const fs = require('fs');
const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const RentalAgreement = require('../models/RentalAgreement');
const RentInvoice = require('../models/RentInvoice');
const RentPayment = require('../models/RentPayment');
const TenantDocument = require('../models/TenantDocument');
const { logAudit } = require('../services/auditService');
const { uploadToImageKit } = require('../services/imagekitService');

/**
 * @desc    Get all tenants with search & filter
 * @route   GET /api/tenants
 * @access  Private (Owner)
 */
const getAllTenants = async (req, res) => {
  try {
    const { status, search, roomId } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (roomId && roomId !== 'all') {
      query.currentRoom = roomId;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { primaryMobile: { $regex: search, $options: 'i' } },
        { permanentAddress: { $regex: search, $options: 'i' } },
        { occupation: { $regex: search, $options: 'i' } },
      ];
    }

    const tenants = await Tenant.find(query)
      .populate('currentRoom', 'roomNumber floor floorName monthlyRent securityDeposit')
      .sort({ createdAt: -1 });

    const tenantIds = tenants.map((t) => t._id);
    const agreements = await RentalAgreement.find({
      tenant: { $in: tenantIds },
      status: 'Active',
    });

    const agreementMap = {};
    agreements.forEach((agr) => {
      agreementMap[agr.tenant.toString()] = agr;
    });

    const formattedTenants = tenants.map((t) => {
      const agr = agreementMap[t._id.toString()];
      const tObj = t.toObject();
      tObj.monthlyRent = agr ? agr.monthlyRent : (t.currentRoom?.monthlyRent || '');
      tObj.securityDeposit = agr ? agr.securityDeposit : (t.currentRoom?.securityDeposit ?? 0);
      tObj.rentDueDay = agr ? agr.rentDueDay : 5;
      return tObj;
    });

    res.json({
      success: true,
      count: formattedTenants.length,
      tenants: formattedTenants,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get single tenant profile with agreements & documents
 * @route   GET /api/tenants/:id
 * @access  Private (Owner)
 */
const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('currentRoom');
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Fetch active agreement
    const activeAgreement = await RentalAgreement.findOne({
      tenant: tenant._id,
      status: 'Active',
    }).populate('room');

    // Fetch all agreements history
    const allAgreements = await RentalAgreement.find({ tenant: tenant._id })
      .populate('room', 'roomNumber floor floorName')
      .sort({ createdAt: -1 });

    // Fetch uploaded documents
    const documents = await TenantDocument.find({ tenant: tenant._id }).sort({
      createdAt: -1,
    });

    // Fetch payment balance overview
    const invoices = await RentInvoice.find({ tenant: tenant._id });
    const totalRentBilled = invoices.reduce((acc, inv) => acc + (inv.rentAmount || 0), 0);
    const totalRentPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
    const totalOutstanding = invoices.reduce(
      (acc, inv) => acc + (inv.remainingBalance || 0),
      0
    );

    res.json({
      success: true,
      tenant,
      activeAgreement,
      allAgreements,
      documents,
      financialSummary: {
        totalRentBilled,
        totalRentPaid,
        totalOutstanding,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Create new tenant
 * @route   POST /api/tenants
 * @access  Private (Owner)
 */
const createTenant = async (req, res) => {
  try {
    const {
      fullName,
      fatherName,
      husbandName,
      dob,
      gender,
      occupation,
      employerOrCollege,
      permanentAddress,
      currentAddress,
      primaryMobile,
      alternateMobile,
      email,
      familyMembers,
      emergencyContactName,
      emergencyContactNumber,
      emergencyContactRelation,
      aadhaarNumber,
      voterId,
      panNumber,
      otherIdType,
      otherIdNumber,
      assignedRoomId,
      moveInDate,
      agreementStartDate,
      agreementEndDate,
      monthlyRent,
      securityDeposit,
      rentDueDay,
      notes,
    } = req.body;

    if (!fullName || !fatherName || !permanentAddress || !primaryMobile) {
      return res.status(400).json({
        success: false,
        message: 'Name, Father Name, Permanent Address, and Primary Mobile are required',
      });
    }

    let room = null;
    if (assignedRoomId) {
      room = await Room.findById(assignedRoomId);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Assigned room not found' });
      }
      if (room.status === 'Occupied') {
        return res.status(400).json({
          success: false,
          message: `Room ${room.roomNumber} is already occupied. Multiple active tenants are not allowed.`,
        });
      }
    }

    const tenant = await Tenant.create({
      fullName,
      fatherName,
      husbandName: husbandName || '',
      dob: dob ? new Date(dob) : null,
      gender: gender || 'Male',
      occupation: occupation || '',
      employerOrCollege: employerOrCollege || '',
      permanentAddress,
      currentAddress: currentAddress || '',
      primaryMobile,
      alternateMobile: alternateMobile || '',
      email: email || '',
      familyMembers: Array.isArray(familyMembers) ? familyMembers : [],
      emergencyContactName: emergencyContactName || '',
      emergencyContactNumber: emergencyContactNumber || '',
      emergencyContactRelation: emergencyContactRelation || '',
      aadhaarNumber: aadhaarNumber || '',
      voterId: voterId || '',
      panNumber: panNumber || '',
      otherIdType: otherIdType || '',
      otherIdNumber: otherIdNumber || '',
      currentRoom: room ? room._id : null,
      status: 'Active',
      moveInDate: moveInDate ? new Date(moveInDate) : new Date(),
      notes: notes || '',
    });

    // If assigned room is provided, create active rental agreement
    if (room) {
      const start = agreementStartDate ? new Date(agreementStartDate) : new Date();
      const end = agreementEndDate
        ? new Date(agreementEndDate)
        : new Date(new Date(start).setFullYear(start.getFullYear() + 1));

      const agreedRent = Number(monthlyRent) || room.monthlyRent;
      const agreedDeposit = securityDeposit !== undefined && securityDeposit !== '' ? Number(securityDeposit) : (room.securityDeposit || 0);
      const agrNum = `AGR-${room.roomNumber}-${Date.now().toString().slice(-4)}`;

      const agreement = await RentalAgreement.create({
        agreementNumber: agrNum,
        tenant: tenant._id,
        room: room._id,
        startDate: start,
        endDate: end,
        monthlyRent: agreedRent,
        securityDeposit: agreedDeposit,
        rentDueDay: Number(rentDueDay) || 5,
        status: 'Active',
      });

      // Update room status
      room.status = 'Occupied';
      room.currentTenant = tenant._id;
      room.currentAgreement = agreement._id;
      await room.save();
    }

    await logAudit('CREATE_TENANT', 'TENANT', { tenantName: tenant.fullName }, req);

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      tenant,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update tenant profile
 * @route   PUT /api/tenants/:id
 * @access  Private (Owner)
 */
const updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const {
      assignedRoomId,
      monthlyRent,
      securityDeposit,
      rentDueDay,
      ...otherUpdates
    } = req.body;

    const currentRoomIdStr = tenant.currentRoom ? tenant.currentRoom.toString() : '';
    const newRoomIdStr = (assignedRoomId !== undefined && assignedRoomId !== null) ? assignedRoomId.toString().trim() : currentRoomIdStr;

    // Handle room assignment or transfer if assignedRoomId is provided in request
    if (assignedRoomId !== undefined && newRoomIdStr !== currentRoomIdStr) {
      // 1. If currently assigned to an old room, free it up
      if (currentRoomIdStr) {
        await Room.findByIdAndUpdate(tenant.currentRoom, {
          status: 'Available',
          currentTenant: null,
          currentAgreement: null,
        });

        // Terminate existing active agreement
        await RentalAgreement.updateMany(
          { tenant: tenant._id, status: 'Active' },
          {
            status: 'Terminated',
            vacatingDate: new Date(),
            notes: 'Room changed via tenant edit profile',
          }
        );
      }

      // 2. If assigning to a new room
      if (newRoomIdStr) {
        const newRoom = await Room.findById(newRoomIdStr);
        if (!newRoom) {
          return res.status(404).json({ success: false, message: 'Selected room not found' });
        }

        if (newRoom.status === 'Occupied' && newRoom.currentTenant && newRoom.currentTenant.toString() !== tenant._id.toString()) {
          return res.status(400).json({
            success: false,
            message: `Room ${newRoom.roomNumber} is already occupied by another tenant.`,
          });
        }

        const agreedRent = (monthlyRent !== undefined && monthlyRent !== '') ? Number(monthlyRent) : newRoom.monthlyRent;
        const agreedDeposit = (securityDeposit !== undefined && securityDeposit !== '') ? Number(securityDeposit) : (newRoom.securityDeposit || 0);
        const agrNum = `AGR-${newRoom.roomNumber}-${Date.now().toString().slice(-4)}`;
        const start = tenant.moveInDate || new Date();
        const end = new Date(new Date(start).setFullYear(start.getFullYear() + 1));

        const agreement = await RentalAgreement.create({
          agreementNumber: agrNum,
          tenant: tenant._id,
          room: newRoom._id,
          startDate: start,
          endDate: end,
          monthlyRent: agreedRent,
          securityDeposit: agreedDeposit,
          rentDueDay: Number(rentDueDay) || 5,
          status: 'Active',
        });

        newRoom.status = 'Occupied';
        newRoom.currentTenant = tenant._id;
        newRoom.currentAgreement = agreement._id;
        await newRoom.save();

        tenant.currentRoom = newRoom._id;
        tenant.status = 'Active';
      } else {
        // Room unassigned / removed
        tenant.currentRoom = null;
      }
    } else {
      // Room remained unchanged. Update agreement rent/deposit/due day if specified
      if (currentRoomIdStr && (monthlyRent !== undefined || securityDeposit !== undefined || rentDueDay !== undefined)) {
        const activeAgreement = await RentalAgreement.findOne({
          tenant: tenant._id,
          status: 'Active',
        });
        if (activeAgreement) {
          if (monthlyRent !== undefined && monthlyRent !== '') activeAgreement.monthlyRent = Number(monthlyRent);
          if (securityDeposit !== undefined && securityDeposit !== '') activeAgreement.securityDeposit = Number(securityDeposit);
          if (rentDueDay !== undefined && rentDueDay !== '') activeAgreement.rentDueDay = Number(rentDueDay);
          await activeAgreement.save();
        }
      }
    }

    delete otherUpdates.currentRoom;
    Object.assign(tenant, otherUpdates);
    await tenant.save();

    await logAudit('UPDATE_TENANT', 'TENANT', { tenantName: tenant.fullName }, req);

    const updatedTenant = await Tenant.findById(tenant._id)
      .populate('currentRoom', 'roomNumber floor floorName monthlyRent securityDeposit');

    res.json({
      success: true,
      message: 'Tenant and room details updated successfully',
      tenant: updatedTenant,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Vacate tenant from current room (Preserves all historical financial records)
 * @route   POST /api/tenants/:id/vacate
 * @access  Private (Owner)
 */
const vacateTenant = async (req, res) => {
  try {
    const { vacatingDate, notes, depositRefundStatus, refundAmount, deductionAmount, deductionReason } =
      req.body;

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const vacateTime = vacatingDate ? new Date(vacatingDate) : new Date();

    // End active agreement if any
    const agreement = await RentalAgreement.findOne({
      tenant: tenant._id,
      status: 'Active',
    });

    if (agreement) {
      agreement.status = 'Terminated';
      agreement.vacatingDate = vacateTime;
      agreement.notes = notes ? `${agreement.notes} | Vacated: ${notes}` : agreement.notes;

      if (depositRefundStatus) {
        agreement.securityDepositRefund = {
          status: depositRefundStatus,
          refundAmount: Number(refundAmount) || 0,
          deductionAmount: Number(deductionAmount) || 0,
          deductionReason: deductionReason || '',
          refundDate: vacateTime,
          notes: notes || '',
        };
      }
      await agreement.save();
    }

    // Release Room
    if (tenant.currentRoom) {
      await Room.findByIdAndUpdate(tenant.currentRoom, {
        status: 'Available',
        currentTenant: null,
        currentAgreement: null,
      });
    }

    tenant.status = 'Vacated';
    tenant.vacatedDate = vacateTime;
    tenant.currentRoom = null;
    if (notes) tenant.notes = `${tenant.notes} | Vacated on ${vacateTime.toDateString()}: ${notes}`;
    await tenant.save();

    await logAudit('VACATE_TENANT', 'TENANT', { tenantName: tenant.fullName }, req);

    res.json({
      success: true,
      message: `Tenant ${tenant.fullName} has vacated. Room is now Available. Historical records preserved.`,
      tenant,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Upload tenant photograph
 * @route   POST /api/tenants/:id/photo
 * @access  Private (Owner)
 */
const uploadTenantPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a photo to upload' });
    }

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    let photoUrl = `/api/documents/photos/${req.file.filename}`;

    // Upload to ImageKit if configured
    try {
      if (fs.existsSync(req.file.path)) {
        const fileBuffer = fs.readFileSync(req.file.path);
        const cloud = await uploadToImageKit(fileBuffer, req.file.originalname, '/photos');
        if (cloud && cloud.url) {
          photoUrl = cloud.url;
        }
      }
    } catch (cloudErr) {
      console.warn('[ImageKit Photo Upload - Using local storage]', cloudErr.message);
    }

    tenant.photoUrl = photoUrl;
    await tenant.save();

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Delete tenant (Strict check: never delete if financial records exist)
 * @route   DELETE /api/tenants/:id
 * @access  Private (Owner)
 */
const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (tenant.status === 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active tenant. Please vacate the tenant first.',
      });
    }

    // Check financial history
    const invoiceCount = await RentInvoice.countDocuments({ tenant: tenant._id });
    const paymentCount = await RentPayment.countDocuments({ tenant: tenant._id });

    if (invoiceCount > 0 || paymentCount > 0) {
      // Mark as Inactive instead of deleting
      tenant.status = 'Inactive';
      await tenant.save();
      return res.json({
        success: true,
        message:
          'Tenant has financial history and cannot be permanently erased. Marked as "Inactive" to preserve accounting records.',
      });
    }

    await Tenant.findByIdAndDelete(req.params.id);
    await logAudit('DELETE_TENANT', 'TENANT', { tenantName: tenant.fullName }, req);

    res.json({
      success: true,
      message: 'Tenant record removed',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  vacateTenant,
  uploadTenantPhoto,
  deleteTenant,
};

