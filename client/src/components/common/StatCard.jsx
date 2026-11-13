import React from 'react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-emerald-50 text-emerald-700',
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all duration-200 flex flex-col justify-between group ${
        onClick ? 'cursor-pointer hover:border-emerald-300 hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg} shrink-0 transition-transform duration-200 group-hover:scale-105`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            {trend && (
              <span
                className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                  trendType === 'positive'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : trendType === 'negative'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                {trend}
              </span>
            )}
            {subtitle && <span className="text-slate-500 text-xs font-medium truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
