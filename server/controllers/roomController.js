const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const RentalAgreement = require('../models/RentalAgreement');
const ElectricityMeter = require('../models/ElectricityMeter');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all rooms with populated tenant & agreement
 * @route   GET /api/rooms
 * @access  Private (Owner)
 */
const getAllRooms = async (req, res) => {
  try {
    const { status, floor, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (floor !== undefined && floor !== '' && floor !== 'all') {
      query.floor = Number(floor);
    }

    if (search) {
      query.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { electricityMeterNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const rooms = await Room.find(query)
      .populate('currentTenant', 'fullName primaryMobile maskedAadhaar photoUrl moveInDate')
      .populate('currentAgreement', 'agreementNumber startDate endDate monthlyRent securityDeposit')
      .sort({ floor: 1, roomNumber: 1 });

    res.json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get single room by ID with detailed history
 * @route   GET /api/rooms/:id
 * @access  Private (Owner)
 */
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('currentTenant')
      .populate('currentAgreement');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Fetch previous tenant agreements for this room
    const pastAgreements = await RentalAgreement.find({
      room: room._id,
      status: { $ne: 'Active' },
    })
      .populate('tenant', 'fullName primaryMobile moveInDate vacatedDate')
      .sort({ endDate: -1 });

    // Fetch meter info if exists
    const meter = await ElectricityMeter.findOne({ room: room._id });

    res.json({
      success: true,
      room,
      pastAgreements,
      meter,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Create new room
 * @route   POST /api/rooms
 * @access  Private (Owner)
 */
const createRoom = async (req, res) => {
  try {
    const {
      roomNumber,
      floor,
      description,
      monthlyRent,
      securityDeposit,
      electricityMeterNumber,
      electricityBillingType,
      fixedElectricityAmount,
      amenities,
      notes,
    } = req.body;

    const existing = await Room.findOne({ roomNumber: roomNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Room "${roomNumber}" already exists in the house`,
      });
    }

    const room = await Room.create({
      roomNumber: roomNumber.toUpperCase().trim(),
      floor: Number(floor) || 0,
      description: description || '',
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit) || 0,
      electricityMeterNumber: electricityMeterNumber || '',
      electricityBillingType: electricityBillingType || 'submeter',
      fixedElectricityAmount: Number(fixedElectricityAmount) || 0,
      amenities: Array.isArray(amenities) ? amenities : ['Ceiling Fan', 'Attached Bath'],
      notes: notes || '',
      status: 'Available',
    });

    // Auto-create meter record if meter number provided
    if (electricityMeterNumber) {
      await ElectricityMeter.create({
        meterNumber: electricityMeterNumber.toUpperCase().trim(),
        room: room._id,
        initialReading: 0,
        currentReading: 0,
        ratePerUnit: 9.5,
      });
    }

    await logAudit('CREATE_ROOM', 'ROOM', { roomNumber: room.roomNumber }, req);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update room details
 * @route   PUT /api/rooms/:id
 * @access  Private (Owner)
 */
const updateRoom = async (req, res) => {
  try {
    const {
      roomNumber,
      floor,
      description,
      monthlyRent,
      securityDeposit,
      electricityMeterNumber,
      electricityBillingType,
      fixedElectricityAmount,
      status,
      amenities,
      notes,
    } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (roomNumber) room.roomNumber = roomNumber.toUpperCase().trim();
    if (floor !== undefined) room.floor = Number(floor);
    if (description !== undefined) room.description = description;
    if (monthlyRent !== undefined) room.monthlyRent = Number(monthlyRent);
    if (securityDeposit !== undefined) room.securityDeposit = Number(securityDeposit);
    if (electricityMeterNumber !== undefined)
      room.electricityMeterNumber = electricityMeterNumber;
    if (electricityBillingType !== undefined)
      room.electricityBillingType = electricityBillingType;
    if (fixedElectricityAmount !== undefined)
      room.fixedElectricityAmount = Number(fixedElectricityAmount);
    if (status) room.status = status;
    if (amenities) room.amenities = amenities;
    if (notes !== undefined) room.notes = notes;

    await room.save();

    await logAudit('UPDATE_ROOM', 'ROOM', { roomNumber: room.roomNumber }, req);

    res.json({
      success: true,
      message: 'Room updated successfully',
      room,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Delete room (only if not occupied)
 * @route   DELETE /api/rooms/:id
 * @access  Private (Owner)
 */
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.status === 'Occupied' || room.currentTenant) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied room. Please vacate the tenant first.',
      });
    }

    // Check if historical agreements exist
    const agreementCount = await RentalAgreement.countDocuments({ room: room._id });
    if (agreementCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete room with historical rental agreements. Mark as "Maintenance" instead to preserve financial records.',
      });
    }

    await Room.findByIdAndDelete(req.params.id);
    await ElectricityMeter.deleteOne({ room: room._id });

    await logAudit('DELETE_ROOM', 'ROOM', { roomNumber: room.roomNumber }, req);

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};

