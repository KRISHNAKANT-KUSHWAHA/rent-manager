import React, { useState, useEffect } from 'react';
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
import {
  Home,
  Plus,
  Search,
  Filter,
  Zap,
  ShieldCheck,
  User,
  History,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Form state
  const initialFormState = {
    roomNumber: '',
    floor: 0,
    description: '',
    monthlyRent: '',
    securityDeposit: '',
    electricityMeterNumber: '',
    electricityBillingType: 'submeter',
    fixedElectricityAmount: 0,
    status: 'Available',
    amenities: 'Attached Bathroom, Ceiling Fan, LED Lights',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const toast = useToast();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await getRooms({
        search,
        status: statusFilter,
        floor: floorFilter,
      });
      if (res.success) {
        setRooms(res.rooms);
      }
    } catch (err) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [statusFilter, floorFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRooms();
  };

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
        : 'Attached Bathroom, Ceiling Fan',
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
      toast.error('Failed to load room details');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        amenities: formData.amenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
      };

      if (selectedRoom) {
        const res = await updateRoom(selectedRoom._id, payload);
        toast.success(res.message || 'Room updated successfully');
      } else {
        const res = await createRoom(payload);
        toast.success(res.message || 'Room added to the house');
      }

      setIsFormOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving room details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    setSubmitting(true);
    try {
      const res = await deleteRoom(selectedRoom._id);
      toast.success(res.message || 'Room deleted');
      setIsDeleteOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Room Management"
        subtitle="Manage rooms, floor assignments, rent rates, and sub-meters for this single house."
      >
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add New Room
        </Button>
      </PageHeader>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <Input
            placeholder="Search room no, description..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Available', label: 'Available' },
                { value: 'Occupied', label: 'Occupied' },
                { value: 'Maintenance', label: 'Maintenance' },
              ]}
            />
          </div>

          <div className="w-36">
            <Select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Floors' },
                { value: '0', label: 'Ground Floor' },
                { value: '1', label: '1st Floor' },
                { value: '2', label: '2nd Floor' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Room Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" count={4} />
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
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
            >
              <div>
                {/* Header: Room Number & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {room.roomNumber}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {room.floorName || `Floor ${room.floor}`}
                    </div>
                  </div>
                  <Badge status={room.status} />
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {room.description || 'No specific description recorded for this room.'}
                </p>

                {/* Financial Rates */}
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Monthly Rent:</span>
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(room.monthlyRent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Security Deposit:</span>
                    <span className="font-bold text-slate-700">
                      {formatCurrency(room.securityDeposit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Meter:
                    </span>
                    <span className="font-bold text-amber-700 uppercase">
                      {room.electricityMeterNumber || 'Sub-Meter #1'}
                    </span>
                  </div>
                </div>

                {/* Current Tenant Banner */}
                <div className="mt-4 p-3 rounded-2xl border flex items-center gap-3 text-xs">
                  {room.currentTenant ? (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">
                          {room.currentTenant.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Mob: {room.currentTenant.primaryMobile}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-emerald-700 flex items-center gap-1.5 font-medium py-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
        subtitle="Manage room configuration, floor, rent amount, and sub-meter assignment."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Room Number / Name"
              required
              placeholder="e.g. ROOM-101"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            />
            <Select
              label="Floor Level"
              required
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
              options={[
                { value: 0, label: 'Ground Floor' },
                { value: 1, label: '1st Floor' },
                { value: 2, label: '2nd Floor' },
                { value: 3, label: '3rd Floor' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monthly Rent (INR)"
              type="number"
              required
              placeholder="8500"
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
            />
            <Input
              label="Security Deposit (INR)"
              type="number"
              required
              placeholder="17000"
              value={formData.securityDeposit}
              onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Electricity Meter No."
              placeholder="e.g. MTR-101"
              value={formData.electricityMeterNumber}
              onChange={(e) =>
                setFormData({ ...formData, electricityMeterNumber: e.target.value })
              }
            />
            <Select
              label="Electricity Billing Type"
              value={formData.electricityBillingType}
              onChange={(e) =>
                setFormData({ ...formData, electricityBillingType: e.target.value })
              }
              options={[
                { value: 'submeter', label: 'Sub-Meter (Per Unit Consumed)' },
                { value: 'fixed', label: 'Fixed Monthly Charge' },
                { value: 'shared', label: 'Shared / Proportionate' },
              ]}
            />
          </div>

          <Select
            label="Room Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Available', label: 'Available (Vacant)' },
              { value: 'Occupied', label: 'Occupied' },
              { value: 'Maintenance', label: 'Under Maintenance' },
            ]}
          />

          <Input
            label="Amenities (comma separated)"
            placeholder="Attached Bathroom, Balcony, Ceiling Fan"
            value={formData.amenities}
            onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Description & Notes
            </label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Enter room details, orientation, fittings, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {selectedRoom ? 'Update Room' : 'Save Room'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Room Details & Historical Tenants Modal */}
      {roomDetails && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Room ${roomDetails.room?.roomNumber} Overview`}
          subtitle={`${roomDetails.room?.floorName || 'Floor'} • ${roomDetails.room?.status}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Rates and Specs */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block">Monthly Rent</span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatCurrency(roomDetails.room?.monthlyRent)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Security Deposit</span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatCurrency(roomDetails.room?.securityDeposit)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Sub-Meter Number</span>
                <span className="text-base font-extrabold text-amber-700 uppercase">
                  {roomDetails.room?.electricityMeterNumber || 'MTR-01'}
                </span>
              </div>
            </div>

            {/* Current Active Tenant */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                Current Active Tenant
              </h4>
              {roomDetails.room?.currentTenant ? (
                <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {roomDetails.room.currentTenant.fullName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Father: {roomDetails.room.currentTenant.fatherName} • Mobile:{' '}
                      {roomDetails.room.currentTenant.primaryMobile}
                    </div>
                    <div className="text-xs text-indigo-700 font-semibold mt-1">
                      Moved In: {formatDate(roomDetails.room.currentTenant.moveInDate)}
                    </div>
                  </div>
                  <Badge status="Occupied" />
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                  Room is currently vacant and available for rent.
                </div>
              )}
            </div>

            {/* Historical Tenants for this Room */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                Previous Tenancy History
              </h4>
              {roomDetails.pastAgreements && roomDetails.pastAgreements.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {roomDetails.pastAgreements.map((agr) => (
                    <div
                      key={agr._id}
                      className="p-3 rounded-xl border border-slate-100 bg-white text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {agr.tenant?.fullName || 'Previous Tenant'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Period: {formatDate(agr.startDate)} to {formatDate(agr.endDate)}
                        </div>
                      </div>
                      <Badge status={agr.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No past rental records for this room.</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteRoom}
        title={`Delete Room ${selectedRoom?.roomNumber}?`}
        message="Are you sure you want to delete this room? This room can only be deleted if it is not currently occupied."
        confirmText="Delete Room"
        loading={submitting}
      />
    </div>
  );
};

export default RoomsPage;

