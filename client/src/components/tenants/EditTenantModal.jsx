import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { updateTenant } from '../../api/tenantApi';
import { useToast } from '../../context/ToastContext';

const EditTenantModal = ({ isOpen, onClose, tenant, availableRooms = [], onSuccess }) => {
  const toast = useToast();
  const [editTab, setEditTab] = useState('personal');
  const [submitting, setSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const [formData, setFormData] = useState({
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
    moveInDate: '',
  });
  const [newMember, setNewMember] = useState({ name: '', relationship: 'Family Member', age: '', phone: '' });

  useEffect(() => {
    if (tenant) {
      setFormData({
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
        familyMembers: tenant.familyMembers ? [...tenant.familyMembers] : [],
        aadhaarNumber: tenant.aadhaarNumber || '',
        voterId: tenant.voterId || '',
        panNumber: tenant.panNumber || '',
        assignedRoomId: tenant.currentRoom?._id || '',
        monthlyRent: tenant.monthlyRent || (tenant.currentRoom?.monthlyRent ?? ''),
        securityDeposit: tenant.securityDeposit ?? (tenant.currentRoom?.securityDeposit ?? 0),
        rentDueDay: tenant.rentDueDay || 5,
        moveInDate: tenant.moveInDate ? tenant.moveInDate.slice(0, 10) : '',
      });
      setEditTab('personal');
      setCanSubmit(false);
      setNewMember({ name: '', relationship: 'Family Member', age: '', phone: '' });
    }
  }, [tenant]);

  const handleTabChange = (targetTab) => {
    if (targetTab === 'rent') {
      setCanSubmit(false);
      setEditTab('rent');
      setTimeout(() => setCanSubmit(true), 400);
    } else {
      setCanSubmit(false);
      setEditTab(targetTab);
    }
  };

  const handleAddMember = () => {
    if (!newMember.name.trim()) return;
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
    if (!roomId) {
      setFormData((prev) => ({ ...prev, assignedRoomId: '' }));
      return;
    }
    const selected = availableRooms.find((r) => r._id === roomId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        assignedRoomId: roomId,
        monthlyRent: selected.monthlyRent || prev.monthlyRent,
        securityDeposit: selected.securityDeposit !== undefined ? selected.securityDeposit : prev.securityDeposit,
      }));
    } else if (tenant?.currentRoom && tenant.currentRoom._id === roomId) {
      setFormData((prev) => ({
        ...prev,
        assignedRoomId: roomId,
        monthlyRent: tenant.monthlyRent || tenant.currentRoom.monthlyRent || prev.monthlyRent,
        securityDeposit: tenant.securityDeposit ?? (tenant.currentRoom.securityDeposit ?? prev.securityDeposit),
      }));
    } else {
      setFormData((prev) => ({ ...prev, assignedRoomId: roomId }));
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!tenant) return;
    if (editTab !== 'rent') return;
    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName,
        fatherName: formData.fatherName,
        gender: formData.gender,
        occupation: formData.occupation,
        employerOrCollege: formData.employerOrCollege,
        permanentAddress: formData.permanentAddress,
        currentAddress: formData.currentAddress,
        primaryMobile: formData.primaryMobile,
        alternateMobile: formData.alternateMobile,
        email: formData.email,
        familyMembers: formData.familyMembers,
        aadhaarNumber: formData.aadhaarNumber,
        voterId: formData.voterId,
        panNumber: formData.panNumber,
        assignedRoomId: formData.assignedRoomId,
        moveInDate: formData.moveInDate,
        monthlyRent: Number(formData.monthlyRent) || 0,
        securityDeposit: Number(formData.securityDeposit) || 0,
        rentDueDay: Number(formData.rentDueDay) || 5,
      };

      const res = await updateTenant(tenant._id, payload);
      toast.success(res.message || 'Tenant updated successfully!');
      onSuccess(res.tenant);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update tenant');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Tenant: ${tenant.fullName}`}
      subtitle="Update personal details, room members, identity proofs, and assign or change room."
      maxWidth="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 overflow-x-auto whitespace-nowrap text-xs font-bold no-scrollbar">
        {[
          { id: 'personal', label: '1. Personal Info' },
          { id: 'family', label: '2. Room Members' },
          { id: 'identity', label: '3. Identity Proofs' },
          { id: 'rent', label: '4. Room & Rent' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              editTab === tab.id
                ? 'bg-slate-900 text-white shadow-soft-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Tab 1: Personal */}
        {editTab === 'personal' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="Full Name"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              <Input
                label="Father's Name"
                required
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
                label="Primary Mobile"
                required
                type="tel"
                value={formData.primaryMobile}
                onChange={(e) => setFormData({ ...formData, primaryMobile: e.target.value })}
              />
              <Input
                label="Alternate Mobile"
                type="tel"
                value={formData.alternateMobile}
                onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="Occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              />
              <Input
                label="Company / College"
                value={formData.employerOrCollege}
                onChange={(e) => setFormData({ ...formData, employerOrCollege: e.target.value })}
              />
            </div>
            <Input
              label="Permanent Address"
              value={formData.permanentAddress}
              onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
            />
          </div>
        )}

        {/* Tab 2: Room Members */}
        {editTab === 'family' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            {formData.familyMembers.length > 0 && (
              <div className="space-y-2">
                {formData.familyMembers.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-slate-500 ml-2">({m.relationship}{m.age ? `, Age ${m.age}` : ''})</span>
                      {m.phone && <span className="text-slate-500 ml-2">📞 {m.phone}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
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
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
                <Input
                  label="Relationship"
                  value={newMember.relationship}
                  onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="Mobile"
                    type="tel"
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
        )}

        {/* Tab 3: Identity */}
        {editTab === 'identity' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              Identity numbers will be safely stored and masked in the UI.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="Aadhaar Number"
                value={formData.aadhaarNumber}
                onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
              />
              <Input
                label="Voter ID"
                value={formData.voterId}
                onChange={(e) => setFormData({ ...formData, voterId: e.target.value })}
              />
            </div>
            <Input
              label="PAN Number"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
            />
          </div>
        )}

        {/* Tab 4: Room & Rent */}
        {editTab === 'rent' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <Select
              label="Assign / Change Room"
              value={formData.assignedRoomId}
              onChange={(e) => handleRoomSelect(e.target.value)}
            >
              <option value="">-- No Room Assigned / Vacant --</option>
              {tenant?.currentRoom && (
                <option value={tenant.currentRoom._id}>
                  {tenant.currentRoom.roomNumber} ({tenant.currentRoom.floorName || `Floor ${tenant.currentRoom.floor}`}) — Currently Assigned
                </option>
              )}
              {availableRooms
                .filter((r) => r._id !== tenant?.currentRoom?._id)
                .map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roomNumber} ({r.floorName || `Floor ${r.floor}`}) — ₹{r.monthlyRent}/mo (Available)
                  </option>
                ))}
            </Select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="Monthly Rent (INR)"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="8500"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value.replace(/[^0-9]/g, '') })}
              />
              <Input
                label="Security Deposit (INR)"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={formData.securityDeposit}
                onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value.replace(/[^0-9]/g, '') })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="Move-in Date"
                type="date"
                value={formData.moveInDate}
                onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
              />
              <Input
                label="Monthly Rent Due Day (1-31)"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="5"
                value={formData.rentDueDay}
                onChange={(e) => setFormData({ ...formData, rentDueDay: e.target.value.replace(/[^0-9]/g, '') })}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {editTab !== 'personal' && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (editTab === 'rent') handleTabChange('identity');
                  else if (editTab === 'identity') handleTabChange('family');
                  else if (editTab === 'family') handleTabChange('personal');
                }}
              >
                ← Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editTab !== 'rent' ? (
              <Button
                key="edit-btn-next"
                type="button"
                variant="dark"
                onClick={() => {
                  if (editTab === 'personal') handleTabChange('family');
                  else if (editTab === 'family') handleTabChange('identity');
                  else if (editTab === 'identity') handleTabChange('rent');
                }}
              >
                Next Step →
              </Button>
            ) : (
              <Button
                key="edit-btn-submit"
                type="button"
                variant="brand"
                loading={submitting}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditTenantModal;
