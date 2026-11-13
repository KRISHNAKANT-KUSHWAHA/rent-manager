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
      const rRes = await getRooms();
      if (rRes.success) setRooms(rRes.rooms);
      const tRes = await getTenants();
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
      const res = await createAgreement(formData);
      toast.success(res.message || 'Rental agreement generated');
      setIsCreateOpen(false);
      fetchAgreements();
      fetchRoomsAndTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating agreement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgr) return;
    setSubmitting(true);
    try {
      const res = await renewAgreement(selectedAgr._id, renewData);
      toast.success(res.message || 'Agreement renewed successfully');
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
      const res = await refundDeposit(selectedAgr._id, refundData);
      toast.success(res.message || 'Security deposit refund saved');
      setIsRefundOpen(false);
      fetchAgreements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rental Agreement Management"
        subtitle="Generate legal agreement records, monitor contract expiries, process renewals, and download PDF summaries."
      >
        <Button
          variant="primary"
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
          New Rental Agreement
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Filter by Status:
        </div>
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Agreements' },
              { value: 'Active', label: 'Active Contracts' },
              { value: 'Expired', label: 'Expired' },
              { value: 'Terminated', label: 'Terminated (Vacated)' },
            ]}
          />
        </div>
      </div>

      {/* Agreements Cards / List */}
      {loading ? (
        <Skeleton className="h-64" count={3} />
      ) : agreements.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No rental agreements found"
          description="Create a rental agreement linking a tenant to a room."
          actionLabel="Create Agreement"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agreements.map((agr) => (
            <div
              key={agr._id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 block">
                      {agr.agreementNumber}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      {agr.tenant?.fullName || 'Tenant'}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Home className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        {agr.room?.roomNumber} ({agr.room?.floorName || 'Floor'})
                      </span>
                    </div>
                  </div>
                  <Badge status={agr.status} />
                </div>

                {/* Period & Rates Box */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
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
                    <span className="font-black text-slate-900 text-sm">
                      {formatCurrency(agr.monthlyRent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Security Deposit
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatCurrency(agr.securityDeposit)}
                    </span>
                  </div>
                </div>

                {/* Deposit Refund info if terminated */}
                {agr.securityDepositRefund &&
                  agr.securityDepositRefund.status !== 'Not Applicable' && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
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
                        variant="outline"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download Agreement PDF</span>
                </a>

                <div className="flex items-center gap-2">
                  {agr.status === 'Active' && (
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={RefreshCw}
                      onClick={() => {
                        setSelectedAgr(agr);
                        const nextYear = new Date(agr.endDate);
                        nextYear.setFullYear(nextYear.getFullYear() + 1);
                        setRenewData({
                          newEndDate: nextYear.toISOString().slice(0, 10),
                          newMonthlyRent: agr.monthlyRent,
                          notes: 'Annual renewal',
                        });
                        setIsRenewOpen(true);
                      }}
                    >
                      Renew
                    </Button>
                  )}
                  {agr.status !== 'Active' && (
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={Coins}
                      onClick={() => {
                        setSelectedAgr(agr);
                        setRefundData({
                          status: 'Refunded',
                          refundAmount: agr.securityDeposit,
                          deductionAmount: 0,
                          deductionReason: '',
                          paymentMethod: 'UPI',
                          transactionRef: '',
                          notes: '',
                        });
                        setIsRefundOpen(true);
                      }}
                    >
                      Deposit Refund
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Agreement Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Rental Agreement"
        subtitle="Formal contract linking a registered tenant with an available room."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                  {r.roomNumber} ({r.floorName}) - {r.status}
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
                  {t.fullName} (Mob: {t.primaryMobile})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Agreement Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="Agreement Expiry Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Monthly Rent (INR)"
              type="number"
              required
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
            />
            <Input
              label="Security Deposit (INR)"
              type="number"
              placeholder="0 (Default: 0)"
              value={formData.securityDeposit}
              onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
            />
            <Input
              label="Rent Due Day"
              type="number"
              min="1"
              max="31"
              value={formData.rentDueDay}
              onChange={(e) => setFormData({ ...formData, rentDueDay: e.target.value })}
            />
          </div>

          <Input
            label="Notes / Special Conditions"
            placeholder="e.g. Sub-meter billing at ₹9.5/unit, 30-day notice"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
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
          subtitle={`Tenant: ${selectedAgr.tenant?.fullName || 'Tenant'} • Current Rent: ₹${selectedAgr.monthlyRent}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRenewSubmit} className="space-y-4">
            <Input
              label="New Expiry Date"
              type="date"
              required
              value={renewData.newEndDate}
              onChange={(e) => setRenewData({ ...renewData, newEndDate: e.target.value })}
            />
            <Input
              label="Revised Monthly Rent (INR)"
              type="number"
              required
              value={renewData.newMonthlyRent}
              onChange={(e) =>
                setRenewData({ ...renewData, newMonthlyRent: e.target.value })
              }
            />
            <Input
              label="Renewal Notes"
              placeholder="e.g. Extended by 12 months with 5% rent revision"
              value={renewData.notes}
              onChange={(e) => setRenewData({ ...renewData, notes: e.target.value })}
            />
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsRenewOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Save Renewal
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deposit Refund Modal */}
      {selectedAgr && (
        <Modal
          isOpen={isRefundOpen}
          onClose={() => setIsRefundOpen(false)}
          title="Security Deposit Settlement"
          subtitle={`Original Deposit: ₹${selectedAgr.securityDeposit}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <Select
              label="Refund Status"
              value={refundData.status}
              onChange={(e) => setRefundData({ ...refundData, status: e.target.value })}
              options={[
                { value: 'Refunded', label: 'Refunded' },
                { value: 'Partially Refunded', label: 'Partially Refunded (Deductions)' },
                { value: 'Forfeited', label: 'Forfeited' },
                { value: 'Pending', label: 'Pending Settlement' },
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Refund Amount (INR)"
                type="number"
                value={refundData.refundAmount}
                onChange={(e) =>
                  setRefundData({ ...refundData, refundAmount: e.target.value })
                }
              />
              <Input
                label="Deduction Amount (INR)"
                type="number"
                value={refundData.deductionAmount}
                onChange={(e) =>
                  setRefundData({ ...refundData, deductionAmount: e.target.value })
                }
              />
            </div>

            <Input
              label="Reason for Deductions (if any)"
              placeholder="e.g. Repaired bathroom faucet"
              value={refundData.deductionReason}
              onChange={(e) =>
                setRefundData({ ...refundData, deductionReason: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Payment Method"
                value={refundData.paymentMethod}
                onChange={(e) =>
                  setRefundData({ ...refundData, paymentMethod: e.target.value })
                }
                options={[
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Bank Transfer', label: 'Bank Transfer' },
                  { value: 'Cash', label: 'Cash' },
                ]}
              />
              <Input
                label="Txn Reference"
                placeholder="UPI ref / bank utr"
                value={refundData.transactionRef}
                onChange={(e) =>
                  setRefundData({ ...refundData, transactionRef: e.target.value })
                }
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsRefundOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
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

