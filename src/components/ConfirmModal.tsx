import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ArrowRightLeft, 
  X,
  Loader2
} from 'lucide-react';

export type ModalVariant = 'primary' | 'warning' | 'danger' | 'success' | 'info';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  subtext?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
  icon?: React.ReactNode;
  theme?: 'light' | 'dark';
  isLoading?: boolean;
  isAlert?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  subtext,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'primary',
  icon,
  theme,
  isLoading = false,
  isAlert = false
}: ConfirmModalProps) {
  const effectiveTheme: 'light' | 'dark' = theme || (
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const isLight = effectiveTheme === 'light';

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Variant-specific styles and default icons
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          accentBar: 'bg-rose-500',
          badgeBg: isLight ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs' : 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          defaultIcon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          confirmBtn: isLight
            ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-rose-500/20'
            : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border-rose-500/50 hover:border-rose-500 shadow-rose-500/10'
        };
      case 'warning':
        return {
          accentBar: 'bg-amber-400',
          badgeBg: isLight ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-xs' : 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          defaultIcon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          confirmBtn: isLight
            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/20'
            : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border-amber-500/50 hover:border-amber-500 shadow-amber-500/10'
        };
      case 'success':
        return {
          accentBar: 'bg-emerald-500',
          badgeBg: isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-xs' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          defaultIcon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          confirmBtn: isLight
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border-emerald-500/50 hover:border-emerald-500 shadow-emerald-500/10'
        };
      case 'info':
        return {
          accentBar: 'bg-sky-500',
          badgeBg: isLight ? 'bg-sky-50 text-sky-600 border-sky-200 shadow-xs' : 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          defaultIcon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
          confirmBtn: isLight
            ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sky-500/20'
            : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 hover:text-white border-sky-500/50 hover:border-sky-500 shadow-sky-500/10'
        };
      case 'primary':
      default:
        return {
          accentBar: 'bg-[#00dbe7]',
          badgeBg: isLight ? 'bg-sky-50 text-sky-600 border-sky-200 shadow-xs' : 'bg-[#00dbe7]/10 text-[#00dbe7] border-[#00dbe7]/30',
          defaultIcon: <ArrowRightLeft className="w-5 h-5 text-[#00dbe7] shrink-0" />,
          confirmBtn: isLight
            ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sky-500/20'
            : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 hover:border-[#00dbe7] shadow-[#00dbe7]/10'
        };
    }
  };

  const currentStyles = getVariantStyles();
  const effectiveConfirmLabel = confirmLabel || (isAlert ? 'OK' : 'Confirm');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150 ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent Bar */}
        <div className={`h-1 w-full ${currentStyles.accentBar}`} />

        {/* Modal Header & Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Standard Container Badge */}
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${currentStyles.badgeBg}`}>
              {icon || currentStyles.defaultIcon}
            </div>

            {/* Title & Body */}
            <div className="flex-1 min-w-0 pr-6">
              <h3 className={`text-base font-bold font-sans tracking-tight leading-tight ${
                isLight ? 'text-slate-900' : 'text-[#f5f0f3]'
              }`}>
                {title}
              </h3>
              <p className={`text-xs mt-1.5 font-sans leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-[#c2bec1]'
              }`}>
                {message}
              </p>
            </div>

            {/* Close Button */}
            {!isLoading && (
              <button
                type="button"
                onClick={onClose}
                className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-white/10 text-zinc-400 hover:text-white'
                }`}
                title="Close"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>

          {/* Subtext / Explanatory Technical Box */}
          {subtext && (
            <div className={`mt-4 ml-0 sm:ml-[60px] p-3 rounded-xl border font-mono text-[11px] leading-relaxed ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-600' 
                : 'bg-black/30 border-[#3a494b]/30 text-[#00dbe7]/90'
            }`}>
              {subtext}
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 shrink-0 flex-nowrap">
            {!isAlert && cancelLabel && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 select-none ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600 hover:border-sky-400'
                    : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                }`}
              >
                <span>{cancelLabel}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 select-none ${currentStyles.confirmBtn}`}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
              <span>{effectiveConfirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

