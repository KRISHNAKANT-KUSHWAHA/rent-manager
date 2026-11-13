import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateProfile, changePassword, resetData } from '../api/authApi';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  Settings,
  Building,
  Lock,
  User,
  Shield,
  CreditCard,
  Zap,
  Save,
  CheckCircle,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

const SettingsPage = () => {
  const { user, updateUser, checkStatus } = useAuth();
  const toast = useToast();

  // Profile and house form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    houseName: user?.houseName || 'Residential Rental House',
    houseAddress: user?.houseAddress || '',
    defaultElectricityRate: user?.defaultElectricityRate || 9.5,
    upiId: user?.upiId || '',
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passSubmitting, setPassSubmitting] = useState(false);

  // Reset dialogs
  const [isResetTenanciesOpen, setIsResetTenanciesOpen] = useState(false);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      const res = await updateProfile(profileForm);
      if (res.success) {
        toast.success(res.message || 'Settings saved successfully');
        updateUser(res.user);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating settings');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPassSubmitting(true);
    try {
      const res = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(res.message || 'Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setPassSubmitting(false);
    }
  };

  const handleResetTenancies = async () => {
    setResetting(true);
    try {
      const res = await resetData('tenancies');
      toast.success(res.message || 'Dummy tenancy records cleared');
      setIsResetTenanciesOpen(false);
    } catch (err) {
      toast.error('Failed to reset tenancies');
    } finally {
      setResetting(false);
    }
  };

  const handleFactoryReset = async () => {
    setResetting(true);
    try {
      const res = await resetData('factory');
      toast.success('System reset completed. Redirecting to setup wizard...');
      setIsFactoryResetOpen(false);
      localStorage.clear();
      await checkStatus();
      window.location.href = '/login';
    } catch (err) {
      toast.error('Failed to execute factory reset');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="House & Owner Settings"
        subtitle="Manage owner profile, single property specifications, default electricity unit rates, and security."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: House Configuration & Owner Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Residential House Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  Address & details printed on rental agreements and payment receipts
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="House / Property Name"
                  required
                  value={profileForm.houseName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, houseName: e.target.value })
                  }
                />
                <Input
                  label="Default Electricity Rate (₹ / unit)"
                  type="number"
                  step="0.1"
                  required
                  value={profileForm.defaultElectricityRate}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      defaultElectricityRate: e.target.value,
                    })
                  }
                />
              </div>

              <Input
                label="House Physical Address"
                required
                value={profileForm.houseAddress}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, houseAddress: e.target.value })
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <Input
                  label="Owner Full Name"
                  required
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                />
                <Input
                  label="Owner Contact Phone"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Input
                  label="Owner UPI ID for Rent Collections"
                  placeholder="e.g. owner@okhdfcbank"
                  value={profileForm.upiId}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, upiId: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400 mt-1">
                  Printed on monthly rent invoices for easy payment collection via UPI.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  variant="brand"
                  icon={Save}
                  loading={profileSubmitting}
                >
                  Save House Details
                </Button>
              </div>
            </form>
          </div>

          {/* Data Reset & Clean Slate Maintenance */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Data Reset & Clean Slate
                </h3>
                <p className="text-xs text-slate-500">
                  Clear out dummy or test records when transitioning to real production tenancy
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Purge All Dummy Tenancy Records
                  </h4>
                  <p className="text-slate-500 mt-0.5">
                    Deletes all tenants, agreements, rent invoices, payments, meter readings, and expenses. Keeps your rooms and owner profile intact with all rooms marked Available.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsResetTenanciesOpen(true)}
                >
                  Purge Tenancies
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-rose-900 text-sm">
                    Full System Factory Reset
                  </h4>
                  <p className="text-rose-700 mt-0.5">
                    Completely purges all data including owner account, rooms, and configuration. Allows you to re-run the First-Time Setup Wizard.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsFactoryResetOpen(true)}
                >
                  Factory Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Password Management */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-500">Secure owner admin account</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                required
                placeholder="••••••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
              />

              <Input
                label="New Password"
                type="password"
                required
                placeholder="Min 6 characters"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                placeholder="Repeat new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />

              <Button
                type="submit"
                variant="brand"
                className="w-full mt-2"
                loading={passSubmitting}
              >
                Update Password
              </Button>
            </form>
          </div>

          {/* System Security Notice Box */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Owner Security Protocol</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This application is configured for a single property owner. No tenant portal or public registration endpoints are exposed. Sessions use HTTP-only encrypted cookies with rate limiting.
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={isResetTenanciesOpen}
        onClose={() => setIsResetTenanciesOpen(false)}
        onConfirm={handleResetTenancies}
        title="Purge All Dummy Tenancy Data?"
        message="This will permanently delete all tenants, agreements, invoices, rent payments, meter readings, bills, and expenses. Your room configurations and owner account will be preserved."
        confirmText="Confirm Purge"
        confirmVariant="danger"
        loading={resetting}
      />

      <ConfirmDialog
        isOpen={isFactoryResetOpen}
        onClose={() => setIsFactoryResetOpen(false)}
        onConfirm={handleFactoryReset}
        title="Full Factory Reset?"
        message="This will wipe the entire database completely. You will be logged out and taken to the First-Time Setup Wizard to configure your real owner account and rooms from scratch."
        confirmText="Factory Reset All"
        confirmVariant="danger"
        loading={resetting}
      />
    </div>
  );
};

export default SettingsPage;
