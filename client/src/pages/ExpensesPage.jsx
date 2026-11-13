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
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import {
  BadgePercent,
  Plus,
  Search,
  Filter,
  Receipt,
  Home,
  Trash2,
  FileText,
  Calendar,
  Wrench,
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
      Object.keys(formData).forEach((k) => {
        data.append(k, formData[k]);
      });
      if (receiptFile) {
        data.append('receipt', receiptFile);
      }

      const res = await createExpense(data);
      toast.success(res.message || 'Expense recorded successfully');
      setIsFormOpen(false);
      setFormData(initialFormState);
      setReceiptFile(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await deleteExpense(id);
      toast.success(res.message || 'Expense deleted');
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="House Maintenance & Expenses"
        subtitle="Track plumbing, repairs, cleaning, fixtures, taxes, and general upkeep for the single property."
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsFormOpen(true)}>
          Record New Expense
        </Button>
      </PageHeader>

      {/* Filter and Overview Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <BadgePercent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Incurred Expenses
            </span>
            <span className="text-xl font-black text-slate-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-48">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-44">
            <Select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              <option value="all">All House / Rooms</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roomNumber}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <Skeleton className="h-64" count={3} />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No expenses recorded"
          description="Add plumbing, electrical, or cleaning maintenance costs."
          actionLabel="Record Expense"
          onAction={() => setIsFormOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Expense Title</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Related Room</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Paid To & Method</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6 text-right">Receipt / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">{exp.title}</div>
                      {exp.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {exp.description}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant="indigo">{exp.category}</Badge>
                    </td>

                    <td className="py-4 px-6 text-slate-700 font-semibold">
                      {exp.room ? exp.room.roomNumber : 'Whole House / Common'}
                    </td>

                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {formatDate(exp.date)}
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800">
                        {exp.paidTo || 'Local Vendor'}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        via {exp.paymentMethod}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-black text-rose-600 text-sm">
                      {formatCurrency(exp.amount)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {exp.receiptUrl && (
                          <a
                            href={exp.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 transition"
                            title="View Receipt"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(exp._id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Record Property Expense"
        subtitle="Log maintenance, repair, painting, or cleaning costs for the house."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Expense Title"
            required
            placeholder="e.g. Staircase light fixtures replacement"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <Input
              label="Amount (INR)"
              type="number"
              required
              min="1"
              placeholder="1200"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <option value="">Whole House / Common</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roomNumber}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Paid To (Vendor / Person)"
              placeholder="e.g. Ramesh Plumber"
              value={formData.paidTo}
              onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
            />
            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethod: e.target.value })
              }
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            />
          </div>

          <Input
            label="Description / Purpose"
            placeholder="Details of repair work done..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Attach Receipt / Bill Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-800 hover:file:bg-rose-100"
              onChange={(e) => setReceiptFile(e.target.files[0])}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;

