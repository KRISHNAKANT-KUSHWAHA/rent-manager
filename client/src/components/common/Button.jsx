import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const variants = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-soft focus:ring-emerald-500',
    brand:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-soft focus:ring-emerald-500',
    dark:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-soft focus:ring-slate-700',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-soft-sm focus:ring-emerald-500',
    outline:
      'bg-transparent hover:bg-emerald-50 text-emerald-700 border border-emerald-300 focus:ring-emerald-500',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-soft focus:ring-rose-500',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-soft focus:ring-emerald-500',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5',
    sm: 'text-xs px-3 py-2 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;

