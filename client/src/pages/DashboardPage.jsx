import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatMonth } from '../utils/formatters';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
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
  CreditCard,
  Building2,
  Calendar,
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
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-2xl" count={4} />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const { summary, roomsOverview, recentRentPayments, upcomingDues, reminders, monthlyIncomeChart } =
    data || {};

  return (
    <div className="space-y-7 animate-in fade-in duration-150">
      {/* Executive House Banner - Warm Charcoal & Orange */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white p-5 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/15 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 text-orange-200 text-xs font-semibold backdrop-blur-md mb-2 border border-white/10">
              <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-none">{user?.houseName || 'Residential Property'}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, {user?.name || 'Property Owner'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-normal leading-relaxed">
              Property dashboard for {formatMonth(data?.currentMonth)}. Manage individual rooms, collect monthly rent, and track sub-meter utility bills.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
            <Button
              variant="brand"
              size="sm"
              icon={Plus}
              className="justify-center text-center px-1.5 sm:px-3 text-[11px] sm:text-xs font-bold"
              onClick={() => navigate('/tenants?new=true')}
            >
              Add Tenant
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Receipt}
              className="justify-center text-center px-1.5 sm:px-3 text-[11px] sm:text-xs font-bold"
              onClick={() => navigate('/rent')}
            >
              Collect Rent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Zap}
              className="justify-center text-center px-1.5 sm:px-3 text-[11px] sm:text-xs font-bold"
              onClick={() => navigate('/electricity?new=true')}
            >
              Record Meter
            </Button>
          </div>
        </div>
      </div>

      {/* Property Reminders & Alerts */}
      {reminders && reminders.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Property Reminders & Alerts ({reminders.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reminders.map((rem) => (
              <Link
                key={rem.id}
                to={rem.link}
                className={`p-4 rounded-2xl border transition-all duration-150 flex items-start gap-3 shadow-soft-sm hover:shadow-soft ${
                  rem.severity === 'urgent'
                    ? 'bg-rose-50/70 border-rose-200/80 hover:border-rose-300 text-rose-950'
                    : rem.severity === 'high'
                    ? 'bg-amber-50/70 border-amber-200/80 hover:border-amber-300 text-amber-950'
                    : 'bg-orange-50/70 border-orange-200/80 hover:border-orange-300 text-orange-950'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    rem.severity === 'urgent'
                      ? 'bg-rose-100 text-rose-600'
                      : rem.severity === 'high'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-orange-100 text-orange-600'
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

      {/* KPI Cards Grid */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          House Overview & Financial Summary
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Rooms"
            value={summary?.totalRooms || 0}
            subtitle={`${summary?.occupiedRooms || 0} Occupied • ${summary?.availableRooms || 0} Available`}
            icon={Home}
            iconBg="bg-slate-100 text-slate-700"
            onClick={() => navigate('/rooms')}
          />
          <StatCard
            title="Active Tenants"
            value={summary?.totalActiveTenants || 0}
            subtitle="Registered in house"
            icon={Users}
            iconBg="bg-orange-50 text-orange-600"
            onClick={() => navigate('/tenants')}
          />
          <StatCard
            title="Expected Monthly Rent"
            value={formatCurrency(summary?.expectedMonthlyRent)}
            subtitle="From active agreements"
            icon={TrendingUp}
            iconBg="bg-amber-50 text-amber-700"
            onClick={() => navigate('/agreements')}
          />
          <StatCard
            title="Rent Received"
            value={formatCurrency(summary?.rentReceivedThisMonth)}
            subtitle={`Target: ${formatCurrency(summary?.expectedMonthlyRent)}`}
            icon={CheckCircle}
            iconBg="bg-orange-50 text-orange-600"
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
            title="Pending Rent"
            value={formatCurrency(summary?.pendingRent)}
            subtitle="Unpaid rent dues"
            icon={Clock}
            iconBg="bg-rose-50 text-rose-700"
            trendType={summary?.pendingRent > 0 ? 'negative' : 'positive'}
            onClick={() => navigate('/rent?status=Pending')}
          />
          <StatCard
            title="Pending Electricity"
            value={formatCurrency(summary?.pendingElectricity)}
            subtitle="Sub-meter utility dues"
            icon={Zap}
            iconBg="bg-amber-50 text-amber-800"
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
            icon={Building2}
            iconBg="bg-orange-50 text-orange-600"
            onClick={() => navigate('/rooms')}
          />
          <StatCard
            title="Maintenance"
            value={summary?.maintenanceRooms || 0}
            subtitle="Under service"
            icon={AlertTriangle}
            iconBg="bg-slate-100 text-slate-700"
            onClick={() => navigate('/rooms')}
          />
        </div>
      </div>

      {/* Monthly Financial Chart */}
      <Card
        title="Monthly Collection History"
        subtitle="Rent collection and sub-meter electricity recovery"
        actions={
          <Link
            to="/reports"
            className="text-xs text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1 transition"
          >
            <span>View Full Financial Report</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="h-72 w-full pt-2">
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
                  name === 'rent' ? 'Rent Collected' : 'Electricity',
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value) => (value === 'rent' ? 'Rent' : 'Electricity')}
              />
              <Bar dataKey="rent" fill="#ea580c" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="electricity" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two Column Section: Room Occupancy & Recent Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Occupancy Overview */}
        <Card
          title="Rooms in House"
          subtitle="Live occupancy status of each room"
          actions={
            <Link
              to="/rooms"
              className="text-xs text-orange-600 hover:text-orange-700 font-bold transition"
            >
              Manage All
            </Link>
          }
        >
          <div className="space-y-3">
            {roomsOverview && roomsOverview.length > 0 ? (
              roomsOverview.map((room) => (
                <div
                  key={room._id}
                  className="p-3.5 rounded-2xl border border-slate-200/70 hover:border-slate-300 transition bg-slate-50/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        room.status === 'Occupied'
                          ? 'bg-orange-100 text-orange-800'
                          : room.status === 'Available'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
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
                          <span className="text-slate-800 font-semibold">
                            Tenant: {room.currentTenant.fullName}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Ready to rent</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-slate-900 tabular-nums">
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
        </Card>

        {/* Recent Rent Payments */}
        <Card
          title="Recent Rent Receipts"
          subtitle="Latest recorded payments with PDF receipts"
          actions={
            <Link
              to="/rent"
              className="text-xs text-orange-600 hover:text-orange-700 font-bold transition"
            >
              View History
            </Link>
          }
        >
          <div className="space-y-3">
            {recentRentPayments && recentRentPayments.length > 0 ? (
              recentRentPayments.map((pmt) => (
                <div
                  key={pmt._id}
                  className="p-3.5 rounded-2xl border border-slate-200/70 hover:border-slate-300 transition bg-white flex items-center justify-between gap-3 shadow-soft-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {pmt.tenant?.fullName || 'Tenant'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {pmt.room?.roomNumber || 'Room'} • {formatDate(pmt.paymentDate)} via{' '}
                        {pmt.paymentMethod}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-xs font-black text-orange-600 tabular-nums">
                        +{formatCurrency(pmt.amountPaid)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
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
        </Card>
      </div>

      {/* Upcoming Rent Dues */}
      {upcomingDues && upcomingDues.length > 0 && (
        <Card
          title="Upcoming & Pending Rent Dues"
          subtitle="Rent collections due for current billing cycle"
          actions={
            <Link
              to="/rent"
              className="text-xs text-orange-600 hover:text-orange-700 font-bold transition"
            >
              Go to Rent Management
            </Link>
          }
          bodyClassName="p-0"
        >
          <Table
            headers={[
              'Tenant & Room',
              'Billing Month',
              'Due Date',
              'Total Due',
              'Status',
              { label: 'Action', align: 'right' },
            ]}
          >
            {upcomingDues.map((inv) => (
              <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                <td className="py-3.5 px-4 sm:px-5">
                  <div className="font-bold text-slate-900">{inv.tenant?.fullName}</div>
                  <div className="text-[11px] text-slate-400">
                    {inv.room?.roomNumber} • Mob: {inv.tenant?.primaryMobile}
                  </div>
                </td>
                <td className="py-3.5 px-4 sm:px-5 font-semibold text-slate-700">
                  {inv.billingMonth}
                </td>
                <td className="py-3.5 px-4 sm:px-5 text-slate-600 font-medium">
                  {formatDate(inv.dueDate)}
                </td>
                <td className="py-3.5 px-4 sm:px-5 font-black text-slate-900 tabular-nums">
                  {formatCurrency(inv.remainingBalance)}
                </td>
                <td className="py-3.5 px-4 sm:px-5">
                  <Badge status={inv.status} />
                </td>
                <td className="py-3.5 px-4 sm:px-5 text-right">
                  <Button
                    size="xs"
                    variant="brand"
                    onClick={() => navigate('/rent')}
                  >
                    Record Payment
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
