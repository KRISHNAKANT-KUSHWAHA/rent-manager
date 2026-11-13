import React, { useState, useEffect } from 'react';
import { getAgreements, createAgreement, renewAgreement, refundDeposit } from '../api/agreementApi';
import { getRooms } from '../api/roomApi';
import { getTenants } from '../api/tenantApi';
import { useToast } from '../context/ToastContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import SearchFilterBar from '../components/common/SearchFilterBar';
import {
  FileSignature,
  Plus,
  RefreshCw,
  FileText,
  Printer,
  Calendar,
  Home,
  User,
  ShieldAlert,
  Coins,
} from 'lucide-react';

const AgreementsPage = () => {
  const [agreements, setAgreements] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [selectedAgr, setSelectedAgr] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Create form
  const [formData, setFormData] = useState({
    tenantId: '',
    roomId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .slice(0, 10),
    monthlyRent: '',
    securityDeposit: 0,
    rentDueDay: 5,
    notes: '',
  });

  // Renew form
  const [renewData, setRenewData] = useState({
    newEndDate: '',
    newMonthlyRent: '',
    notes: '',
  });

  // Refund form
  const [refundData, setRefundData] = useState({
    status: 'Refunded',
    refundAmount: '',
    deductionAmount: 0,
    deductionReason: '',
    paymentMethod: 'UPI',
    transactionRef: '',
    notes: '',
  });

  const toast = useToast();

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const res = await getAgreements({ status: statusFilter });
      if (res.success) {
        setAgreements(res.agreements);
      }
    } catch (err) {
      toast.error('Failed to load rental agreements');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsAndTenants = async () => {
    try {
      const [rRes, tRes] = await Promise.all([getRooms(), getTenants()]);
      if (rRes.success) setRooms(rRes.rooms);
      if (tRes.success) setTenants(tRes.tenants);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchAgreements();
    fetchRoomsAndTenants();
  }, [statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAgreement({
        ...formData,
        monthlyRent: Number(formData.monthlyRent),
        securityDeposit: Number(formData.securityDeposit) || 0,
        rentDueDay: Number(formData.rentDueDay) || 5,
      });
      toast.success('Rental agreement generated successfully');
      setIsCreateOpen(false);
      fetchAgreements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create agreement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgr) return;
    setSubmitting(true);
    try {
      await renewAgreement(selectedAgr._id, {
        ...renewData,
        newMonthlyRent: Number(renewData.newMonthlyRent),
      });
      toast.success('Agreement renewed successfully');
      setIsRenewOpen(false);
      fetchAgreements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Renewal failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgr) return;
    setSubmitting(true);
    try {
      await refundDeposit(selectedAgr._id, {
        ...refundData,
        refundAmount: Number(refundData.refundAmount) || 0,
        deductionAmount: Number(refundData.deductionAmount) || 0,
      });
      toast.success('Security deposit settlement recorded');
      setIsRefundOpen(false);
      fetchAgreements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Settlement failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Rental Agreements"
        subtitle="Manage tenancy agreements, duration terms, rent due dates, renewal extensions, and security settlements."
      >
        <Button
          variant="brand"
          icon={Plus}
          onClick={() => {
            setFormData({
              tenantId: '',
              roomId: '',
              startDate: new Date().toISOString().slice(0, 10),
              endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString()
                .slice(0, 10),
              monthlyRent: '',
              securityDeposit: 0,
              rentDueDay: 5,
              notes: '',
            });
            setIsCreateOpen(true);
          }}
        >
          Draft New Agreement
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <SearchFilterBar
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Agreements' },
              { value: 'Active', label: 'Active Tenancies' },
              { value: 'ExpiringSoon', label: 'Expiring Within 30 Days' },
              { value: 'Terminated', label: 'Past / Terminated' },
            ],
          },
        ]}
        onReset={() => setStatusFilter('all')}
      />

      {/* Agreement Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" count={4} />
        </div>
      ) : agreements.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No rental agreements found"
          description="Draft an agreement to establish a formal room tenancy."
          actionLabel="Draft Agreement"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agreements.map((agr) => (
            <div
              key={agr._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all duration-200 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                      {agr.agreementNumber}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {agr.tenant?.fullName || 'Resident'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {agr.room?.roomNumber} ({agr.room?.floorName || 'Floor'})
                      </span>
                    </div>
                  </div>
                  <Badge status={agr.status} />
                </div>

                {/* Period & Rates Box */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Contract Period
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatDate(agr.startDate)} to {formatDate(agr.endDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Rent Due Date
                    </span>
                    <span className="font-semibold text-slate-800">
                      Every {agr.rentDueDay || 5}th of Month
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Monthly Rent
                    </span>
                    <span className="font-black text-slate-900 text-sm tabular-nums">
                      {formatCurrency(agr.monthlyRent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Security Deposit
                    </span>
                    <span className="font-bold text-slate-800 text-sm tabular-nums">
                      {formatCurrency(agr.securityDeposit)}
                    </span>
                  </div>
                </div>

                {/* Deposit Refund info if terminated */}
                {agr.securityDepositRefund &&
                  agr.securityDepositRefund.status !== 'Not Applicable' && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
                      <div>
                        <span className="font-bold block">
                          Deposit Settlement: {agr.securityDepositRefund.status}
                        </span>
                        <span className="text-[11px] text-amber-800">
                          Refunded: {formatCurrency(agr.securityDepositRefund.refundAmount)} •
                          Deduction: {formatCurrency(agr.securityDepositRefund.deductionAmount)}
                        </span>
                      </div>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => {
                          setSelectedAgr(agr);
                          setRefundData({
                            status: agr.securityDepositRefund.status || 'Refunded',
                            refundAmount: agr.securityDepositRefund.refundAmount || '',
                            deductionAmount: agr.securityDepositRefund.deductionAmount || 0,
                            deductionReason: agr.securityDepositRefund.deductionReason || '',
                            paymentMethod: agr.securityDepositRefund.paymentMethod || 'UPI',
                            transactionRef: agr.securityDepositRefund.transactionRef || '',
                            notes: agr.securityDepositRefund.notes || '',
                          });
                          setIsRefundOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`/api/agreements/${agr._id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-soft-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download Agreement PDF</span>
                </a>

                {agr.status === 'Active' && (
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={RefreshCw}
                    onClick={() => {
                      setSelectedAgr(agr);
                      setRenewData({
                        newEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                          .toISOString()
                          .slice(0, 10),
                        newMonthlyRent: agr.monthlyRent,
                        notes: '',
                      });
                      setIsRenewOpen(true);
                    }}
                  >
                    Renew
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Draft Agreement Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Draft Formal Rental Agreement"
        subtitle="Links one room to one tenant for a specified tenancy duration."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Select Room"
              required
              value={formData.roomId}
              onChange={(e) => {
                const room = rooms.find((r) => r._id === e.target.value);
                setFormData({
                  ...formData,
                  roomId: e.target.value,
                  monthlyRent: room ? room.monthlyRent : formData.monthlyRent,
                  securityDeposit: room ? (room.securityDeposit ?? 0) : 0,
                });
              }}
            >
              <option value="">-- Choose Room --</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roomNumber} ({r.floorName || `Floor ${r.floor}`}) - ₹{r.monthlyRent}
                </option>
              ))}
            </Select>

            <Select
              label="Select Tenant"
              required
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
            >
              <option value="">-- Choose Tenant --</option>
              {tenants.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName} ({t.primaryMobile})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="Expiry / End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Monthly Rent (₹)"
              type="number"
              required
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
            />
            <Input
              label="Security Deposit (₹)"
              type="number"
              placeholder="0"
              value={formData.securityDeposit}
              onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
            />
            <Input
              label="Rent Due Day (1-31)"
              type="number"
              min="1"
              max="31"
              value={formData.rentDueDay}
              onChange={(e) => setFormData({ ...formData, rentDueDay: e.target.value })}
            />
          </div>

          <Input
            label="Additional Terms & Agreement Notes"
            placeholder="Electricity billed via submeter monthly, 30-day notice period..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" loading={submitting}>
              Generate Agreement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Renew Agreement Modal */}
      {selectedAgr && (
        <Modal
          isOpen={isRenewOpen}
          onClose={() => setIsRenewOpen(false)}
          title={`Renew Agreement: ${selectedAgr.agreementNumber}`}
          subtitle={`Tenant: ${selectedAgr.tenant?.fullName} • Room: ${selectedAgr.room?.roomNumber}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRenewSubmit} className="space-y-4">
            <Input
              label="New Agreement End Date"
              type="date"
              required
              value={renewData.newEndDate}
              onChange={(e) => setRenewData({ ...renewData, newEndDate: e.target.value })}
            />

            <Input
              label="New Monthly Rent (INR)"
              type="number"
              required
              value={renewData.newMonthlyRent}
              onChange={(e) => setRenewData({ ...renewData, newMonthlyRent: e.target.value })}
            />

            <Input
              label="Renewal Notes / Remarks"
              placeholder="Rent revised by 5% as per annual agreement"
              value={renewData.notes}
              onChange={(e) => setRenewData({ ...renewData, notes: e.target.value })}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsRenewOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={submitting}>
                Save Renewal
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Security Deposit Settlement Modal */}
      {selectedAgr && (
        <Modal
          isOpen={isRefundOpen}
          onClose={() => setIsRefundOpen(false)}
          title={`Security Deposit Settlement - ${selectedAgr.tenant?.fullName}`}
          subtitle={`Original Deposit: ₹${selectedAgr.securityDeposit}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <Select
              label="Settlement Status"
              value={refundData.status}
              onChange={(e) => setRefundData({ ...refundData, status: e.target.value })}
              options={[
                { value: 'Refunded', label: 'Refunded in Full' },
                { value: 'Partially Refunded', label: 'Partially Refunded (Deductions)' },
                { value: 'Forfeited', label: 'Forfeited' },
                { value: 'Pending', label: 'Settlement Pending' },
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Refund Amount (INR)"
                type="number"
                value={refundData.refundAmount}
                onChange={(e) => setRefundData({ ...refundData, refundAmount: e.target.value })}
              />
              <Input
                label="Deduction (INR)"
                type="number"
                value={refundData.deductionAmount}
                onChange={(e) =>
                  setRefundData({ ...refundData, deductionAmount: e.target.value })
                }
              />
            </div>

            <Input
              label="Deduction Reason (if any)"
              placeholder="e.g. Broken tile, wall paint"
              value={refundData.deductionReason}
              onChange={(e) => setRefundData({ ...refundData, deductionReason: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Payment Method"
                value={refundData.paymentMethod}
                onChange={(e) => setRefundData({ ...refundData, paymentMethod: e.target.value })}
                options={[
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Bank Transfer', label: 'Bank Transfer' },
                ]}
              />
              <Input
                label="Transaction Ref"
                placeholder="UPI/Reference ID"
                value={refundData.transactionRef}
                onChange={(e) => setRefundData({ ...refundData, transactionRef: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsRefundOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={submitting}>
                Save Settlement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AgreementsPage;
