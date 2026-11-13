import React from 'react';
import { getStatusBadgeStyle } from '../../utils/formatters';

const Badge = ({ children, status, className = '', variant, withDot = true }) => {
  const customVariantClasses = {
    brand: 'bg-orange-50 text-orange-700 border-orange-200/80 ring-orange-500/10',
    orange: 'bg-orange-50 text-orange-700 border-orange-200/80 ring-orange-500/10',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 ring-indigo-500/10',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/80 ring-sky-500/10',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80 ring-amber-500/10',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-500/10',
    slate: 'bg-slate-100 text-slate-700 border-slate-200/80 ring-slate-500/10',
  };

  const styleClass = variant
    ? customVariantClasses[variant] || customVariantClasses.slate
    : getStatusBadgeStyle(status || children);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide transition-colors ${styleClass} ${className}`}
    >
      {withDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 mr-1.5 shrink-0" />
      )}
      {children || status}
    </span>
  );
};

export default Badge;

