import React, { useEffect } from 'react';
import { X, Sparkles, Edit3 } from 'lucide-react';
import { ExpenseForm } from './ExpenseForm';
import {
  Expense,
  ExpenseInput,
  CreditCardItem,
  AccountItem,
  CategoryOption,
} from '../types/finance';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (input: ExpenseInput) => Promise<void>;
  onUpdateExpense?: (updated: Expense) => Promise<void>;
  initialExpense?: Expense | null;
  cards?: CreditCardItem[];
  accounts?: AccountItem[];
  categories?: CategoryOption[];
  isSubmitting: boolean;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  onUpdateExpense,
  initialExpense = null,
  cards,
  accounts,
  categories,
  isSubmitting,
}) => {
  const isEditing = !!initialExpense;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleAddAndClose = async (input: ExpenseInput) => {
    await onAddExpense(input);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleUpdateAndClose = async (updated: Expense) => {
    if (onUpdateExpense) {
      await onUpdateExpense(updated);
      setTimeout(() => {
        onClose();
      }, 900);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isEditing
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
              }`}
            >
              {isEditing ? <Edit3 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Atualizar dados na planilha do Google Drive'
                  : 'Salvar gasto na planilha do Google Drive'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          <ExpenseForm
            onAddExpense={handleAddAndClose}
            onUpdateExpense={handleUpdateAndClose}
            initialExpense={initialExpense}
            cards={cards}
            accounts={accounts}
            categories={categories}
            isSubmitting={isSubmitting}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};
