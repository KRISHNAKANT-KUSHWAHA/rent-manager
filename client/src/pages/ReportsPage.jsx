import React, { useState, useEffect } from 'react';
import { getReportsData, getExportCsvUrl } from '../api/reportApi';
import { useToast } from '../context/ToastContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import {
  BarChart3,
  Calendar,
  Receipt,
  Zap,
  BadgePercent,
  Home,
  FileSpreadsheet,
  Printer,
  TrendingUp,
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

const COLORS = ['#059669', '#0d9488', '#0284c7', '#d97706', '#64748b', '#8b5cf6'];

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

  const { summary, roomPerformance, expenseBreakdown } = data || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Financial Reports & Analytics"
        subtitle="Annual & monthly statements, room performance, maintenance cost breakdown, and CSV exports."
      >
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={getExportCsvUrl('rent')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-soft-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Rent CSV</span>
          </a>
          <a
            href={getExportCsvUrl('electricity')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-soft-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
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
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Reporting Period:
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 flex-1 sm:flex-none"
          >
            <option value={2026}>Year 2026</option>
            <option value={2025}>Year 2025</option>
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 flex-1 sm:flex-none"
          >
            <option value="">Whole Year</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" count={3} />
      ) : (
        <div className="space-y-6">
          {/* Key Financial Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Rent Collections"
              value={formatCurrency(summary?.totalRentCollected)}
              subtitle="Received in bank / cash"
              icon={Receipt}
              iconBg="bg-orange-50 text-orange-600"
            />
            <StatCard
              title="Electricity Recovery"
              value={formatCurrency(summary?.totalElectricityCollected)}
              subtitle="Sub-meter payments"
              icon={Zap}
              iconBg="bg-teal-50 text-teal-700"
            />
            <StatCard
              title="Maintenance Expenses"
              value={formatCurrency(summary?.totalExpenses)}
              subtitle="Repairs, cleaning & upkeep"
              icon={BadgePercent}
              iconBg="bg-rose-50 text-rose-700"
            />
            <StatCard
              title="Net Property Income"
              value={formatCurrency(summary?.netProfit)}
              subtitle="(Gross Income - Expenses)"
              icon={TrendingUp}
              iconBg="bg-orange-50 text-orange-600"
              trendType="positive"
            />
          </div>

          {/* Visual Charts: Room Revenue & Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Room Revenue Performance */}
            <Card
              title="Room-Wise Rental Collection"
              subtitle="Total rent collected across each individual room in this house"
            >
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
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                      }}
                    />
                    <Bar dataKey="rentCollected" fill="#059669" radius={[0, 6, 6, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Expense Distribution Pie Chart */}
            <Card
              title="Expense Category Distribution"
              subtitle="Breakdown of maintenance expenditure by type"
            >
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
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
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
            </Card>
          </div>

          {/* Room Performance Detail Table */}
          <Card
            title="Detailed Room Accounting Breakdown"
            subtitle="Financial performance and operational margin per room"
            bodyClassName="p-0"
          >
            <Table
              headers={[
                'Room Number',
                'Floor Level',
                'Rent Rate',
                'Rent Collected',
                'Electricity Collected',
                'Maintenance Cost',
                { label: 'Net Revenue', align: 'right' },
              ]}
            >
              {roomPerformance &&
                roomPerformance.map((room, idx) => {
                  const net =
                    (room.rentCollected || 0) +
                    (room.electricityCollected || 0) -
                    (room.expenseIncurred || 0);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 sm:px-5 font-bold text-slate-900 text-sm">
                        {room.roomNumber}
                      </td>
                      <td className="py-4 px-4 sm:px-5 text-slate-600 text-xs">{room.floor}</td>
                      <td className="py-4 px-4 sm:px-5 font-semibold text-slate-800 tabular-nums text-xs">
                        {formatCurrency(room.monthlyRent)}/mo
                      </td>
                      <td className="py-4 px-4 sm:px-5 font-bold text-slate-800 tabular-nums text-xs">
                        {formatCurrency(room.rentCollected)}
                      </td>
                      <td className="py-4 px-4 sm:px-5 font-bold text-teal-700 tabular-nums text-xs">
                        {formatCurrency(room.electricityCollected)}
                      </td>
                      <td className="py-4 px-4 sm:px-5 font-medium text-rose-600 tabular-nums text-xs">
                        {formatCurrency(room.expenseIncurred)}
                      </td>
                      <td className="py-4 px-4 sm:px-5 text-right font-black text-slate-900 text-sm tabular-nums">
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })}
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
