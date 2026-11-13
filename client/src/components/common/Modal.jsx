import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-end sm:items-center justify-center p-2 sm:p-6 text-center pb-20 sm:pb-6">
        <div
          className={`relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white text-left shadow-2xl transition-all w-full ${maxWidth} border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto`}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-4 sm:px-6 pt-5 pb-3.5 border-b border-slate-100">
            <div className="pr-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{title}</h3>
              {subtitle && <p className="mt-1 text-xs text-slate-500 leading-relaxed">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 max-h-[65vh] sm:max-h-[75vh] overflow-y-auto overscroll-contain">{children}</div>

          {/* Optional Footer */}
          {footer && (
            <div className="bg-slate-50 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl sm:rounded-b-3xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;

