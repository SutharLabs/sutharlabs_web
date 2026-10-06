import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface StockTrackerAlertState {
  isOpen: boolean;
  type?: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface StockTrackerAlertModalProps {
  alert: StockTrackerAlertState | null;
  onClose: () => void;
}

export default function StockTrackerAlertModal({ alert, onClose }: StockTrackerAlertModalProps) {
  useEffect(() => {
    if (!alert?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (alert.onCancel) alert.onCancel();
        onClose();
      } else if (e.key === 'Enter' && alert.onConfirm) {
        alert.onConfirm();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert, onClose]);

  if (!alert || !alert.isOpen) return null;

  const type = alert.type || 'error';
  const isConfirm = typeof alert.onConfirm === 'function';

  const typeConfig = {
    error: {
      icon: AlertCircle,
      accentColor: 'text-[#ff6b6b]',
      bgAccent: 'bg-[#ff6b6b]/15',
      borderAccent: 'border-[#ff6b6b]/30',
      buttonBg: 'bg-[#ff6b6b] hover:bg-[#ff5252] text-white',
      badge: 'Error'
    },
    warning: {
      icon: AlertTriangle,
      accentColor: 'text-amber-400',
      bgAccent: 'bg-amber-400/15',
      borderAccent: 'border-amber-400/30',
      buttonBg: 'bg-amber-400 hover:bg-amber-300 text-[#002022]',
      badge: 'Notice'
    },
    info: {
      icon: Info,
      accentColor: 'text-[#00dbe7]',
      bgAccent: 'bg-[#00dbe7]/15',
      borderAccent: 'border-[#00dbe7]/30',
      buttonBg: 'bg-[#00dbe7] hover:brightness-110 text-[#002022]',
      badge: 'Information'
    },
    success: {
      icon: CheckCircle2,
      accentColor: 'text-[#00e476]',
      bgAccent: 'bg-[#00e476]/15',
      borderAccent: 'border-[#00e476]/30',
      buttonBg: 'bg-[#00e476] hover:brightness-110 text-[#002022]',
      badge: 'Success'
    }
  }[type];

  const Icon = typeConfig.icon;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => {
        if (!isConfirm) {
          onClose();
        }
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl bg-surface-container-low border ${typeConfig.borderAccent} shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-200 font-mono`}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline/15 bg-surface-container">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${typeConfig.bgAccent} ${typeConfig.accentColor} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${typeConfig.accentColor}`}>
                {typeConfig.badge}
              </span>
              <h3 className="font-bold text-sm text-on-surface leading-tight">
                {alert.title}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              if (alert.onCancel) alert.onCancel();
              onClose();
            }}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="p-5 text-xs text-on-surface-variant leading-relaxed font-sans whitespace-pre-wrap">
          {alert.message}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-surface-container/60 border-t border-outline/10 font-mono text-xs">
          {isConfirm ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (alert.onCancel) alert.onCancel();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline/20 font-bold transition-all cursor-pointer"
              >
                {alert.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (alert.onConfirm) alert.onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl font-bold transition-all shadow-md cursor-pointer ${typeConfig.buttonBg}`}
              >
                {alert.confirmLabel || 'Confirm Action'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl font-bold transition-all shadow-md cursor-pointer ${typeConfig.buttonBg}`}
            >
              {alert.confirmLabel || 'Dismiss'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
