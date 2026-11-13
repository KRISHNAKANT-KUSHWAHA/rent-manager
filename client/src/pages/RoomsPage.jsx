import React, { useState, useEffect, useCallback } from 'react';
import { getRooms, getRoom, createRoom, updateRoom, deleteRoom } from '../api/roomApi';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import SearchFilterBar from '../components/common/SearchFilterBar';
import { useDataCache, invalidateCache } from '../hooks/useDataCache';
import {
  Home,
  Plus,
  Zap,
  User,
  History,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Building2,
} from 'lucide-react';

const RoomsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state (default securityDeposit is 0)
  const initialFormState = {
    roomNumber: '',
    floor: 0,
    description: '',
    monthlyRent: '',
    securityDeposit: 0,
    electricityMeterNumber: '',
    electricityBillingType: 'submeter',
    fixedElectricityAmount: 0,
    status: 'Available',
    amenities: 'Attached Bathroom, Ceiling Fan, LED Lights',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const toast = useToast();

  // Instant SWR Cached Data
  const roomsFetcher = useCallback(async () => {
    const res = await getRooms({
      search,
      status: statusFilter,
      floor: floorFilter,
    });
    return res.success ? res.rooms : [];
  }, [search, statusFilter, floorFilter]);

  const {
    data: roomsData,
    setData: setRooms,
    loading,
    refresh: fetchRooms,
  } = useDataCache(`rooms-${statusFilter}-${floorFilter}-${search}`, roomsFetcher, { initialData: [] });
  const rooms = roomsData || [];

  const handleOpenAdd = () => {
    setSelectedRoom(null);
    setFormData(initialFormState);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (room) => {
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      floor: room.floor,
      description: room.description || '',
      monthlyRent: room.monthlyRent,
      securityDeposit: room.securityDeposit,
      electricityMeterNumber: room.electricityMeterNumber || '',
      electricityBillingType: room.electricityBillingType || 'submeter',
      fixedElectricityAmount: room.fixedElectricityAmount || 0,
      status: room.status,
      amenities: Array.isArray(room.amenities)
        ? room.amenities.join(', ')
        : room.amenities || '',
      notes: room.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = async (roomId) => {
    try {
      const res = await getRoom(roomId);
      if (res.success) {
        setRoomDetails(res);
        setIsDetailOpen(true);
      }
    } catch (err) {
      toast.error('Could not load room details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        monthlyRent: Number(formData.monthlyRent),
        securityDeposit: Number(formData.securityDeposit) || 0,
        floor: Number(formData.floor),
        amenities: formData.amenities
          ? formData.amenities.split(',').map((a) => a.trim()).filter(Boolean)
          : [],
      };

      if (selectedRoom) {
        await updateRoom(selectedRoom._id, payload);
        toast.success(`Room ${formData.roomNumber} updated successfully`);
      } else {
        await createRoom(payload);
        toast.success(`Room ${formData.roomNumber} added successfully`);
      }

      setIsFormOpen(false);
      invalidateCache('rooms');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    setSubmitting(true);
    try {
      await deleteRoom(selectedRoom._id);
      toast.success(`Room ${selectedRoom.roomNumber} deleted successfully`);
      setIsDeleteOpen(false);
      invalidateCache('rooms');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Room Management"
        subtitle="Manage rooms, floor assignments, rent rates, and sub-meters for this single house."
      >
        <Button variant="brand" icon={Plus} onClick={handleOpenAdd}>
          Add New Room
        </Button>
      </PageHeader>

      {/* Filter & Search Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
        }}
        placeholder="Search room no, description..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'Available', label: 'Available' },
              { value: 'Occupied', label: 'Occupied' },
              { value: 'Maintenance', label: 'Maintenance' },
            ],
          },
          {
            id: 'floor',
            label: 'Floor',
            value: floorFilter,
            onChange: setFloorFilter,
            options: [
              { value: 'all', label: 'All Floors' },
              { value: '0', label: 'Ground Floor' },
              { value: '1', label: '1st Floor' },
              { value: '2', label: '2nd Floor' },
              { value: '3', label: '3rd Floor' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setStatusFilter('all');
          setFloorFilter('all');
        }}
      >
        <Button size="sm" variant="secondary" onClick={fetchRooms}>
          Search
        </Button>
      </SearchFilterBar>

      {/* Room Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" count={4} />
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          title="No rooms match your filter"
          description="Try clearing filters or add a new room."
          actionLabel="Add Room"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft hover:border-orange-300 transition-all duration-200 p-6 flex flex-col justify-between group"
            >
              <div>
                {/* Header: Room Number & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {room.roomNumber}
                    </h3>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {room.floorName || `Floor ${room.floor}`}
                    </div>
                  </div>
                  <Badge status={room.status} />
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {room.description || 'No specific description recorded for this room.'}
                </p>

                {/* Financial Rates */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Monthly Rent:</span>
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {formatCurrency(room.monthlyRent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Security Deposit:</span>
                    <span className="font-bold text-slate-700 tabular-nums">
                      {formatCurrency(room.securityDeposit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Meter:
                    </span>
                    <span className="font-bold text-amber-800 uppercase font-mono">
                      {room.electricityMeterNumber || 'Sub-Meter #1'}
                    </span>
                  </div>
                </div>

                {/* Current Tenant Info */}
                <div className="mt-4 p-3 rounded-xl border border-slate-200/60 flex items-center gap-3 text-xs">
                  {room.currentTenant ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 font-bold flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">
                          {room.currentTenant.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Mob: {room.currentTenant.primaryMobile}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-orange-700 flex items-center gap-1.5 font-medium py-0.5">
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                      <span>Ready for new tenant registration</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  icon={Eye}
                  onClick={() => handleOpenDetail(room._id)}
                >
                  Details
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Edit2}
                    onClick={() => handleOpenEdit(room)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    icon={Trash2}
                    onClick={() => {
                      setSelectedRoom(room);
                      setIsDeleteOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedRoom ? `Edit Room ${selectedRoom.roomNumber}` : 'Add New Room to House'}
        subtitle="Configure room identity, monthly rent, and sub-meter assignment."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Room Number / Name"
              required
              placeholder="e.g. ROOM-101 or 1st Floor Front"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            />
            <Select
              label="Floor Level"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              options={[
                { value: 0, label: 'Ground Floor' },
                { value: 1, label: '1st Floor' },
                { value: 2, label: '2nd Floor' },
                { value: 3, label: '3rd Floor' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Monthly Rent (₹)"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              placeholder="e.g. 7500"
              value={formData.monthlyRent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthlyRent: e.target.value.replace(/[^0-9]/g, ''),
                })
              }
            />
            <Input
              label="Security Deposit (₹) - Defaults to 0"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Sub-Meter Serial / No"
              placeholder="e.g. MTR-101"
              value={formData.electricityMeterNumber}
              onChange={(e) =>
                setFormData({ ...formData, electricityMeterNumber: e.target.value })
              }
            />
            <Select
              label="Room Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'Available', label: 'Available (Vacant)' },
                { value: 'Occupied', label: 'Occupied' },
                { value: 'Maintenance', label: 'Maintenance' },
              ]}
            />
          </div>

          <Input
            label="Amenities (comma separated)"
            placeholder="Attached Bathroom, Balcony, Cupboard, Ceiling Fan"
            value={formData.amenities}
            onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Highlights
            </label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              placeholder="West-facing room with direct sunlight, fresh paint..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" loading={submitting}>
              {selectedRoom ? 'Update Room' : 'Save Room'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Room Details Modal */}
      {roomDetails && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Room ${roomDetails.room?.roomNumber} Overview`}
          subtitle={roomDetails.room?.floorName || `Floor ${roomDetails.room?.floor}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Quick Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-3">
                <Badge status={roomDetails.room?.status} />
                <span className="text-xs font-semibold text-slate-600">
                  Meter: {roomDetails.room?.electricityMeterNumber || 'None'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">Monthly Rent</div>
                <div className="text-base font-black text-slate-900 tabular-nums">
                  {formatCurrency(roomDetails.room?.monthlyRent)}
                </div>
              </div>
            </div>

            {/* Current Active Tenancy */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Current Tenancy
              </h4>
              {roomDetails.currentAgreement ? (
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {roomDetails.currentTenant?.fullName}
                    </span>
                    <Badge status="Active" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>Mobile: {roomDetails.currentTenant?.primaryMobile}</div>
                    <div>Agreement: {roomDetails.currentAgreement?.agreementNumber}</div>
                    <div>
                      From: {formatDate(roomDetails.currentAgreement?.startDate)}
                    </div>
                    <div>To: {formatDate(roomDetails.currentAgreement?.endDate)}</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  No active tenant currently assigned to this room.
                </p>
              )}
            </div>

            {/* Historical Tenancy Records */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Previous Tenancy History
              </h4>
              {roomDetails.agreementHistory && roomDetails.agreementHistory.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-xl overflow-hidden text-xs">
                  {roomDetails.agreementHistory.map((agr) => (
                    <div key={agr._id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{agr.tenant?.fullName}</div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(agr.startDate)} to {formatDate(agr.endDate)}
                        </div>
                      </div>
                      <Badge status={agr.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No past rental history for this room.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={submitting}
        title={`Delete Room ${selectedRoom?.roomNumber}?`}
        message="Are you sure you want to delete this room? This room can only be deleted if there is no active tenant assigned."
        confirmText="Delete Room"
        variant="danger"
      />
    </div>
  );
};

export default RoomsPage;
