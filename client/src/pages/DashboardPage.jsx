import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatMonth } from '../utils/formatters';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import {
  Home,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Plus,
  FileText,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" count={4} />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const { summary, roomsOverview, recentRentPayments, upcomingDues, reminders, monthlyIncomeChart } =
    data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md mb-2">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user?.houseName || 'Shanti Niwas'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, {user?.name || 'Property Owner'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Owner management overview for {formatMonth(data?.currentMonth)}. Manage rooms, track rent dues, and monitor sub-meter electricity readings.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/tenants?new=true')}
            >
              Add Tenant
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Receipt}
              onClick={() => navigate('/rent')}
            >
              Collect Rent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Zap}
              onClick={() => navigate('/electricity?new=true')}
            >
              Record Meter
            </Button>
          </div>
        </div>
      </div>

      {/* Smart Alerts & Reminders Section */}
      {reminders && reminders.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Property Reminders & Alerts ({reminders.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reminders.map((rem) => (
              <Link
                key={rem.id}
                to={rem.link}
                className={`p-4 rounded-2xl border transition-all duration-150 flex items-start gap-3 shadow-sm hover:shadow-md ${
                  rem.severity === 'urgent'
                    ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300 text-rose-950'
                    : rem.severity === 'high'
                    ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300 text-amber-950'
                    : 'bg-indigo-50/70 border-indigo-200 hover:border-indigo-300 text-indigo-950'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    rem.severity === 'urgent'
                      ? 'bg-rose-100 text-rose-600'
                      : rem.severity === 'high'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{rem.title}</div>
                  <div className="text-[11px] opacity-80 mt-0.5 leading-relaxed line-clamp-2">
                    {rem.message}
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-40 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stat Cards Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          House Key Performance Indicators
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Rooms"
            value={summary?.totalRooms || 0}
            subtitle={`${summary?.occupiedRooms || 0} Occupied • ${summary?.availableRooms || 0} Available`}
            icon={Home}
            iconBg="bg-indigo-50 text-indigo-600"
            onClick={() => navigate('/rooms')}
          />
          <StatCard
            title="Active Tenants"
            value={summary?.totalActiveTenants || 0}
            subtitle="Registered in house"
            icon={Users}
            iconBg="bg-emerald-50 text-emerald-600"
            onClick={() => navigate('/tenants')}
          />
          <StatCard
            title="Expected Monthly Rent"
            value={formatCurrency(summary?.expectedMonthlyRent)}
            subtitle="From active agreements"
            icon={TrendingUp}
            iconBg="bg-blue-50 text-blue-600"
            onClick={() => navigate('/agreements')}
          />
          <StatCard
            title="Rent Received This Month"
            value={formatCurrency(summary?.rentReceivedThisMonth)}
            subtitle={`Target: ${formatCurrency(summary?.expectedMonthlyRent)}`}
            icon={CheckCircle}
            iconBg="bg-teal-50 text-teal-600"
            trend={
              summary?.expectedMonthlyRent
                ? `${Math.round(
                    ((summary.rentReceivedThisMonth || 0) / summary.expectedMonthlyRent) * 100
                  )}% Collected`
                : '0%'
            }
            trendType="positive"
            onClick={() => navigate('/rent')}
          />
          <StatCard
            title="Total Pending Rent"
            value={formatCurrency(summary?.pendingRent)}
            subtitle="Unpaid rent balances"
            icon={Clock}
            iconBg="bg-amber-50 text-amber-600"
            trendType={summary?.pendingRent > 0 ? 'negative' : 'positive'}
            onClick={() => navigate('/rent?status=Pending')}
          />
          <StatCard
            title="Pending Electricity"
            value={formatCurrency(summary?.pendingElectricity)}
            subtitle="Sub-meter utility arrears"
            icon={Zap}
            iconBg="bg-amber-50 text-amber-600"
            onClick={() => navigate('/electricity')}
          />
          <StatCard
            title="Occupancy Rate"
            value={
              summary?.totalRooms
                ? `${Math.round(((summary.occupiedRooms || 0) / summary.totalRooms) * 100)}%`
                : '0%'
            }
            subtitle={`${summary?.availableRooms || 0} room(s) vacant`}
            icon={Building}
            iconBg="bg-purple-50 text-purple-600"
            onClick={() => navigate('/rooms')}
          />
          <StatCard
            title="House Maintenance"
            value={summary?.maintenanceRooms || 0}
            subtitle="Under service"
            icon={AlertTriangle}
            iconBg="bg-slate-100 text-slate-600"
            onClick={() => navigate('/expenses')}
          />
        </div>
      </div>

      {/* Monthly Financial Trend Chart (Recharts) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Monthly Collection & Expense History
            </h3>
            <p className="text-xs text-slate-500">
              Rent collection, electricity recovery, and property maintenance expenses
            </p>
          </div>
          <Link
            to="/reports"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
          >
            <span>View Full Financial Report</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyIncomeChart}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(value),
                  name === 'rent'
                    ? 'Rent Collected'
                    : name === 'electricity'
                    ? 'Electricity'
                    : 'Expenses',
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value) =>
                  value === 'rent'
                    ? 'Rent'
                    : value === 'electricity'
                    ? 'Electricity'
                    : 'Expenses'
                }
              />
              <Bar dataKey="rent" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar
                dataKey="electricity"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="expenses"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: Room Occupancy Status & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Occupancy Overview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rooms in Single House</h3>
                <p className="text-xs text-slate-500">Live occupancy status of each room</p>
              </div>
              <Link
                to="/rooms"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                Manage All
              </Link>
            </div>

            <div className="space-y-3">
              {roomsOverview && roomsOverview.length > 0 ? (
                roomsOverview.map((room) => (
                  <div
                    key={room._id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          room.status === 'Occupied'
                            ? 'bg-indigo-100 text-indigo-700'
                            : room.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {room.roomNumber.replace('ROOM-', '')}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {room.roomNumber} • {room.floorName || `Floor ${room.floor}`}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {room.currentTenant ? (
                            <span className="text-slate-700 font-semibold">
                              Tenant: {room.currentTenant.fullName}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Ready to rent</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-extrabold text-slate-900">
                        {formatCurrency(room.monthlyRent)}/mo
                      </div>
                      <Badge status={room.status} className="mt-1" />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No rooms added yet"
                  description="Add rooms to start managing your residential house."
                  actionLabel="Add Room"
                  onAction={() => navigate('/rooms')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Recent Rent Payments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Rent Receipts</h3>
                <p className="text-xs text-slate-500">Latest recorded payments with PDF receipts</p>
              </div>
              <Link
                to="/rent"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                View History
              </Link>
            </div>

            <div className="space-y-3">
              {recentRentPayments && recentRentPayments.length > 0 ? (
                recentRentPayments.map((pmt) => (
                  <div
                    key={pmt._id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 transition bg-white flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {pmt.tenant?.fullName || 'Tenant'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {pmt.room?.roomNumber || 'Room'} • {formatDate(pmt.paymentDate)} via{' '}
                          {pmt.paymentMethod}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <div className="text-xs font-black text-emerald-600">
                          +{formatCurrency(pmt.amountPaid)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {pmt.receiptNumber}
                        </div>
                      </div>
                      <a
                        href={`/api/rent/receipts/${pmt._id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        title="Download Official Receipt PDF"
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No payments recorded"
                  description="Recorded rent payments will appear here."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Rent Dues Table */}
      {upcomingDues && upcomingDues.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Upcoming & Pending Rent Dues</h3>
              <p className="text-xs text-slate-500">Rent collections due for current billing cycle</p>
            </div>
            <Link
              to="/rent"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Go to Rent Management
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Tenant & Room</th>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingDues.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{inv.tenant?.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        {inv.room?.roomNumber} • Mob: {inv.tenant?.primaryMobile}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {inv.billingMonth}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {formatCurrency(inv.remainingBalance)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => navigate('/rent')}
                      >
                        Record Payment
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

