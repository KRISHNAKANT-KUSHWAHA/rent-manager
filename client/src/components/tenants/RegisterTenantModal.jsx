import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { Users, Trash2 } from 'lucide-react';
import { createTenant } from '../../api/tenantApi';
import { useToast } from '../../context/ToastContext';

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

const RegisterTenantModal = ({ isOpen, onClose, availableRooms = [], onSuccess }) => {
  const toast = useToast();
  const [formData, setFormData] = useState(initialFormState);
  const [formTab, setFormTab] = useState('personal');
  const [submitting, setSubmitting] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: 'Family Member',
    age: '',
    phone: '',
  });

  const handleAddMember = () => {
    if (!newMember.name.trim()) {
      toast.error('Please enter family member or co-occupant name');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      familyMembers: [...(prev.familyMembers || []), { ...newMember }],
    }));
    setNewMember({ name: '', relationship: 'Family Member', age: '', phone: '' });
  };

  const handleRemoveMember = (idxToRemove) => {
    setFormData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, idx) => idx !== idxToRemove),
    }));
  };

  const handleRoomSelect = (roomId) => {
    const selected = availableRooms.find((r) => r._id === roomId);
    setFormData((prev) => ({
      ...prev,
      assignedRoomId: roomId,
      monthlyRent: selected ? selected.monthlyRent : '',
      securityDeposit: selected ? (selected.securityDeposit ?? 0) : 0,
    }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (formTab !== 'room') return;

    if (!formData.fullName.trim() || !formData.fatherName.trim() || !formData.primaryMobile.trim() || !formData.permanentAddress.trim()) {
      toast.error('Please enter Full Name, Father Name, Mobile No. and Permanent Address');
      setFormTab('personal');
      return;
    }

    if (!formData.assignedRoomId) {
      toast.error('Please select an available room from the list');
      return;
    }

    if (!formData.monthlyRent || Number(formData.monthlyRent) <= 0) {
      toast.error('Please enter the agreed monthly rent');
      return;
    }

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
      setFormData(initialFormState);
      setFormTab('personal');
      onSuccess(res.tenant);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register tenant');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Tenant"
      subtitle="Complete tenant details, optional room members, identity proof, and room tenancy."
      maxWidth="max-w-2xl"
    >
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 overflow-x-auto whitespace-nowrap text-xs font-bold no-scrollbar">
        {[
          { id: 'personal', label: '1. Personal Info' },
          { id: 'family', label: '2. Room Members (Optional)' },
          { id: 'identity', label: '3. Identity Proofs' },
          { id: 'room', label: '4. Room & Rent Setup' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFormTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              formTab === tab.id
                ? 'bg-slate-900 text-white shadow-soft-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
        }}
        className="space-y-4"
      >
        {/* Tab 1: Personal Details */}
        {formTab === 'personal' && (
          <div className="space-y-4 animate-in fade-in duration-100">
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

        {/* Tab 2: Room Members (Optional) */}
        {formTab === 'family' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
              Optional: Record other family members or roommates living in this room alongside the primary tenant.
            </div>

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
          <div className="space-y-4 animate-in fade-in duration-100">
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
          <div className="space-y-4 animate-in fade-in duration-100">
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            {formTab !== 'personal' && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (formTab === 'room') setFormTab('identity');
                  else if (formTab === 'identity') setFormTab('family');
                  else if (formTab === 'family') setFormTab('personal');
                }}
              >
                ← Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {formTab !== 'room' ? (
              <Button
                key="btn-next"
                type="button"
                variant="dark"
                onClick={() => {
                  if (formTab === 'personal') {
                    if (
                      !formData.fullName.trim() ||
                      !formData.fatherName.trim() ||
                      !formData.primaryMobile.trim() ||
                      !formData.permanentAddress.trim()
                    ) {
                      toast.error('Please enter Full Name, Father Name, Mobile No. and Permanent Address');
                      return;
                    }
                    setFormTab('family');
                  } else if (formTab === 'family') {
                    setFormTab('identity');
                  } else if (formTab === 'identity') {
                    setFormTab('room');
                  }
                }}
              >
                Next Step →
              </Button>
            ) : (
              <Button
                key="btn-submit"
                type="button"
                variant="brand"
                loading={submitting}
                onClick={handleSubmit}
              >
                Complete Registration
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RegisterTenantModal;
