import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTenantLedger } from '../api/ledgerApi';
import { getTenants } from '../api/tenantApi';
import { useToast } from '../context/ToastContext';
import { formatDate, formatCurrency, formatDateTime } from '../utils/formatters';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import {
  BookOpenText,
  User,
  Home,
  Receipt,
  Zap,
  TrendingDown,
  TrendingUp,
  Shield,
  Printer,
  Calendar,
  CreditCard,
} from 'lucide-react';

const LedgerPage = () => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const fetchTenantsList = async () => {
      try {
        const res = await getTenants();
        if (res.success && res.tenants.length > 0) {
          setTenants(res.tenants);
          const paramId = searchParams.get('tenantId');
          if (paramId) {
            setSelectedTenantId(paramId);
          } else {
            setSelectedTenantId(res.tenants[0]._id);
          }
        }
      } catch (e) {
        toast.error('Failed to load tenants list');
      }
    };
    fetchTenantsList();
  }, []);

  const fetchLedger = async () => {
    if (!selectedTenantId) return;
    try {
      setLoading(true);
      const res = await getTenantLedger(selectedTenantId, {
        year: yearFilter,
        month: monthFilter,
      });
      if (res.success) {
        setLedgerData(res);
      }
    } catch (err) {
      toast.error('Failed to load tenant financial ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenantId) {
      fetchLedger();
    }
  }, [selectedTenantId, yearFilter, monthFilter]);

  const { tenant, summary, timeline } = ledgerData || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Financial Ledger"
        subtitle="Individual accounting statements showing rent dues, sub-meter electricity, payments received, and running balance."
      >
        <Button
          variant="secondary"
          icon={Printer}
          onClick={() => window.print()}
        >
          Print Ledger Statement
        </Button>
      </PageHeader>

      {/* Tenant Selector & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-80">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Tenant:
          </label>
          <Select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
          >
            {tenants.map((t) => (
              <option key={t._id} value={t._id}>
                {t.fullName} ({t.currentRoom?.roomNumber || 'Vacated'})
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-32">
            <Select
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              options={[
                { value: 2026, label: 'Year 2026' },
                { value: 2025, label: 'Year 2025' },
              ]}
            />
          </div>

          <div className="w-36">
            <Select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              options={[
                { value: '', label: 'All Months' },
                { value: '01', label: 'January' },
                { value: '02', label: 'February' },
                { value: '03', label: 'March' },
                { value: '04', label: 'April' },
                { value: '05', label: 'May' },
                { value: '06', label: 'June' },
                { value: '07', label: 'July' },
                { value: '08', label: 'August' },
                { value: '09', label: 'September' },
                { value: '10', label: 'October' },
                { value: '11', label: 'November' },
                { value: '12', label: 'December' },
              ]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-72" count={2} />
      ) : !ledgerData ? (
        <EmptyState title="Select a tenant to view financial records" />
      ) : (
        <div className="space-y-6">
          {/* Tenant Meta Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-xl flex items-center justify-center border border-indigo-200">
                {tenant?.fullName ? tenant.fullName[0] : 'T'}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{tenant?.fullName}</h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Mobile: <span className="font-semibold">{tenant?.primaryMobile}</span> •
                  Father: <span className="font-semibold">{tenant?.fatherName}</span>
                </div>
                <div className="text-xs text-indigo-600 font-bold mt-1">
                  Room: {tenant?.currentRoom?.roomNumber || 'Vacated'} • Masked Aadhaar:{' '}
                  {tenant?.maskedAadhaar || 'XXXX-XXXX'}
                </div>
              </div>
            </div>

            <div className="text-right border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Net Outstanding Balance
              </span>
              <span
                className={`text-2xl font-black ${
                  summary?.totalOutstandingBalance > 0
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                {formatCurrency(summary?.totalOutstandingBalance)}
              </span>
            </div>
          </div>

          {/* Ledger Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Security Deposit Held"
              value={formatCurrency(summary?.totalSecurityDepositHeld)}
              subtitle={`Refunded: ${formatCurrency(summary?.totalSecurityDepositRefunded)}`}
              icon={Shield}
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Total Rent Billed"
              value={formatCurrency(summary?.totalRentBilled)}
              subtitle={`Paid: ${formatCurrency(summary?.totalRentPaid)}`}
              icon={Receipt}
              iconBg="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              title="Electricity Billed"
              value={formatCurrency(summary?.totalElectricityBilled)}
              subtitle={`Paid: ${formatCurrency(summary?.totalElectricityPaid)}`}
              icon={Zap}
              iconBg="bg-amber-50 text-amber-600"
            />
            <StatCard
              title="Total Arrears Pending"
              value={formatCurrency(summary?.totalOutstandingBalance)}
              subtitle={`Rent: ${formatCurrency(summary?.pendingRent)} • Elec: ${formatCurrency(summary?.pendingElectricity)}`}
              icon={TrendingDown}
              iconBg="bg-rose-50 text-rose-600"
              trendType={summary?.totalOutstandingBalance > 0 ? 'negative' : 'positive'}
            />
          </div>

          {/* Detailed Transaction History Table (Debit & Credit Timeline) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Debit / Credit Accounting Timeline
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete chronology of invoices generated (debits) and payments recorded (credits)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">Transaction Date</th>
                    <th className="py-4 px-6">Type & Ref</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6 text-right">Debit (Due)</th>
                    <th className="py-4 px-6 text-right">Credit (Paid)</th>
                    <th className="py-4 px-6 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeline && timeline.length > 0 ? (
                    timeline.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {formatDate(item.date)}
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                              item.category === 'Rent'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {item.category}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                            {item.reference}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-slate-800 font-medium">
                          {item.description}
                        </td>

                        <td className="py-4 px-6 text-right font-bold text-slate-900">
                          {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                        </td>

                        <td className="py-4 px-6 text-right font-black text-emerald-600">
                          {item.credit > 0 ? `+${formatCurrency(item.credit)}` : '-'}
                        </td>

                        <td className="py-4 px-6 text-right font-mono font-black text-slate-900 text-sm">
                          {formatCurrency(item.runningBalance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No financial transactions on record for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerPage;

