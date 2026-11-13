import React, { useState, useEffect } from 'react';
import {
  getInvoices,
  generateMonthlyInvoices,
  recordRentPayment,
  getRentPayments,
} from '../api/rentApi';
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
  Receipt,
  Plus,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  History,
  Printer,
  Sparkles,
} from 'lucide-react';

const RentPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'payments'
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [generateMonth, setGenerateMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'UPI',
    transactionReference: '',
    notes: '',
  });

  const toast = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await getInvoices({
        status: statusFilter,
        month: monthFilter,
      });
      if (res.success) {
        setInvoices(res.invoices);
      }
    } catch (err) {
      toast.error('Failed to load rent invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await getRentPayments();
      if (res.success) {
        setPayments(res.payments);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchPayments();
  }, [statusFilter, monthFilter]);

  const handleGenerateInvoices = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await generateMonthlyInvoices(generateMonth);
      toast.success(res.message);
      setIsGenerateOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invoice generation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);

    try {
      const res = await recordRentPayment({
        invoiceId: selectedInvoice._id,
        ...paymentForm,
      });
      toast.success(res.message || 'Rent payment recorded!');
      setIsPaymentOpen(false);
      fetchInvoices();
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record rent payment');
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amountPaid: invoice.remainingBalance || '',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'UPI',
      transactionReference: '',
      notes: '',
    });
    setIsPaymentOpen(true);
  };

  // Quick metrics calculations
  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalDue || 0), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
  const totalRemaining = invoices.reduce((acc, i) => acc + (i.remainingBalance || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Rent Collection & Invoices"
        subtitle="Generate monthly dues, record partial or full payments, and download official PDF rent receipts."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={Sparkles}
            onClick={() => setIsGenerateOpen(true)}
          >
            Generate Monthly Invoices
          </Button>
        </div>
      </PageHeader>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(totalInvoiced)}
          subtitle={`${invoices.length} active invoices`}
          icon={Receipt}
          iconBg="bg-slate-100 text-slate-700"
        />
        <StatCard
          title="Rent Collected"
          value={formatCurrency(totalCollected)}
          subtitle={
            totalInvoiced
              ? `${Math.round((totalCollected / totalInvoiced) * 100)}% Collection Rate`
              : '0%'
          }
          icon={CheckCircle}
          iconBg="bg-orange-50 text-orange-600"
          trendType="positive"
        />
        <StatCard
          title="Remaining Dues"
          value={formatCurrency(totalRemaining)}
          subtitle="Pending collection"
          icon={Clock}
          iconBg="bg-amber-50 text-amber-800"
          trendType={totalRemaining > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto whitespace-nowrap no-scrollbar">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-soft-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Rent Invoices ({invoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white shadow-soft-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Payment History ({payments.length})</span>
        </button>
      </div>

      {/* Invoices Tab View */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <SearchFilterBar
            placeholder="Search tenant or invoice..."
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
            onReset={() => {
              setStatusFilter('all');
              setMonthFilter('');
            }}
          >
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </SearchFilterBar>

          <Table
            headers={[
              'Invoice #',
              'Tenant & Room',
              'Rent Amount',
              'Previous Dues',
              'Total Due',
              'Amount Paid',
              'Remaining',
              'Status',
              { label: 'Action', align: 'right' },
            ]}
            loading={loading}
            empty={invoices.length === 0}
            emptyTitle="No rent invoices found"
            emptyMessage="Generate monthly invoices or change your filter."
            emptyIcon={Receipt}
            emptyAction={
              <Button size="sm" variant="brand" onClick={() => setIsGenerateOpen(true)}>
                Generate Invoices
              </Button>
            }
          >
            {invoices.map((inv) => (
              <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                <td className="py-4 px-4 sm:px-5">
                  <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-orange-600 font-semibold mt-0.5">
                    {formatMonth(inv.billingMonth)}
                  </div>
                </td>

                <td className="py-4 px-4 sm:px-5">
                  <div className="font-bold text-slate-800">
                    {inv.tenant?.fullName || 'Tenant'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {inv.room?.roomNumber} • Due: {formatDate(inv.dueDate)}
                  </div>
                </td>

                <td className="py-4 px-4 sm:px-5 font-semibold text-slate-800 tabular-nums">
                  {formatCurrency(inv.rentAmount)}
                </td>

                <td className="py-4 px-4 sm:px-5 text-slate-500 tabular-nums">
                  {formatCurrency(inv.previousBalance)}
                </td>

                <td className="py-4 px-4 sm:px-5 font-bold text-slate-900 tabular-nums">
                  {formatCurrency(inv.totalDue)}
                </td>

                <td className="py-4 px-4 sm:px-5 font-bold text-slate-800 tabular-nums">
                  {formatCurrency(inv.amountPaid)}
                </td>

                <td className="py-4 px-4 sm:px-5 font-black text-rose-600 tabular-nums">
                  {formatCurrency(inv.remainingBalance)}
                </td>

                <td className="py-4 px-4 sm:px-5">
                  <Badge status={inv.status} />
                </td>

                <td className="py-4 px-4 sm:px-5 text-right">
                  {inv.status !== 'Paid' ? (
                    <Button
                      size="xs"
                      variant="brand"
                      onClick={() => openPaymentModal(inv)}
                    >
                      Collect Rent
                    </Button>
                  ) : (
                    <span className="text-emerald-700 font-bold inline-flex items-center gap-1 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Paid
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* Payment History Tab View */}
      {activeTab === 'payments' && (
        <Table
          headers={[
            'Receipt Number',
            'Payment Date',
            'Tenant Name',
            'Room',
            'Amount Paid',
            'Method & Ref',
            { label: 'Receipt PDF', align: 'right' },
          ]}
          loading={loading}
          empty={payments.length === 0}
          emptyTitle="No recorded payments"
          emptyMessage="Collected payments will appear here with official PDF receipts."
          emptyIcon={CreditCard}
        >
          {payments.map((p) => (
            <tr key={p._id} className="hover:bg-slate-50/60 transition">
              <td className="py-4 px-4 sm:px-5 font-mono font-bold text-slate-900">
                {p.receiptNumber}
              </td>
              <td className="py-4 px-4 sm:px-5 text-slate-700 font-medium">
                {formatDate(p.paymentDate)}
              </td>
              <td className="py-4 px-4 sm:px-5 font-bold text-slate-900">
                {p.tenant?.fullName}
              </td>
              <td className="py-4 px-4 sm:px-5 text-slate-700">
                {p.room?.roomNumber}
              </td>
              <td className="py-4 px-4 sm:px-5 font-black text-slate-900 text-sm tabular-nums">
                +{formatCurrency(p.amountPaid)}
              </td>
              <td className="py-4 px-4 sm:px-5">
                <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                {p.transactionReference && (
                  <span className="block text-[11px] text-slate-400 font-mono">
                    {p.transactionReference}
                  </span>
                )}
              </td>
              <td className="py-4 px-4 sm:px-5 text-right">
                <a
                  href={`/api/rent/receipts/${p._id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-soft-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </a>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          title={`Record Rent Payment - ${selectedInvoice.tenant?.fullName}`}
          subtitle={`Invoice: ${selectedInvoice.invoiceNumber} • Month: ${selectedInvoice.billingMonth}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Remaining Due Balance:</span>
                <div className="text-base font-black text-rose-600 tabular-nums">
                  {formatCurrency(selectedInvoice.remainingBalance)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Monthly Rent:</span>
                <div className="font-bold text-slate-800 tabular-nums">
                  {formatCurrency(selectedInvoice.rentAmount)}
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
              placeholder="Enter amount"
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
              label="Transaction / UPI Reference (Optional)"
              placeholder="e.g. UPI/1239847 or Cheque #9821"
              value={paymentForm.transactionReference}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, transactionReference: e.target.value })
              }
            />

            <Input
              label="Private Notes / Remarks (Optional)"
              placeholder="Cash collected in hand / bank transfer"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={submitting}>
                Confirm & Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Generate Monthly Invoices Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate Monthly Rent Dues"
        subtitle="Automatically calculates dues for all active room agreements without modifying past invoices."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleGenerateInvoices} className="space-y-4">
          <Input
            label="Target Billing Month"
            type="month"
            required
            value={generateMonth}
            onChange={(e) => setGenerateMonth(e.target.value)}
          />

          <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-900 leading-relaxed">
            <span className="font-bold">Safe & Idempotent:</span> If an invoice for a room already exists for this billing month, the system skips it to prevent double-billing.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" loading={submitting}>
              Generate Dues
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RentPage;
