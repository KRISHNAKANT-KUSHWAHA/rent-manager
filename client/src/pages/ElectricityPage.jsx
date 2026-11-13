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
import Table from '../components/common/Table';
import StatCard from '../components/common/StatCard';
import SearchFilterBar from '../components/common/SearchFilterBar';
import {
  Zap,
  Plus,
  Receipt,
  FileText,
  Printer,
  History,
  CheckCircle,
  Camera,
  Coins,
  Gauge,
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

  // Handle Room Selection for Reading
  const handleRoomSelect = (roomId) => {
    const selectedRoom = rooms.find((r) => r._id === roomId);
    if (selectedRoom) {
      const meter = meters.find((m) => m.room?._id === roomId);
      setReadingForm({
        ...readingForm,
        roomId,
        meterNumber: selectedRoom.electricityMeterNumber || meter?.meterNumber || '',
        ratePerUnit: meter?.ratePerUnit || 9.5,
      });
    }
  };

  const handleRecordReading = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.keys(readingForm).forEach((key) => {
        data.append(key, readingForm[key]);
      });
      if (readingPhoto) {
        data.append('photo', readingPhoto);
      }

      const res = await recordReading(data);
      toast.success(res.message || 'Meter reading and electricity bill generated!');
      setIsReadingOpen(false);
      setReadingPhoto(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record meter reading');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
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

  // Summaries
  const totalBilled = bills.reduce((acc, b) => acc + (b.totalDue || 0), 0);
  const totalCollected = bills.reduce((acc, b) => acc + (b.amountPaid || 0), 0);
  const totalPending = bills.reduce((acc, b) => acc + (b.remainingBalance || 0), 0);
  const totalUnits = bills.reduce((acc, b) => acc + (b.unitsConsumed || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Electricity Management"
        subtitle="Record monthly sub-meter readings, calculate exact consumption (Units × Rate), and track utility bills."
      >
        <Button
          variant="brand"
          icon={Plus}
          onClick={() => {
            if (rooms.length > 0) handleRoomSelect(rooms[0]._id);
            setIsReadingOpen(true);
          }}
        >
          Record Meter Reading
        </Button>
      </PageHeader>

      {/* Electricity KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Consumption"
          value={`${totalUnits} Units`}
          subtitle="Billed across sub-meters"
          icon={Zap}
          iconBg="bg-teal-50 text-teal-700"
        />
        <StatCard
          title="Total Billed"
          value={formatCurrency(totalBilled)}
          subtitle={`${bills.length} monthly bills`}
          icon={Receipt}
          iconBg="bg-slate-100 text-slate-700"
        />
        <StatCard
          title="Collected"
          value={formatCurrency(totalCollected)}
          subtitle={
            totalBilled
              ? `${Math.round((totalCollected / totalBilled) * 100)}% Recovered`
              : '0%'
          }
          icon={CheckCircle}
          iconBg="bg-orange-50 text-orange-600"
          trendType="positive"
        />
        <StatCard
          title="Pending Arrears"
          value={formatCurrency(totalPending)}
          subtitle="Uncollected utility charges"
          icon={Coins}
          iconBg="bg-amber-50 text-amber-800"
          trendType={totalPending > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto whitespace-nowrap no-scrollbar">
        <button
          onClick={() => setActiveTab('bills')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'bills'
              ? 'bg-slate-900 text-white shadow-soft-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Electricity Bills ({bills.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('readings')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'readings'
              ? 'bg-slate-900 text-white shadow-soft-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Reading History ({readings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('meters')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'meters'
              ? 'bg-slate-900 text-white shadow-soft-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Sub-Meters ({meters.length})</span>
        </button>
      </div>

      {/* TAB 1: Electricity Bills */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <SearchFilterBar
            filters={[
              {
                id: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Partially Paid', label: 'Partially Paid' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Overdue', label: 'Overdue' },
                ],
              },
            ]}
            onReset={() => setStatusFilter('all')}
          />

          <Table
            headers={[
              'Bill Ref & Month',
              'Room & Resident',
              'Units Consumed',
              'Unit Rate',
              'Total Due',
              'Paid',
              'Balance',
              'Status',
              { label: 'Actions', align: 'right' },
            ]}
            loading={loading}
            empty={bills.length === 0}
            emptyTitle="No electricity bills found"
            emptyMessage="Record a monthly meter reading to generate electricity bills."
            emptyIcon={Zap}
            emptyAction={
              <Button size="sm" variant="brand" onClick={() => setIsReadingOpen(true)}>
                Record Reading
              </Button>
            }
          >
            {bills.map((bill) => (
              <tr key={bill._id} className="hover:bg-slate-50/60 transition">
                <td className="py-4 px-4 sm:px-5 font-mono">
                  <div className="font-bold text-slate-900">{bill.billNumber}</div>
                  <div className="text-[11px] text-teal-700 font-sans font-bold">
                    {formatMonth(bill.billingMonth)}
                  </div>
                </td>

                <td className="py-4 px-4 sm:px-5">
                  <div className="font-bold text-slate-800">
                    {bill.tenant?.fullName || 'Resident'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {bill.room?.roomNumber} • Meter: {bill.meterNumber}
                  </div>
                </td>

                <td className="py-4 px-4 sm:px-5">
                  <div className="font-bold text-slate-900 tabular-nums">
                    {bill.unitsConsumed} Units
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {bill.previousReading} → {bill.currentReading}
                  </div>
                </td>

                <td className="py-4 px-4 sm:px-5 font-medium text-slate-600 tabular-nums">
                  ₹{bill.ratePerUnit}/unit
                </td>

                <td className="py-4 px-4 sm:px-5 font-bold text-slate-900 tabular-nums">
                  {formatCurrency(bill.totalDue)}
                </td>

                <td className="py-4 px-4 sm:px-5 font-bold text-slate-800 tabular-nums">
                  {formatCurrency(bill.amountPaid)}
                </td>

                <td className="py-4 px-4 sm:px-5 font-black text-rose-600 tabular-nums">
                  {formatCurrency(bill.remainingBalance)}
                </td>

                <td className="py-4 px-4 sm:px-5">
                  <Badge status={bill.status} />
                </td>

                <td className="py-4 px-4 sm:px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {bill.status !== 'Paid' && (
                      <Button
                        size="xs"
                        variant="brand"
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
          </Table>
        </div>
      )}

      {/* TAB 2: Meter Readings History */}
      {activeTab === 'readings' && (
        <Table
          headers={[
            'Reading Date',
            'Room & Meter',
            'Billing Month',
            'Previous Reading',
            'Current Reading',
            'Net Consumption',
            'Photo / Evidence',
          ]}
          loading={loading}
          empty={readings.length === 0}
          emptyTitle="No meter readings recorded"
          emptyMessage="Recorded monthly meter readings will be listed here."
          emptyIcon={History}
        >
          {readings.map((r) => (
            <tr key={r._id} className="hover:bg-slate-50/60 transition">
              <td className="py-4 px-4 sm:px-5 text-slate-700 font-medium">
                {formatDate(r.readingDate)}
              </td>
              <td className="py-4 px-4 sm:px-5">
                <div className="font-bold text-slate-900">{r.room?.roomNumber}</div>
                <div className="text-[11px] text-slate-400 font-mono">{r.meterNumber}</div>
              </td>
              <td className="py-4 px-4 sm:px-5 font-semibold text-slate-700">
                {formatMonth(r.billingMonth)}
              </td>
              <td className="py-4 px-4 sm:px-5 font-mono text-slate-600 tabular-nums">
                {r.previousReading}
              </td>
              <td className="py-4 px-4 sm:px-5 font-mono font-bold text-slate-900 tabular-nums">
                {r.currentReading}
              </td>
              <td className="py-4 px-4 sm:px-5 font-black text-teal-700 tabular-nums">
                {r.unitsConsumed} Units
              </td>
              <td className="py-4 px-4 sm:px-5">
                {r.readingPhoto ? (
                  <a
                    href={`/${r.readingPhoto}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-bold"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>View Meter Photo</span>
                  </a>
                ) : (
                  <span className="text-slate-400 text-xs italic">No photo attached</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* TAB 3: Sub-Meters */}
      {activeTab === 'meters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {meters.map((meter) => (
            <div
              key={meter._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-sm hover:shadow-soft transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Assigned Sub-Meter
                  </span>
                  <h4 className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {meter.meterNumber}
                  </h4>
                </div>
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Gauge className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Room:</span>
                  <span className="font-bold text-slate-800">{meter.room?.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Reading:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {meter.currentReading}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rate/Unit:</span>
                  <span className="font-bold text-slate-800">₹{meter.ratePerUnit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Reading Modal */}
      <Modal
        isOpen={isReadingOpen}
        onClose={() => setIsReadingOpen(false)}
        title="Record Monthly Meter Reading"
        subtitle="Calculates consumption: (Current - Previous) × Rate per unit."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRecordReading} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Select Room"
              required
              value={readingForm.roomId}
              onChange={(e) => handleRoomSelect(e.target.value)}
              options={[
                { value: '', label: '-- Choose Room --' },
                ...rooms.map((r) => ({
                  value: r._id,
                  label: `${r.roomNumber} (${r.electricityMeterNumber || 'No meter'})`,
                })),
              ]}
            />

            <Input
              label="Meter Serial / Number"
              value={readingForm.meterNumber}
              disabled
              placeholder="Auto-filled from room"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Current Meter Reading"
              type="text"
              inputMode="decimal"
              required
              placeholder="e.g. 1420"
              value={readingForm.currentReading}
              onChange={(e) =>
                setReadingForm({
                  ...readingForm,
                  currentReading: e.target.value.replace(/[^0-9.]/g, ''),
                })
              }
            />

            <Input
              label="Electricity Rate (₹/Unit)"
              type="text"
              inputMode="decimal"
              required
              value={readingForm.ratePerUnit}
              onChange={(e) =>
                setReadingForm({
                  ...readingForm,
                  ratePerUnit: e.target.value.replace(/[^0-9.]/g, ''),
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Meter Photo (Optional verification)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setReadingPhoto(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsReadingOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" loading={submitting}>
              Generate Bill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Collect Payment Modal */}
      {selectedBill && (
        <Modal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          title={`Electricity Payment - ${selectedBill.room?.roomNumber}`}
          subtitle={`Bill: ${selectedBill.billNumber} • Month: ${selectedBill.billingMonth}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Remaining Balance:</span>
                <div className="text-base font-black text-rose-600 tabular-nums">
                  {formatCurrency(selectedBill.remainingBalance)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Units Consumed:</span>
                <div className="font-bold text-slate-800 tabular-nums">
                  {selectedBill.unitsConsumed} Units
                </div>
              </div>
            </div>

            <Input
              label="Amount Paid Now (₹)"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={paymentForm.amountPaid}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  amountPaid: e.target.value.replace(/[^0-9]/g, ''),
                })
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Payment Date"
                type="date"
                required
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              />
              <Select
                label="Payment Method"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                options={PAYMENT_METHODS}
              />
            </div>

            <Input
              label="Transaction Reference (Optional)"
              placeholder="e.g. UPI/1283719"
              value={paymentForm.transactionReference}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, transactionReference: e.target.value })
              }
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={submitting}>
                Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ElectricityPage;
