import React from 'react';
import { getStatusBadgeStyle } from '../../utils/formatters';

const Badge = ({ children, status, className = '', variant }) => {
  const customVariantClasses = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  };

  const styleClass = variant
    ? customVariantClasses[variant] || customVariantClasses.slate
    : getStatusBadgeStyle(status || children);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ring-inset ${styleClass} ${className}`}
    >
      {children || status}
    </span>
  );
};

export default Badge;

