import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Excluir definitivamente',
  cancelLabel = 'Cancelar',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-900 dark:text-slate-100">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${
              isDestructive
                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
