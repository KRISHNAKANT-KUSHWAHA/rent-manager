import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTenantLedger } from '../api/ledgerApi';
import { getTenants } from '../api/tenantApi';
import { useToast } from '../context/ToastContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import {
  BookOpenText,
  User,
  Home,
  Receipt,
  Zap,
  Shield,
  Printer,
  Calendar,
  CreditCard,
  Clock,
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
    <div className="space-y-6 animate-in fade-in duration-150">
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
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-96">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Tenant:
          </label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            {tenants.map((t) => (
              <option key={t._id} value={t._id}>
                {t.fullName} ({t.currentRoom?.roomNumber || 'Vacated'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 flex-1 md:flex-none"
          >
            <option value={2026}>Year 2026</option>
            <option value={2025}>Year 2025</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 flex-1 md:flex-none"
          >
            <option value="">All Months</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-2xl" count={2} />
      ) : !ledgerData ? (
        <EmptyState title="Select a tenant to view financial records" />
      ) : (
        <div className="space-y-6">
          {/* Tenant Meta Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-700 font-black text-xl flex items-center justify-center border border-orange-200">
                {tenant?.fullName ? tenant.fullName[0] : 'T'}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{tenant?.fullName}</h3>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  Mobile: <span className="font-semibold text-slate-700">{tenant?.primaryMobile}</span> •
                  Father: <span className="font-semibold text-slate-700">{tenant?.fatherName}</span>
                </div>
                <div className="text-xs text-orange-700 font-bold mt-1">
                  Room: {tenant?.currentRoom?.roomNumber || 'Vacated'} • Masked Aadhaar:{' '}
                  {tenant?.maskedAadhaar || 'XXXX-XXXX'}
                </div>
              </div>
            </div>

            <div className="text-right border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Net Outstanding Balance
              </span>
              <span
                className={`text-2xl font-black tabular-nums ${
                  summary?.totalOutstandingBalance > 0
                    ? 'text-rose-600'
                    : 'text-orange-700'
                }`}
              >
                {formatCurrency(summary?.totalOutstandingBalance)}
              </span>
            </div>
          </div>

          {/* Ledger Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Deposit Held"
              value={formatCurrency(summary?.totalSecurityDepositHeld)}
              subtitle={`Refunded: ${formatCurrency(summary?.totalSecurityDepositRefunded)}`}
              icon={Shield}
              iconBg="bg-slate-100 text-slate-700"
            />
            <StatCard
              title="Total Rent Billed"
              value={formatCurrency(summary?.totalRentBilled)}
              subtitle={`Paid: ${formatCurrency(summary?.totalRentPaid)}`}
              icon={Receipt}
              iconBg="bg-orange-50 text-orange-600"
            />
            <StatCard
              title="Electricity Billed"
              value={formatCurrency(summary?.totalElectricityBilled)}
              subtitle={`Paid: ${formatCurrency(summary?.totalElectricityPaid)}`}
              icon={Zap}
              iconBg="bg-teal-50 text-teal-700"
            />
            <StatCard
              title="Pending Arrears"
              value={formatCurrency(summary?.totalOutstandingBalance)}
              subtitle="Remaining balance"
              icon={Clock}
              iconBg="bg-amber-50 text-amber-800"
              trendType={summary?.totalOutstandingBalance > 0 ? 'negative' : 'positive'}
            />
          </div>

          {/* Detailed Statement Table */}
          <Card
            title="Chronological Financial Transactions"
            subtitle="Complete statement of rent invoices, payments, meter readings, and running balance."
            bodyClassName="p-0"
          >
            <Table
              headers={[
                'Date',
                'Type',
                'Description / Reference',
                'Debited (Dues)',
                'Credited (Paid)',
                'Status',
              ]}
              empty={!timeline || timeline.length === 0}
              emptyTitle="No financial records found"
              emptyMessage="There are no transactions recorded for the selected period."
              emptyIcon={BookOpenText}
            >
              {timeline &&
                timeline.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 sm:px-5 text-slate-600 font-medium text-xs">
                      {formatDate(item.date)}
                    </td>

                    <td className="py-3.5 px-4 sm:px-5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.type.includes('Payment')
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="font-bold text-slate-900 text-xs">{item.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Ref: {item.reference}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900 tabular-nums text-xs">
                      {item.debit > 0 ? formatCurrency(item.debit) : '—'}
                    </td>

                    <td className="py-3.5 px-4 sm:px-5 font-black text-slate-800 tabular-nums text-xs">
                      {item.credit > 0 ? `+${formatCurrency(item.credit)}` : '—'}
                    </td>

                    <td className="py-3.5 px-4 sm:px-5">
                      <Badge status={item.status} />
                    </td>
                  </tr>
                ))}
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LedgerPage;
