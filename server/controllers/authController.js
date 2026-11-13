const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const TenantDocument = require('../models/TenantDocument');
const RentalAgreement = require('../models/RentalAgreement');
const RentInvoice = require('../models/RentInvoice');
const RentPayment = require('../models/RentPayment');
const ElectricityMeter = require('../models/ElectricityMeter');
const ElectricityReading = require('../models/ElectricityReading');
const ElectricityBill = require('../models/ElectricityBill');
const ElectricityPayment = require('../models/ElectricityPayment');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const { logAudit } = require('../services/auditService');

// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'rent_manager_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// Set HTTP-only cookie
const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * @desc    Check if initial owner setup is required
 * @route   GET /api/auth/status
 * @access  Public
 */
const getAuthStatus = async (req, res) => {
  try {
    const owner = await User.findOne();
    if (!owner) {
      return res.json({
        success: true,
        isSetup: false,
        message: 'First-time setup required. No owner registered yet.',
      });
    }

    res.json({
      success: true,
      isSetup: true,
      houseName: owner.houseName || 'Shanti Niwas',
      houseAddress: owner.houseAddress || '',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Owner Login
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    await logAudit('OWNER_LOGIN', 'AUTH', { email: user.email }, req);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        houseName: user.houseName,
        houseAddress: user.houseAddress,
        defaultElectricityRate: user.defaultElectricityRate,
        upiId: user.upiId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get Current Authenticated Owner
 * @route   GET /api/auth/me
 * @access  Private (Owner)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Change Owner Password
 * @route   PUT /api/auth/change-password
 * @access  Private (Owner)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit('CHANGE_PASSWORD', 'AUTH', { email: user.email }, req);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update Owner Profile & House Info
 * @route   PUT /api/auth/profile
 * @access  Private (Owner)
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, houseName, houseAddress, defaultElectricityRate, upiId, bankDetails } =
      req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (houseName) user.houseName = houseName;
    if (houseAddress) user.houseAddress = houseAddress;
    if (defaultElectricityRate !== undefined)
      user.defaultElectricityRate = Number(defaultElectricityRate);
    if (upiId) user.upiId = upiId;
    if (bankDetails) user.bankDetails = bankDetails;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Owner Logout
 * @route   POST /api/auth/logout
 * @access  Private (Owner)
 */
const logoutOwner = (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };

  res.clearCookie('token', cookieOptions);
  res.cookie('token', '', {
    ...cookieOptions,
    expires: new Date(0),
    maxAge: 0,
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Initial Owner & Real House Setup
 * @route   POST /api/auth/setup
 * @access  Public (Only if no owners registered yet)
 */
const setupOwner = async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Owner already configured. Public registration is prohibited.',
      });
    }

    const {
      name,
      email,
      password,
      phone,
      houseName,
      houseAddress,
      defaultElectricityRate,
      upiId,
      initialRooms,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Owner name, email, and password are required',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      houseName: houseName || 'Residential Rental Property',
      houseAddress: houseAddress || '',
      defaultElectricityRate: Number(defaultElectricityRate) || 9.5,
      upiId: upiId || '',
      role: 'owner',
    });

    // Optionally create initial real rooms if provided in the setup wizard
    if (Array.isArray(initialRooms) && initialRooms.length > 0) {
      for (const r of initialRooms) {
        if (r.roomNumber) {
          const roomNum = r.roomNumber.toUpperCase().trim();
          const newRoom = await Room.create({
            roomNumber: roomNum,
            floor: Number(r.floor) || 0,
            monthlyRent: Number(r.monthlyRent) || 0,
            securityDeposit: Number(r.securityDeposit) || 0,
            electricityMeterNumber: r.electricityMeterNumber || `MTR-${roomNum}`,
            electricityBillingType: 'submeter',
            status: 'Available',
          });

          if (newRoom.electricityMeterNumber) {
            await ElectricityMeter.create({
              meterNumber: newRoom.electricityMeterNumber,
              room: newRoom._id,
              initialReading: 0,
              currentReading: 0,
              ratePerUnit: user.defaultElectricityRate || 9.5,
            });
          }
        }
      }
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    await logAudit('INITIAL_SETUP', 'SYSTEM', { owner: user.email, houseName: user.houseName }, req);

    res.status(201).json({
      success: true,
      message: 'Owner and house configured successfully!',
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Purge dummy / test data (Admin Maintenance)
 * @route   POST /api/auth/reset-data
 * @access  Private (Owner)
 */
const resetData = async (req, res) => {
  try {
    const { mode = 'tenancies' } = req.body;

    // Purge financial and tenancy records
    await Promise.all([
      Tenant.deleteMany({}),
      TenantDocument.deleteMany({}),
      RentalAgreement.deleteMany({}),
      RentInvoice.deleteMany({}),
      RentPayment.deleteMany({}),
      ElectricityReading.deleteMany({}),
      ElectricityBill.deleteMany({}),
      ElectricityPayment.deleteMany({}),
      Expense.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // Reset room statuses to Available and disconnect current tenants
    await Room.updateMany({}, {
      status: 'Available',
      currentTenant: null,
      currentAgreement: null,
    });

    // Reset meters current readings
    await ElectricityMeter.updateMany({}, {
      currentReading: 0,
    });

    if (mode === 'factory') {
      await Room.deleteMany({});
      await ElectricityMeter.deleteMany({});
      await User.deleteMany({});
      res.clearCookie('token');
      return res.json({
        success: true,
        message: 'Factory reset completed. All data wiped clean.',
        isFactoryReset: true,
      });
    }

    await logAudit('PURGE_DUMMY_DATA', 'SYSTEM', { mode }, req);

    res.json({
      success: true,
      message: 'Dummy tenancy records cleared. Rooms are now clean and Available.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAuthStatus,
  loginOwner,
  getMe,
  changePassword,
  updateProfile,
  logoutOwner,
  setupOwner,
  resetData,
};
