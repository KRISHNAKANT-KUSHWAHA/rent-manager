import React, { useState, useEffect } from 'react';
import { getExpenses, createExpense, deleteExpense } from '../api/expenseApi';
import { getRooms } from '../api/roomApi';
import { useToast } from '../context/ToastContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../utils/constants';
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
  BadgePercent,
  Plus,
  Receipt,
  Home,
  Trash2,
  FileText,
  Calendar,
  Wrench,
  Paperclip,
} from 'lucide-react';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const initialFormState = {
    title: '',
    category: 'Maintenance',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    roomId: '',
    paidTo: '',
    paymentMethod: 'Cash',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [receiptFile, setReceiptFile] = useState(null);

  const toast = useToast();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await getExpenses({
        category: categoryFilter,
        roomId: roomFilter,
      });
      if (res.success) {
        setExpenses(res.expenses);
        setTotalAmount(res.totalAmount);
      }
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsList = async () => {
    try {
      const res = await getRooms();
      if (res.success) setRooms(res.rooms);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchRoomsList();
  }, [categoryFilter, roomFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });
      if (receiptFile) {
        data.append('receipt', receiptFile);
      }

      await createExpense(data);
      toast.success('Expense recorded successfully');
      setIsFormOpen(false);
      setFormData(initialFormState);
      setReceiptFile(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await deleteExpense(id);
      toast.success('Expense removed');
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="House Maintenance & Expenses"
        subtitle="Track plumbing, repairs, cleaning, fixtures, taxes, and general upkeep for the single property."
      >
        <Button variant="brand" icon={Plus} onClick={() => setIsFormOpen(true)}>
          Record New Expense
        </Button>
      </PageHeader>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Maintenance Spent"
          value={formatCurrency(totalAmount)}
          subtitle="Cumulative property expenditure"
          icon={BadgePercent}
          iconBg="bg-rose-50 text-rose-700"
        />
        <StatCard
          title="Total Expense Records"
          value={expenses.length}
          subtitle="Logged maintenance tasks"
          icon={Wrench}
          iconBg="bg-slate-100 text-slate-700"
        />
        <StatCard
          title="Monitored Property"
          value="Single House"
          subtitle="Direct owner accounts"
          icon={Home}
          iconBg="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Filter and Overview Bar */}
      <SearchFilterBar
        filters={[
          {
            id: 'category',
            label: 'Category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { value: 'all', label: 'All Categories' },
              ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
            ],
          },
          {
            id: 'room',
            label: 'Room',
            value: roomFilter,
            onChange: setRoomFilter,
            options: [
              { value: 'all', label: 'Whole House / Rooms' },
              ...rooms.map((r) => ({ value: r._id, label: r.roomNumber })),
            ],
          },
        ]}
        onReset={() => {
          setCategoryFilter('all');
          setRoomFilter('all');
        }}
      />

      {/* Expenses Table */}
      <Table
        headers={[
          'Expense Title',
          'Category',
          'Related Room',
          'Date',
          'Paid To & Method',
          'Amount',
          { label: 'Receipt / Action', align: 'right' },
        ]}
        loading={loading}
        empty={expenses.length === 0}
        emptyTitle="No expenses recorded"
        emptyMessage="Add plumbing, electrical, or cleaning maintenance costs."
        emptyIcon={Wrench}
        emptyAction={
          <Button size="sm" variant="brand" onClick={() => setIsFormOpen(true)}>
            Record Expense
          </Button>
        }
      >
        {expenses.map((exp) => (
          <tr key={exp._id} className="hover:bg-slate-50/60 transition">
            <td className="py-4 px-4 sm:px-5">
              <div className="font-bold text-slate-900 text-sm">{exp.title}</div>
              {exp.description && (
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {exp.description}
                </div>
              )}
            </td>

            <td className="py-4 px-4 sm:px-5">
              <Badge variant="slate">{exp.category}</Badge>
            </td>

            <td className="py-4 px-4 sm:px-5 text-slate-700 font-semibold text-xs">
              {exp.room ? exp.room.roomNumber : 'Whole House / Common'}
            </td>

            <td className="py-4 px-4 sm:px-5 text-slate-600 font-medium text-xs">
              {formatDate(exp.date)}
            </td>

            <td className="py-4 px-4 sm:px-5">
              <span className="font-bold text-slate-800 text-xs">
                {exp.paidTo || 'Local Vendor'}
              </span>
              <span className="block text-[11px] text-slate-400">via {exp.paymentMethod}</span>
            </td>

            <td className="py-4 px-4 sm:px-5 font-black text-rose-600 text-sm tabular-nums">
              {formatCurrency(exp.amount)}
            </td>

            <td className="py-4 px-4 sm:px-5 text-right">
              <div className="flex items-center justify-end gap-1.5">
                {exp.receiptAttachment ? (
                  <a
                    href={`/${exp.receiptAttachment}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                    title="View Receipt Attachment"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-slate-300 text-xs">—</span>
                )}

                <button
                  onClick={() => handleDelete(exp._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Record Property Maintenance Expense"
        subtitle="Log material or labour repair expenses for this house."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Expense Title"
            required
            placeholder="e.g. Bathroom tap replacement, terrace waterproofing"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Expense Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={EXPENSE_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
            />
            <Input
              label="Amount (INR)"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              placeholder="e.g. 1200"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: e.target.value.replace(/[^0-9]/g, ''),
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expense Date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <Select
              label="Related Room (Optional)"
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
            >
              <option value="">Entire House / Common Area</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roomNumber} ({r.floorName || `Floor ${r.floor}`})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Paid To (Vendor/Contractor)"
              placeholder="e.g. Ramesh Plumber"
              value={formData.paidTo}
              onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
            />
            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={PAYMENT_METHODS}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              placeholder="Details about parts replaced, guarantee period..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attach Receipt Bill (Optional)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setReceiptFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" loading={submitting}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
