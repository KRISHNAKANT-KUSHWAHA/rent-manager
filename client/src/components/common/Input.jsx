import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            required={required}
            onWheel={(e) => {
              if (type === 'number') e.target.blur();
              if (props.onWheel) props.onWheel(e);
            }}
            className={`w-full rounded-xl border transition-all duration-150 text-sm ${
              Icon ? 'pl-9' : 'pl-3.5'
            } pr-3.5 py-2.5 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-900'
                : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 text-slate-800'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

