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
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import {
  Receipt,
  Plus,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
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
      toast.error(err.response?.data?.message || 'Error recording payment');
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amountPaid: invoice.remainingBalance || invoice.rentAmount,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'UPI',
      transactionReference: '',
      notes: '',
    });
    setIsPaymentOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rent Collection & Invoices"
        subtitle="Generate monthly rent dues, record full or partial payments, and issue official PDF receipts."
      >
        <Button
          variant="secondary"
          icon={Sparkles}
          onClick={() => setIsGenerateOpen(true)}
        >
          Generate Monthly Invoices
        </Button>
      </PageHeader>

      {/* Tab Switcher & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'invoices'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Monthly Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Payment Receipts History ({payments.length})
          </button>
        </div>

        {activeTab === 'invoices' && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-40">
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
            <div className="w-40">
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Invoices Table */}
      {activeTab === 'invoices' && (
        <>
          {loading ? (
            <Skeleton className="h-64" count={3} />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices found for this criteria"
              description="Click 'Generate Monthly Invoices' to create rent dues for all active tenants."
              actionLabel="Generate Now"
              onAction={() => setIsGenerateOpen(true)}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-4 px-6">Invoice Ref & Month</th>
                      <th className="py-4 px-6">Tenant & Room</th>
                      <th className="py-4 px-6">Rent Amount</th>
                      <th className="py-4 px-6">Previous Dues</th>
                      <th className="py-4 px-6">Total Due</th>
                      <th className="py-4 px-6">Amount Paid</th>
                      <th className="py-4 px-6">Remaining</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                          <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                            Month: {formatMonth(inv.billingMonth)}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">
                            {inv.tenant?.fullName || 'Tenant'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {inv.room?.roomNumber} • Due: {formatDate(inv.dueDate)}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {formatCurrency(inv.rentAmount)}
                        </td>

                        <td className="py-4 px-6 text-slate-500">
                          {formatCurrency(inv.previousBalance)}
                        </td>

                        <td className="py-4 px-6 font-bold text-slate-900">
                          {formatCurrency(inv.totalDue)}
                        </td>

                        <td className="py-4 px-6 font-bold text-emerald-600">
                          {formatCurrency(inv.amountPaid)}
                        </td>

                        <td className="py-4 px-6 font-black text-rose-600">
                          {formatCurrency(inv.remainingBalance)}
                        </td>

                        <td className="py-4 px-6">
                          <Badge status={inv.status} />
                        </td>

                        <td className="py-4 px-6 text-right">
                          {inv.status !== 'Paid' ? (
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() => openPaymentModal(inv)}
                            >
                              Collect Rent
                            </Button>
                          ) : (
                            <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Paid
                            </span>
                          )}
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

      {/* Payments History Table */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Receipt Number</th>
                  <th className="py-4 px-6">Payment Date</th>
                  <th className="py-4 px-6">Tenant Name</th>
                  <th className="py-4 px-6">Room Number</th>
                  <th className="py-4 px-6">Amount Paid</th>
                  <th className="py-4 px-6">Method & Ref</th>
                  <th className="py-4 px-6 text-right">Receipt PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {p.tenant?.fullName}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {p.room?.roomNumber}
                    </td>
                    <td className="py-4 px-6 font-black text-emerald-600 text-sm">
                      +{formatCurrency(p.amountPaid)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                      {p.transactionReference && (
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {p.transactionReference}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href={`/api/rent/receipts/${p._id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print PDF Receipt</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">Total Invoice Due</span>
                <span className="font-black text-slate-900 text-base">
                  {formatCurrency(selectedInvoice.totalDue)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Current Balance</span>
                <span className="font-black text-rose-600 text-base">
                  {formatCurrency(selectedInvoice.remainingBalance)}
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
              label="Transaction Reference / UPI ID"
              placeholder="e.g. UPI/HDFC/8821992"
              value={paymentForm.transactionReference}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, transactionReference: e.target.value })
              }
            />

            <Input
              label="Remarks / Notes"
              placeholder="e.g. Received via GPay, rent cleared"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Save Payment & Issue Receipt
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Generate Invoices Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate Monthly Rent Invoices"
        subtitle="Generates rent dues for all active room agreements. Existing invoices for the selected month will not be duplicated."
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

          <p className="text-xs text-slate-500 leading-relaxed">
            The system will automatically calculate previous outstanding arrears for each tenant, generate unique invoice numbers, and assign due dates according to room contracts.
          </p>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Generate Invoices
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RentPage;

