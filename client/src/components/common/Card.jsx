import React from 'react';

const Card = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = '',
  bodyClassName = 'p-6',
  headerClassName = 'p-6 pb-4 border-b border-slate-100',
  footer,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm transition-all ${className}`}
    >
      {(title || actions || Icon) && (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${headerClassName}`}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

