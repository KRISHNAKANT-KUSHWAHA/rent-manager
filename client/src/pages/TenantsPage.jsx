import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getTenants, createTenant, updateTenant, vacateTenant, deleteTenant } from '../api/tenantApi';
import { getRooms } from '../api/roomApi';
import { useToast } from '../context/ToastContext';
import { formatDate, maskAadhaar, formatCurrency } from '../utils/formatters';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchFilterBar from '../components/common/SearchFilterBar';
import {
  Users,
  Plus,
  User,
  Phone,
  Home,
  FileText,
  DoorOpen,
  ArrowRight,
  ShieldCheck,
  Eye,
  LogOut,
  Trash2,
  Pencil,
} from 'lucide-react';

const TenantsPage = () => {
  const [tenants, setTenants] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isVacateOpen, setIsVacateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Tenant registration form state
  const initialFormState = {
    fullName: '',
    fatherName: '',
    gender: 'Male',
    occupation: '',
    employerOrCollege: '',
    permanentAddress: '',
    currentAddress: '',
    primaryMobile: '',
    alternateMobile: '',
    email: '',
    familyMembers: [],
    aadhaarNumber: '',
    voterId: '',
    panNumber: '',
    assignedRoomId: '',
    monthlyRent: '',
    securityDeposit: 0,
    rentDueDay: 5,
    moveInDate: new Date().toISOString().slice(0, 10),
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formTab, setFormTab] = useState('personal'); // 'personal' | 'family' | 'identity' | 'room'
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: 'Family Member',
    age: '',
    phone: '',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState(initialFormState);
  const [editTab, setEditTab] = useState('personal');
  const [editNewMember, setEditNewMember] = useState({ name: '', relationship: 'Family Member', age: '', phone: '' });

  const handleAddEditMember = () => {
    if (!editNewMember.name.trim()) return;
    setEditFormData({ ...editFormData, familyMembers: [...(editFormData.familyMembers || []), { ...editNewMember }] });
    setEditNewMember({ name: '', relationship: 'Family Member', age: '', phone: '' });
  };

  const handleRemoveEditMember = (idxToRemove) => {
    setEditFormData({ ...editFormData, familyMembers: editFormData.familyMembers.filter((_, idx) => idx !== idxToRemove) });
  };

  const handleAddMember = () => {
    if (!newMember.name.trim()) {
      toast.error('Please enter family member or co-occupant name');
      return;
    }
    setFormData({
      ...formData,
      familyMembers: [...(formData.familyMembers || []), { ...newMember }],
    });
    setNewMember({ name: '', relationship: 'Family Member', age: '', phone: '' });
  };

  const handleRemoveMember = (idxToRemove) => {
    setFormData({
      ...formData,
      familyMembers: formData.familyMembers.filter((_, idx) => idx !== idxToRemove),
    });
  };

  // Vacate Form state
  const [vacateData, setVacateData] = useState({
    vacatingDate: new Date().toISOString().slice(0, 10),
    depositRefundStatus: 'Refunded',
    refundAmount: '',
    deductionAmount: 0,
    deductionReason: '',
    notes: '',
  });

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await getTenants({ search, status: statusFilter });
      if (res.success) {
        setTenants(res.tenants);
      }
    } catch (err) {
      toast.error('Failed to load tenants list');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const res = await getRooms({ status: 'Available' });
      if (res.success) {
        setAvailableRooms(res.rooms);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchAvailableRooms();
    if (searchParams.get('new') === 'true') {
      setIsFormOpen(true);
    }
  }, [statusFilter]);

  const handleRoomSelect = (roomId) => {
    const selected = availableRooms.find((r) => r._id === roomId);
    setFormData({
      ...formData,
      assignedRoomId: roomId,
      monthlyRent: selected ? selected.monthlyRent : '',
      securityDeposit: selected ? (selected.securityDeposit ?? 0) : 0,
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        monthlyRent: Number(formData.monthlyRent),
        securityDeposit: Number(formData.securityDeposit) || 0,
        rentDueDay: Number(formData.rentDueDay) || 5,
      };

      const res = await createTenant(payload);
      toast.success(res.message || 'Tenant registered successfully!');
      setIsFormOpen(false);
      setFormData(initialFormState);
      fetchTenants();
      fetchAvailableRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVacateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setSubmitting(true);

    try {
      const res = await vacateTenant(selectedTenant._id, {
        ...vacateData,
        refundAmount: Number(vacateData.refundAmount) || 0,
        deductionAmount: Number(vacateData.deductionAmount) || 0,
      });
      toast.success(res.message || 'Tenant vacated successfully');
      setIsVacateOpen(false);
      fetchTenants();
      fetchAvailableRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process vacating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setSubmitting(true);
    try {
      const payload = {
        fullName: editFormData.fullName,
        fatherName: editFormData.fatherName,
        gender: editFormData.gender,
        occupation: editFormData.occupation,
        employerOrCollege: editFormData.employerOrCollege,
        permanentAddress: editFormData.permanentAddress,
        currentAddress: editFormData.currentAddress,
        primaryMobile: editFormData.primaryMobile,
        alternateMobile: editFormData.alternateMobile,
        email: editFormData.email,
        familyMembers: editFormData.familyMembers,
        aadhaarNumber: editFormData.aadhaarNumber,
        voterId: editFormData.voterId,
        panNumber: editFormData.panNumber,
        monthlyRent: Number(editFormData.monthlyRent) || 0,
        securityDeposit: Number(editFormData.securityDeposit) || 0,
        rentDueDay: Number(editFormData.rentDueDay) || 5,
      };
      const res = await updateTenant(selectedTenant._id, payload);
      toast.success(res.message || 'Tenant updated successfully!');
      setIsEditOpen(false);
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Tenant Management"
        subtitle="Maintain tenant profiles, family & emergency contacts, identity documents, and tenancy records."
      >
        <Button
          variant="brand"
          icon={Plus}
          onClick={() => {
            setFormData(initialFormState);
            setFormTab('personal');
            setIsFormOpen(true);
          }}
        >
          Register New Tenant
        </Button>
      </PageHeader>

      {/* Filter and Search */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search tenant name, phone, occupation..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Tenants' },
              { value: 'Active', label: 'Active Tenancies' },
              { value: 'Vacated', label: 'Past Vacated Tenants' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setStatusFilter('all');
        }}
      >
        <Button size="sm" variant="secondary" onClick={fetchTenants}>
          Search
        </Button>
      </SearchFilterBar>

      {/* Tenants Table */}
      <Table
        headers={[
          'Tenant Name & Profession',
          'Assigned Room',
          'Phone Number',
          'Masked Aadhaar / ID',
          'Move-in Date',
          'Status',
          { label: 'Actions', align: 'right' },
        ]}
        loading={loading}
        empty={tenants.length === 0}
        emptyTitle="No tenants found"
        emptyMessage="Register a new tenant to assign them to an available room."
        emptyIcon={Users}
        emptyAction={
          <Button size="sm" variant="brand" onClick={() => setIsFormOpen(true)}>
            Register Tenant
          </Button>
        }
      >
        {tenants.map((tenant) => (
          <tr key={tenant._id} className="hover:bg-slate-50/60 transition">
            <td className="py-4 px-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200">
                  {tenant.fullName ? tenant.fullName[0] : 'T'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {tenant.fullName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    Father: {tenant.fatherName} • {tenant.occupation || 'Resident'}
                  </div>
                </div>
              </div>
            </td>

            <td className="py-4 px-4 sm:px-5">
              {tenant.currentRoom ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800 font-bold text-xs">
                    <Home className="w-3.5 h-3.5 text-slate-500" />
                    <span>{tenant.currentRoom.roomNumber}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    👥 {tenant.familyMembers?.length ? tenant.familyMembers.length + 1 : 1} {tenant.familyMembers?.length ? 'occupants' : 'occupant'}
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 font-medium text-xs">None (Vacated)</span>
              )}
            </td>

            <td className="py-4 px-4 sm:px-5 font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{tenant.primaryMobile}</span>
              </div>
            </td>

            <td className="py-4 px-4 sm:px-5 font-mono text-slate-600 text-xs">
              {tenant.maskedAadhaar || maskAadhaar(tenant.aadhaarNumber)}
            </td>

            <td className="py-4 px-4 sm:px-5 text-slate-600 text-xs font-medium">
              {formatDate(tenant.moveInDate)}
            </td>

            <td className="py-4 px-4 sm:px-5">
              <Badge status={tenant.status} />
            </td>

            <td className="py-4 px-4 sm:px-5 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="xs"
                  variant="secondary"
                  icon={Eye}
                  onClick={() => navigate(`/tenants/${tenant._id}`)}
                >
                  Profile
                </Button>

                {tenant.status === 'Active' && (
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                    icon={Pencil}
                    title="Edit tenant"
                    onClick={() => {
                      setSelectedTenant(tenant);
                      setEditFormData({
                        fullName: tenant.fullName || '',
                        fatherName: tenant.fatherName || '',
                        gender: tenant.gender || 'Male',
                        occupation: tenant.occupation || '',
                        employerOrCollege: tenant.employerOrCollege || '',
                        permanentAddress: tenant.permanentAddress || '',
                        currentAddress: tenant.currentAddress || '',
                        primaryMobile: tenant.primaryMobile || '',
                        alternateMobile: tenant.alternateMobile || '',
                        email: tenant.email || '',
                        familyMembers: tenant.familyMembers || [],
                        aadhaarNumber: tenant.aadhaarNumber || '',
                        voterId: tenant.voterId || '',
                        panNumber: tenant.panNumber || '',
                        monthlyRent: tenant.monthlyRent || '',
                        securityDeposit: tenant.securityDeposit ?? 0,
                        rentDueDay: tenant.rentDueDay || 5,
                        moveInDate: tenant.moveInDate ? tenant.moveInDate.slice(0, 10) : '',
                      });
                      setEditTab('personal');
                      setEditNewMember({ name: '', relationship: 'Family Member', age: '', phone: '' });
                      setIsEditOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                )}

                {tenant.status === 'Active' && (
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                    icon={LogOut}
                    title="Vacate room"
                    onClick={() => {
                      setSelectedTenant(tenant);
                      setVacateData({
                        vacatingDate: new Date().toISOString().slice(0, 10),
                        depositRefundStatus: 'Refunded',
                        refundAmount: 0,
                        deductionAmount: 0,
                        deductionReason: '',
                        notes: '',
                      });
                      setIsVacateOpen(true);
                    }}
                  >
                    Vacate
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {/* Multi-Tab Register Tenant Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Register New Tenant"
        subtitle="Complete tenant details, optional room members, identity proof, and room tenancy."
        maxWidth="max-w-2xl"
      >
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 overflow-x-auto whitespace-nowrap text-xs font-bold no-scrollbar">
          <button
            type="button"
            onClick={() => setFormTab('personal')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              formTab === 'personal'
                ? 'bg-slate-900 text-white shadow-soft-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Personal Info
          </button>
          <button
            type="button"
            onClick={() => setFormTab('family')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              formTab === 'family'
                ? 'bg-slate-900 text-white shadow-soft-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. Room Members (Optional)
          </button>
          <button
            type="button"
            onClick={() => setFormTab('identity')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              formTab === 'identity'
                ? 'bg-slate-900 text-white shadow-soft-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Identity Proofs
          </button>
          <button
            type="button"
            onClick={() => setFormTab('room')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              formTab === 'room'
                ? 'bg-slate-900 text-white shadow-soft-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            4. Room & Rent Setup
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Tab 1: Personal Details */}
          {formTab === 'personal' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
                <Input
                  label="Father's Name"
                  required
                  placeholder="e.g. Rajesh Malhotra"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
                <Input
                  label="Primary Mobile No."
                  required
                  type="tel"
                  placeholder="9876543210"
                  value={formData.primaryMobile}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryMobile: e.target.value })
                  }
                />
                <Input
                  label="Alternate Mobile No."
                  type="tel"
                  placeholder="Optional"
                  value={formData.alternateMobile}
                  onChange={(e) =>
                    setFormData({ ...formData, alternateMobile: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Occupation"
                  placeholder="e.g. Software Engineer / Accountant"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
                <Input
                  label="Company / College"
                  placeholder="e.g. Infosys Ltd"
                  value={formData.employerOrCollege}
                  onChange={(e) =>
                    setFormData({ ...formData, employerOrCollege: e.target.value })
                  }
                />
              </div>

              <Input
                label="Permanent Address"
                required
                placeholder="Full permanent residential address (Village/City, State, Pincode)"
                value={formData.permanentAddress}
                onChange={(e) =>
                  setFormData({ ...formData, permanentAddress: e.target.value })
                }
              />
            </div>
          )}

          {/* Tab 2: Room Members / Co-Occupants (Optional) */}
          {formTab === 'family' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                Optional: Record other family members or roommates living in this room alongside the primary tenant.
              </div>

              {/* Co-Occupants / Family living in room */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-orange-600" />
                      Members Living In This Room
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Add spouses, children, parents, or co-tenants residing in the same room.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 self-start sm:self-auto">
                    Total: {(formData.familyMembers?.length || 0) + 1} Persons
                  </span>
                </div>

                {/* List of added members */}
                {formData.familyMembers && formData.familyMembers.length > 0 ? (
                  <div className="space-y-2">
                    {formData.familyMembers.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800">{m.name}</span>
                            <span className="ml-2 text-[11px] text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 font-medium">
                              {m.relationship}
                            </span>
                            {m.age && <span className="ml-2 text-slate-400">({m.age} yrs)</span>}
                            {m.phone && <span className="ml-2 text-slate-500">📞 {m.phone}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Currently 1 person (primary tenant). If they live alone, you can skip to next step.
                  </p>
                )}

                {/* Add member inputs */}
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    + Add Co-Occupant / Family Member:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                    <Input
                      label="Member Name"
                      placeholder="e.g. Sunita Devi"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    />
                    <Select
                      label="Relationship"
                      value={newMember.relationship}
                      onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                      options={[
                        { value: 'Wife', label: 'Wife' },
                        { value: 'Husband', label: 'Husband' },
                        { value: 'Son', label: 'Son' },
                        { value: 'Daughter', label: 'Daughter' },
                        { value: 'Father', label: 'Father' },
                        { value: 'Mother', label: 'Mother' },
                        { value: 'Brother', label: 'Brother' },
                        { value: 'Sister', label: 'Sister' },
                        { value: 'Roommate/Friend', label: 'Roommate / Friend' },
                        { value: 'Other Relative', label: 'Other Relative' },
                      ]}
                    />
                    <Input
                      label="Age"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Optional"
                      value={newMember.age}
                      onChange={(e) =>
                        setNewMember({
                          ...newMember,
                          age: e.target.value.replace(/[^0-9]/g, ''),
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          label="Mobile"
                          type="tel"
                          placeholder="Optional"
                          value={newMember.phone}
                          onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="h-10 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition shrink-0 self-end mb-0.5 shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Identity Details */}
          {formTab === 'identity' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                Identity numbers will be safely stored and masked in the UI. Physical copies can be uploaded in the Documents module.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Aadhaar Card Number"
                  placeholder="12-digit Aadhaar number"
                  value={formData.aadhaarNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, aadhaarNumber: e.target.value })
                  }
                />
                <Input
                  label="Voter ID Card Number"
                  placeholder="e.g. RJ/04/123/456789"
                  value={formData.voterId}
                  onChange={(e) => setFormData({ ...formData, voterId: e.target.value })}
                />
              </div>

              <Input
                label="PAN Card Number"
                placeholder="e.g. ABCDE1234F"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
              />
            </div>
          )}

          {/* Tab 4: Room & Tenancy Setup */}
          {formTab === 'room' && (
            <div className="space-y-4 animate-in fade-in">
              <Select
                label="Assign Room"
                value={formData.assignedRoomId}
                onChange={(e) => handleRoomSelect(e.target.value)}
              >
                <option value="">-- Select an Available Room --</option>
                {availableRooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roomNumber} ({r.floorName || `Floor ${r.floor}`}) - ₹{r.monthlyRent}/mo
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Agreed Monthly Rent (INR)"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="8500"
                  value={formData.monthlyRent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyRent: e.target.value.replace(/[^0-9]/g, ''),
                    })
                  }
                />
                <Input
                  label="Security Deposit (INR) - Defaults to 0"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={formData.securityDeposit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      securityDeposit: e.target.value.replace(/[^0-9]/g, ''),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Move-in Date"
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) =>
                    setFormData({ ...formData, moveInDate: e.target.value })
                  }
                />
                <Input
                  label="Monthly Rent Due Day (1-31)"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="5"
                  value={formData.rentDueDay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rentDueDay: e.target.value.replace(/[^0-9]/g, ''),
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {formTab !== 'room' ? (
                <Button
                  type="button"
                  variant="dark"
                  onClick={() => {
                    if (formTab === 'personal') setFormTab('family');
                    else if (formTab === 'family') setFormTab('identity');
                    else if (formTab === 'identity') setFormTab('room');
                  }}
                >
                  Next Step
                </Button>
              ) : (
                <Button type="submit" variant="brand" loading={submitting}>
                  Complete Registration
                </Button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Vacate Tenant Modal */}
      {selectedTenant && (
        <Modal
          isOpen={isVacateOpen}
          onClose={() => setIsVacateOpen(false)}
          title={`Vacate Tenant: ${selectedTenant.fullName}`}
          subtitle={`Room ${selectedTenant.currentRoom?.roomNumber || 'Room'} will become Available.`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleVacateSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
              <strong>Notice:</strong> Vacating marks the tenancy as terminated and releases the room. All rent invoices, payments, and electricity history will be permanently preserved in the ledger.
            </div>

            <Input
              label="Vacating Date"
              type="date"
              required
              value={vacateData.vacatingDate}
              onChange={(e) =>
                setVacateData({ ...vacateData, vacatingDate: e.target.value })
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Select
                label="Security Deposit Settlement"
                value={vacateData.depositRefundStatus}
                onChange={(e) =>
                  setVacateData({ ...vacateData, depositRefundStatus: e.target.value })
                }
                options={[
                  { value: 'Refunded', label: 'Refunded in Full' },
                  { value: 'Partially Refunded', label: 'Partially Refunded (Deductions)' },
                  { value: 'Forfeited', label: 'Forfeited' },
                  { value: 'Not Applicable', label: 'Not Applicable (₹0 Deposit)' },
                ]}
              />
              <Input
                label="Refund Amount (INR)"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={vacateData.refundAmount}
                onChange={(e) =>
                  setVacateData({
                    ...vacateData,
                    refundAmount: e.target.value.replace(/[^0-9]/g, ''),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="Deduction Amount (if any)"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={vacateData.deductionAmount}
                onChange={(e) =>
                  setVacateData({
                    ...vacateData,
                    deductionAmount: e.target.value.replace(/[^0-9]/g, ''),
                  })
                }
              />
              <Input
                label="Reason for Deductions"
                placeholder="e.g. Paint touchup / broken switch"
                value={vacateData.deductionReason}
                onChange={(e) =>
                  setVacateData({ ...vacateData, deductionReason: e.target.value })
                }
              />
            </div>

            <Input
              label="Vacating Remarks & Notes"
              placeholder="e.g. Cleared all dues, keys returned"
              value={vacateData.notes}
              onChange={(e) => setVacateData({ ...vacateData, notes: e.target.value })}
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsVacateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={submitting}>
                Confirm Vacate & Settle
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Tenant Modal */}
      {selectedTenant && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Tenant: ${selectedTenant.fullName}`}
          subtitle="Update personal details, room members, and identity proofs. Room assignment is managed via vacate flow."
          maxWidth="max-w-2xl"
        >
          {/* Tabs */}
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 overflow-x-auto whitespace-nowrap text-xs font-bold no-scrollbar">
            {['personal', 'family', 'identity'].map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setEditTab(tab)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  editTab === tab
                    ? 'bg-slate-900 text-white shadow-soft-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {i + 1}. {tab === 'personal' ? 'Personal Info' : tab === 'family' ? 'Room Members' : 'Identity Proofs'}
              </button>
            ))}
          </div>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Tab 1: Personal */}
            {editTab === 'personal' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    label="Full Name"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  />
                  <Input
                    label="Father's Name"
                    required
                    value={editFormData.fatherName}
                    onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <Select
                    label="Gender"
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />
                  <Input
                    label="Primary Mobile"
                    required
                    type="tel"
                    value={editFormData.primaryMobile}
                    onChange={(e) => setEditFormData({ ...editFormData, primaryMobile: e.target.value })}
                  />
                  <Input
                    label="Alternate Mobile"
                    type="tel"
                    value={editFormData.alternateMobile}
                    onChange={(e) => setEditFormData({ ...editFormData, alternateMobile: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    label="Occupation"
                    value={editFormData.occupation}
                    onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
                  />
                  <Input
                    label="Company / College"
                    value={editFormData.employerOrCollege}
                    onChange={(e) => setEditFormData({ ...editFormData, employerOrCollege: e.target.value })}
                  />
                </div>
                <Input
                  label="Permanent Address"
                  value={editFormData.permanentAddress}
                  onChange={(e) => setEditFormData({ ...editFormData, permanentAddress: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    label="Monthly Rent (INR)"
                    type="text"
                    inputMode="numeric"
                    value={editFormData.monthlyRent}
                    onChange={(e) => setEditFormData({ ...editFormData, monthlyRent: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                  <Input
                    label="Rent Due Day (1–31)"
                    type="text"
                    inputMode="numeric"
                    value={editFormData.rentDueDay}
                    onChange={(e) => setEditFormData({ ...editFormData, rentDueDay: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Room Members */}
            {editTab === 'family' && (
              <div className="space-y-4 animate-in fade-in">
                {editFormData.familyMembers.length > 0 && (
                  <div className="space-y-2">
                    {editFormData.familyMembers.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{m.name}</span>
                          <span className="text-slate-500 ml-2">({m.relationship}{m.age ? `, Age ${m.age}` : ''})</span>
                          {m.phone && <span className="text-slate-500 ml-2">📞 {m.phone}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditMember(idx)}
                          className="text-red-500 hover:text-red-700 font-bold px-1.5"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-slate-700">Add Member</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Name"
                      value={editNewMember.name}
                      onChange={(e) => setEditNewMember({ ...editNewMember, name: e.target.value })}
                    />
                    <Input
                      label="Relationship"
                      value={editNewMember.relationship}
                      onChange={(e) => setEditNewMember({ ...editNewMember, relationship: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        label="Mobile"
                        type="tel"
                        value={editNewMember.phone}
                        onChange={(e) => setEditNewMember({ ...editNewMember, phone: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEditMember}
                      className="h-10 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition shrink-0 self-end mb-0.5 shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Identity */}
            {editTab === 'identity' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  Identity numbers will be safely stored and masked in the UI.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    label="Aadhaar Number"
                    value={editFormData.aadhaarNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })}
                  />
                  <Input
                    label="Voter ID"
                    value={editFormData.voterId}
                    onChange={(e) => setEditFormData({ ...editFormData, voterId: e.target.value })}
                  />
                </div>
                <Input
                  label="PAN Number"
                  value={editFormData.panNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value })}
                />
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {editTab !== 'identity' ? (
                  <Button
                    type="button"
                    variant="dark"
                    onClick={() => {
                      if (editTab === 'personal') setEditTab('family');
                      else if (editTab === 'family') setEditTab('identity');
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" variant="brand" loading={submitting}>
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TenantsPage;
