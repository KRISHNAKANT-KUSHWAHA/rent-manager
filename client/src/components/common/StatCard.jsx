import React from 'react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-orange-50 text-orange-600',
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all duration-200 flex flex-col justify-between group ${
        onClick ? 'cursor-pointer hover:border-orange-300 hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 sm:p-2.5 rounded-xl ${iconBg} shrink-0 transition-transform duration-200 group-hover:scale-105`}>
            <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5 sm:mt-3">
        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums truncate">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
            {trend && (
              <span
                className={`font-semibold px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] shrink-0 ${
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
            {subtitle && <span className="text-slate-500 font-medium truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
