import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getMeters,
  getReadings,
  getBills,
  recordReading,
  recordElectricityPayment,
} from '../api/electricityApi';
import { getRooms } from '../api/roomApi';
import { useToast } from '../context/ToastContext';
import { formatDate, formatCurrency, formatMonth } from '../utils/formatters';
import { PAYMENT_METHODS } from '../utils/constants';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import {
  Zap,
  Plus,
  Receipt,
  FileText,
  Printer,
  History,
  CheckCircle,
  AlertCircle,
  Camera,
  Coins,
} from 'lucide-react';

const ElectricityPage = () => {
  const [meters, setMeters] = useState([]);
  const [readings, setReadings] = useState([]);
  const [bills, setBills] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bills'); // 'bills' | 'readings' | 'meters'
  const [statusFilter, setStatusFilter] = useState('all');

  const [searchParams] = useSearchParams();

  // Modals
  const [isReadingOpen, setIsReadingOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Meter Reading Form
  const [readingForm, setReadingForm] = useState({
    roomId: '',
    meterNumber: '',
    billingMonth: new Date().toISOString().slice(0, 7),
    currentReading: '',
    readingDate: new Date().toISOString().slice(0, 10),
    ratePerUnit: 9.5,
    notes: '',
  });
  const [readingPhoto, setReadingPhoto] = useState(null);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'UPI',
    transactionReference: '',
    notes: '',
  });

  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, rRes, bRes, rmRes] = await Promise.all([
        getMeters(),
        getReadings(),
        getBills({ status: statusFilter }),
        getRooms(),
      ]);

      if (mRes.success) setMeters(mRes.meters);
      if (rRes.success) setReadings(rRes.readings);
      if (bRes.success) setBills(bRes.bills);
      if (rmRes.success) setRooms(rmRes.rooms);
    } catch (err) {
      toast.error('Failed to load electricity records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (searchParams.get('new') === 'true') {
      setIsReadingOpen(true);
    }
  }, [statusFilter]);

  const handleRoomSelect = (roomId) => {
    const selectedRoom = rooms.find((r) => r._id === roomId);
    setReadingForm((prev) => ({
      ...prev,
      roomId,
      meterNumber: selectedRoom?.electricityMeterNumber || `MTR-${selectedRoom?.roomNumber || ''}`,
    }));
  };

  const handleReadingSubmit = async (e) => {
    e.preventDefault();
    if (!readingForm.roomId || !readingForm.currentReading) {
      toast.error('Room and current meter reading are required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(readingForm).forEach((key) => {
        formData.append(key, readingForm[key]);
      });
      if (readingPhoto) {
        formData.append('meterPhoto', readingPhoto);
      }

      const res = await recordReading(formData);
      toast.success(res.message || 'Meter reading recorded & bill generated');
      setIsReadingOpen(false);
      setReadingPhoto(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording meter reading');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    setSubmitting(true);
    try {
      const res = await recordElectricityPayment({
        billId: selectedBill._id,
        ...paymentForm,
      });
      toast.success(res.message || 'Electricity payment recorded!');
      setIsPaymentOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Electricity Sub-Meter Management"
        subtitle="Record monthly sub-meter readings, automatically calculate consumption charges, and manage electricity billing."
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setReadingForm({
              roomId: '',
              meterNumber: '',
              billingMonth: new Date().toISOString().slice(0, 7),
              currentReading: '',
              readingDate: new Date().toISOString().slice(0, 10),
              ratePerUnit: 9.5,
              notes: '',
            });
            setIsReadingOpen(true);
          }}
        >
          Record Meter Reading
        </Button>
      </PageHeader>

      {/* Tab Switcher & Status Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'bills'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Electricity Bills ({bills.length})
          </button>
          <button
            onClick={() => setActiveTab('readings')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'readings'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Meter Readings History ({readings.length})
          </button>
          <button
            onClick={() => setActiveTab('meters')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'meters'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sub-Meters ({meters.length})
          </button>
        </div>

        {activeTab === 'bills' && (
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Partially Paid', label: 'Partially Paid' },
                { value: 'Paid', label: 'Paid' },
                { value: 'Overdue', label: 'Overdue' },
              ]}
            />
          </div>
        )}
      </div>

      {/* TAB 1: Electricity Bills */}
      {activeTab === 'bills' && (
        <>
          {loading ? (
            <Skeleton className="h-64" count={3} />
          ) : bills.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No electricity bills found"
              description="Record a monthly meter reading to generate electricity bills."
              actionLabel="Record Reading"
              onAction={() => setIsReadingOpen(true)}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-4 px-6">Bill Ref & Month</th>
                      <th className="py-4 px-6">Room & Tenant</th>
                      <th className="py-4 px-6">Readings & Units</th>
                      <th className="py-4 px-6">Unit Rate</th>
                      <th className="py-4 px-6">Total Due</th>
                      <th className="py-4 px-6">Paid</th>
                      <th className="py-4 px-6">Balance</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((bill) => (
                      <tr key={bill._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 font-mono">
                          <div className="font-bold text-slate-900">{bill.billNumber}</div>
                          <div className="text-[11px] text-amber-700 font-sans font-bold">
                            {formatMonth(bill.billingMonth)}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">
                            {bill.tenant?.fullName || 'Resident'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {bill.room?.roomNumber} • Meter: {bill.meterNumber}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">
                            {bill.unitsConsumed} Units
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {bill.previousReading} → {bill.currentReading}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-medium text-slate-600">
                          ₹{bill.ratePerUnit}/unit
                        </td>

                        <td className="py-4 px-6 font-bold text-slate-900">
                          {formatCurrency(bill.totalDue)}
                        </td>

                        <td className="py-4 px-6 font-bold text-emerald-600">
                          {formatCurrency(bill.amountPaid)}
                        </td>

                        <td className="py-4 px-6 font-black text-rose-600">
                          {formatCurrency(bill.remainingBalance)}
                        </td>

                        <td className="py-4 px-6">
                          <Badge status={bill.status} />
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {bill.status !== 'Paid' && (
                              <Button
                                size="xs"
                                variant="primary"
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setPaymentForm({
                                    amountPaid: bill.remainingBalance,
                                    paymentDate: new Date().toISOString().slice(0, 10),
                                    paymentMethod: 'UPI',
                                    transactionReference: '',
                                    notes: '',
                                  });
                                  setIsPaymentOpen(true);
                                }}
                              >
                                Collect
                              </Button>
                            )}
                            <a
                              href={`/api/electricity/bills/${bill._id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                              title="Download Electricity Bill PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: Historical Readings */}
      {activeTab === 'readings' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Month & Date</th>
                  <th className="py-4 px-6">Room No</th>
                  <th className="py-4 px-6">Meter Number</th>
                  <th className="py-4 px-6">Previous</th>
                  <th className="py-4 px-6">Current</th>
                  <th className="py-4 px-6">Units Consumed</th>
                  <th className="py-4 px-6">Calculated Charge</th>
                  <th className="py-4 px-6 text-right">Photo / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{r.billingMonth}</div>
                      <div className="text-[11px] text-slate-400">
                        {formatDate(r.readingDate)}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {r.room?.roomNumber}
                    </td>
                    <td className="py-4 px-6 font-mono text-amber-700 font-bold">
                      {r.meterNumber}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-500">
                      {r.previousReading}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {r.currentReading}
                    </td>
                    <td className="py-4 px-6 font-black text-indigo-600 text-sm">
                      {r.unitsConsumed} units
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {formatCurrency(r.calculatedAmount)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {r.photoUrl ? (
                        <a
                          href={r.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          View Photo
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Meters List */}
      {activeTab === 'meters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {meters.map((meter) => (
            <div
              key={meter._id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    {meter.meterNumber}
                  </span>
                  <Badge variant="emerald">Active</Badge>
                </div>
                <h4 className="text-base font-black text-slate-900 mt-3">
                  Room: {meter.room?.roomNumber}
                </h4>
                <div className="text-xs text-slate-500 mt-1">
                  Type: Sub-meter • Rate: ₹{meter.ratePerUnit}/unit
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Reading:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {meter.currentReading} units
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Installed: {formatDate(meter.installationDate)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Meter Reading Modal */}
      <Modal
        isOpen={isReadingOpen}
        onClose={() => setIsReadingOpen(false)}
        title="Record Monthly Sub-Meter Reading"
        subtitle="Formula: Units Consumed = (Current Reading - Previous Reading). Charge = Units × Rate."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleReadingSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Select Room"
              required
              value={readingForm.roomId}
              onChange={(e) => handleRoomSelect(e.target.value)}
            >
              <option value="">-- Choose Room --</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roomNumber} ({r.floorName}) - {r.status}
                </option>
              ))}
            </Select>

            <Input
              label="Meter Number"
              placeholder="e.g. MTR-101"
              value={readingForm.meterNumber}
              onChange={(e) =>
                setReadingForm({ ...readingForm, meterNumber: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Billing Month"
              type="month"
              required
              value={readingForm.billingMonth}
              onChange={(e) =>
                setReadingForm({ ...readingForm, billingMonth: e.target.value })
              }
            />
            <Input
              label="Reading Date"
              type="date"
              required
              value={readingForm.readingDate}
              onChange={(e) =>
                setReadingForm({ ...readingForm, readingDate: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Current Meter Reading (Units)"
              type="number"
              required
              placeholder="e.g. 1395"
              value={readingForm.currentReading}
              onChange={(e) =>
                setReadingForm({ ...readingForm, currentReading: e.target.value })
              }
            />
            <Input
              label="Rate Per Unit (INR)"
              type="number"
              step="0.1"
              required
              value={readingForm.ratePerUnit}
              onChange={(e) =>
                setReadingForm({ ...readingForm, ratePerUnit: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Upload Meter Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100"
              onChange={(e) => setReadingPhoto(e.target.files[0])}
            />
          </div>

          <Input
            label="Notes / Inspection Remarks"
            placeholder="e.g. Sub-meter display verified, seal intact"
            value={readingForm.notes}
            onChange={(e) => setReadingForm({ ...readingForm, notes: e.target.value })}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsReadingOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Calculate & Generate Bill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Electricity Payment Modal */}
      {selectedBill && (
        <Modal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          title={`Collect Electricity Bill - ${selectedBill.room?.roomNumber}`}
          subtitle={`Bill No: ${selectedBill.billNumber} • Month: ${selectedBill.billingMonth}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-amber-800 block">Bill Due Amount</span>
                <span className="font-black text-amber-950 text-base">
                  {formatCurrency(selectedBill.totalDue)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-amber-800 block">Pending Balance</span>
                <span className="font-black text-rose-700 text-base">
                  {formatCurrency(selectedBill.remainingBalance)}
                </span>
              </div>
            </div>

            <Input
              label="Amount Paid (INR)"
              type="number"
              required
              min="1"
              value={paymentForm.amountPaid}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amountPaid: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Payment Date"
                type="date"
                required
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                }
              />
              <Select
                label="Payment Method"
                value={paymentForm.paymentMethod}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })
                }
                options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
              />
            </div>

            <Input
              label="Transaction Ref / Note"
              placeholder="e.g. UPI / Cash received"
              value={paymentForm.transactionReference}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  transactionReference: e.target.value,
                })
              }
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Save Electricity Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ElectricityPage;

