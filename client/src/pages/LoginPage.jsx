import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  User,
  Phone,
  Home,
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

const LoginPage = () => {
  const { isSetupRequired, login, setup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Setup Wizard Form (Used when database is clean and no owner exists yet)
  const [setupStep, setSetupStep] = useState(1); // 1: Owner, 2: House, 3: Rooms
  const [setupData, setSetupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    houseName: '',
    houseAddress: '',
    defaultElectricityRate: 9.5,
    upiId: '',
    initialRooms: [
      { roomNumber: 'ROOM-101', floor: 0, monthlyRent: '', securityDeposit: 0, electricityMeterNumber: '' },
      { roomNumber: 'ROOM-102', floor: 0, monthlyRent: '', securityDeposit: 0, electricityMeterNumber: '' },
      { roomNumber: 'ROOM-201', floor: 1, monthlyRent: '', securityDeposit: 0, electricityMeterNumber: '' },
      { roomNumber: 'ROOM-202', floor: 1, monthlyRent: '', securityDeposit: 0, electricityMeterNumber: '' },
    ],
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.success) {
        toast.success(`Welcome back, ${data.user?.name || 'Owner'}!`);
        navigate('/');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (setupData.password !== setupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (setupData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await setup(setupData);
      if (res.success) {
        toast.success('Owner account and house configured successfully!');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const addRoomRow = () => {
    const nextNum = setupData.initialRooms.length + 1;
    setSetupData((prev) => ({
      ...prev,
      initialRooms: [
        ...prev.initialRooms,
        {
          roomNumber: `ROOM-${nextNum > 2 ? '20' : '10'}${nextNum}`,
          floor: nextNum > 2 ? 1 : 0,
          monthlyRent: '',
          securityDeposit: 0,
          electricityMeterNumber: '',
        },
      ],
    }));
  };

  const removeRoomRow = (index) => {
    if (setupData.initialRooms.length <= 1) {
      toast.error('House must contain at least one room');
      return;
    }
    setSetupData((prev) => ({
      ...prev,
      initialRooms: prev.initialRooms.filter((_, idx) => idx !== index),
    }));
  };

  const updateRoomRow = (index, field, value) => {
    setSetupData((prev) => {
      const updated = [...prev.initialRooms];
      updated[index][field] = value;
      return { ...prev, initialRooms: updated };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className={`w-full ${isSetupRequired ? 'max-w-2xl' : 'max-w-md'} transition-all duration-300`}>
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/25 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            RoomRent Manager
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Owner-Only Room Rental Management System
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-indigo-300 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Single Residential House • Private Owner Portal</span>
          </div>
        </div>

        {/* Card: First-Time Setup Wizard OR Real Owner Login */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-slate-100">
          {isSetupRequired ? (
            /* First-Time Setup Wizard */
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">
                    First-Time House Setup Wizard
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    Step {setupStep} of 3
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your real owner credentials, residential house details, and rooms.
                </p>
              </div>

              {/* Progress Step Pills */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div
                  className={`h-1.5 rounded-full ${
                    setupStep >= 1 ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full ${
                    setupStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full ${
                    setupStep >= 3 ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
              </div>

              <form onSubmit={handleSetupSubmit} className="space-y-4">
                {/* STEP 1: Owner Profile */}
                {setupStep === 1 && (
                  <div className="space-y-4 animate-in fade-in">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Step 1: Owner Profile & Security
                    </h3>

                    <Input
                      label="Owner Full Name"
                      required
                      placeholder="e.g. Radheshyam Sharma"
                      value={setupData.name}
                      onChange={(e) =>
                        setSetupData({ ...setupData, name: e.target.value })
                      }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Email Address (Login ID)"
                        type="email"
                        required
                        placeholder="owner@yourdomain.com"
                        value={setupData.email}
                        onChange={(e) =>
                          setSetupData({ ...setupData, email: e.target.value })
                        }
                      />
                      <Input
                        label="Mobile Number"
                        placeholder="+91 98290 12345"
                        value={setupData.phone}
                        onChange={(e) =>
                          setSetupData({ ...setupData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Master Password"
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        value={setupData.password}
                        onChange={(e) =>
                          setSetupData({ ...setupData, password: e.target.value })
                        }
                      />
                      <Input
                        label="Confirm Password"
                        type="password"
                        required
                        placeholder="Repeat password"
                        value={setupData.confirmPassword}
                        onChange={(e) =>
                          setSetupData({
                            ...setupData,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          if (!setupData.name || !setupData.email || !setupData.password) {
                            toast.error('Please enter name, email, and password');
                            return;
                          }
                          setSetupStep(2);
                        }}
                      >
                        Next: House Details
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: House Configuration */}
                {setupStep === 2 && (
                  <div className="space-y-4 animate-in fade-in">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Step 2: Single Residential House Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="House / Property Name"
                        required
                        placeholder="e.g. Shanti Niwas (Property #104)"
                        value={setupData.houseName}
                        onChange={(e) =>
                          setSetupData({ ...setupData, houseName: e.target.value })
                        }
                      />
                      <Input
                        label="Default Electricity Rate (₹ / unit)"
                        type="number"
                        step="0.1"
                        required
                        value={setupData.defaultElectricityRate}
                        onChange={(e) =>
                          setSetupData({
                            ...setupData,
                            defaultElectricityRate: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Input
                      label="House Physical Address"
                      required
                      placeholder="Plot 42, Green Avenue, Sector 15, Near City Park, Jaipur"
                      value={setupData.houseAddress}
                      onChange={(e) =>
                        setSetupData({ ...setupData, houseAddress: e.target.value })
                      }
                    />

                    <Input
                      label="Owner UPI ID (for tenant rent transfers)"
                      placeholder="e.g. owner@okhdfcbank"
                      value={setupData.upiId}
                      onChange={(e) =>
                        setSetupData({ ...setupData, upiId: e.target.value })
                      }
                    />

                    <div className="pt-4 flex items-center justify-between">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setSetupStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (!setupData.houseName || !setupData.houseAddress) {
                            toast.error('Please enter house name and address');
                            return;
                          }
                          setSetupStep(3);
                        }}
                      >
                        Next: Configure Rooms
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Initial Rooms Setup */}
                {setupStep === 3 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Step 3: Rooms in this House ({setupData.initialRooms.length})
                      </h3>
                      <button
                        type="button"
                        onClick={addRoomRow}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Room
                      </button>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {setupData.initialRooms.map((room, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center gap-2 text-xs"
                        >
                          <div className="w-24">
                            <label className="text-[10px] text-slate-400 font-bold block">
                              Room No.
                            </label>
                            <input
                              type="text"
                              required
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800"
                              value={room.roomNumber}
                              onChange={(e) =>
                                updateRoomRow(idx, 'roomNumber', e.target.value)
                              }
                            />
                          </div>

                          <div className="w-24">
                            <label className="text-[10px] text-slate-400 font-bold block">
                              Floor (0,1..)
                            </label>
                            <input
                              type="number"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                              value={room.floor}
                              onChange={(e) =>
                                updateRoomRow(idx, 'floor', Number(e.target.value))
                              }
                            />
                          </div>

                          <div className="flex-1">
                            <label className="text-[10px] text-slate-400 font-bold block">
                              Rent (₹)
                            </label>
                            <input
                              type="number"
                              required
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                              value={room.monthlyRent}
                              onChange={(e) =>
                                updateRoomRow(
                                  idx,
                                  'monthlyRent',
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>

                          <div className="flex-1">
                            <label className="text-[10px] text-slate-400 font-bold block">
                              Deposit (₹)
                            </label>
                            <input
                              type="number"
                              required
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                              value={room.securityDeposit}
                              onChange={(e) =>
                                updateRoomRow(
                                  idx,
                                  'securityDeposit',
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>

                          <div className="w-24">
                            <label className="text-[10px] text-slate-400 font-bold block">
                              Sub-Meter
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 uppercase text-amber-700 font-bold"
                              value={room.electricityMeterNumber}
                              onChange={(e) =>
                                updateRoomRow(
                                  idx,
                                  'electricityMeterNumber',
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeRoomRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition mt-3"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setSetupStep(2)}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        icon={CheckCircle2}
                      >
                        Launch My House System
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          ) : (
            /* Real Production Owner Login */
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Sign in to your house</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate with your owner credentials to manage rooms, tenants, rent, and utility bills.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Input
                  label="Owner Email"
                  type="email"
                  icon={Mail}
                  required
                  placeholder="owner@yourdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Password"
                  type="password"
                  icon={Lock}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  loading={loading}
                  icon={ArrowRight}
                >
                  Access Owner Dashboard
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-slate-400 mt-6 max-w-sm mx-auto leading-relaxed">
          This system is strictly for property owner administration. No public registration or tenant portal exists.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
