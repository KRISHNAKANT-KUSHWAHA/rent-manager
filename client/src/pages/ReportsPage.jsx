import React, { useState, useEffect } from 'react';
import { getReportsData, getExportCsvUrl } from '../api/reportApi';
import { useToast } from '../context/ToastContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Zap,
  BadgePercent,
  Home,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#64748b'];

const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getReportsData({ year, month });
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [year, month]);

  const { summary, roomPerformance, expenseBreakdown, outstandingInvoices, outstandingElectricity } =
    data || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports & Analytics"
        subtitle="Annual & monthly statements, room performance, maintenance cost breakdown, and CSV exports."
      >
        <div className="flex items-center gap-2">
          <a
            href={getExportCsvUrl('rent')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Rent CSV</span>
          </a>
          <a
            href={getExportCsvUrl('electricity')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
            <span>Export Electricity CSV</span>
          </a>
          <Button
            size="sm"
            variant="secondary"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      </PageHeader>

      {/* Period Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Reporting Period:
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              options={[
                { value: 2026, label: 'Year 2026' },
                { value: 2025, label: 'Year 2025' },
              ]}
            />
          </div>
          <div className="w-36">
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={[
                { value: '', label: 'Whole Year' },
                { value: '1', label: 'January' },
                { value: '2', label: 'February' },
                { value: '3', label: 'March' },
                { value: '4', label: 'April' },
                { value: '5', label: 'May' },
                { value: '6', label: 'June' },
                { value: '7', label: 'July' },
                { value: '8', label: 'August' },
                { value: '9', label: 'September' },
                { value: '10', label: 'October' },
                { value: '11', label: 'November' },
                { value: '12', label: 'December' },
              ]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64" count={3} />
      ) : (
        <div className="space-y-6">
          {/* Key Financial Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Rent Collections"
              value={formatCurrency(summary?.totalRentCollected)}
              subtitle="Received in bank / cash"
              icon={Receipt}
              iconBg="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              title="Electricity Recovery"
              value={formatCurrency(summary?.totalElectricityCollected)}
              subtitle="Sub-meter payments"
              icon={Zap}
              iconBg="bg-amber-50 text-amber-600"
            />
            <StatCard
              title="Maintenance Expenses"
              value={formatCurrency(summary?.totalExpenses)}
              subtitle="Repairs, cleaning & taxes"
              icon={BadgePercent}
              iconBg="bg-rose-50 text-rose-600"
            />
            <StatCard
              title="Net Property Income"
              value={formatCurrency(summary?.netProfit)}
              subtitle="(Gross Income - Expenses)"
              icon={TrendingUp}
              iconBg="bg-emerald-50 text-emerald-600"
              trendType="positive"
            />
          </div>

          {/* Visual Charts: Room-Wise Revenue & Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Room Revenue Performance */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Room-Wise Rental Collection
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Total rent collected across each individual room in this house
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roomPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={(val) => `₹${val / 1000}k`} stroke="#94a3b8" />
                    <YAxis dataKey="roomNumber" type="category" stroke="#94a3b8" width={80} />
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="rentCollected" fill="#4f46e5" radius={[0, 6, 6, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Distribution Pie Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Expense Category Distribution
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Breakdown of maintenance expenditure by type
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {expenseBreakdown &&
                        expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Room Performance Detail Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Detailed Room Accounting Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial performance and operational margin per room
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">Room Number</th>
                    <th className="py-4 px-6">Floor Level</th>
                    <th className="py-4 px-6">Rent Rate</th>
                    <th className="py-4 px-6">Rent Collected</th>
                    <th className="py-4 px-6">Electricity Collected</th>
                    <th className="py-4 px-6">Maintenance Cost</th>
                    <th className="py-4 px-6 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roomPerformance &&
                    roomPerformance.map((room, idx) => {
                      const net =
                        (room.rentCollected || 0) +
                        (room.electricityCollected || 0) -
                        (room.expenseIncurred || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                            {room.roomNumber}
                          </td>
                          <td className="py-4 px-6 text-slate-600">{room.floor}</td>
                          <td className="py-4 px-6 font-semibold text-slate-800">
                            {formatCurrency(room.monthlyRent)}/mo
                          </td>
                          <td className="py-4 px-6 font-bold text-indigo-600">
                            {formatCurrency(room.rentCollected)}
                          </td>
                          <td className="py-4 px-6 font-bold text-amber-600">
                            {formatCurrency(room.electricityCollected)}
                          </td>
                          <td className="py-4 px-6 font-medium text-rose-600">
                            {formatCurrency(room.expenseIncurred)}
                          </td>
                          <td className="py-4 px-6 text-right font-black text-slate-900 text-sm">
                            {formatCurrency(net)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

