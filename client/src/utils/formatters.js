export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatMonth = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return monthStr || '-';
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

export const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return '-';
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length < 4) return aadhaar;
  return `XXXX-XXXX-${clean.slice(-4)}`;
};

export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'Paid':
    case 'Available':
    case 'Active':
    case 'Refunded':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
    case 'Occupied':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10';
    case 'Partially Paid':
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';
    case 'Overdue':
    case 'Terminated':
    case 'Expired':
    case 'Forfeited':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';
    case 'Maintenance':
    case 'Inactive':
    case 'Vacated':
      return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 ring-gray-500/10';
  }
};

