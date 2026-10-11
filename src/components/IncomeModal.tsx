import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag } from 'lucide-react';
import { IncomeItem, IncomeCategory } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { parseCurrencyInput } from '../constants/financeData';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Omit<IncomeItem, 'id' | 'createdAt'>, editingId?: string) => void;
  editingIncome: IncomeItem | null;
  categories: IncomeCategory[];
  currentMonth: string;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingIncome,
  categories,
  currentMonth,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingIncome) {
      setDescription(editingIncome.description);
      setAmount(editingIncome.amount.toString().replace('.', ','));
      setCategory(editingIncome.category);
      setDate(editingIncome.date);
      setNotes(editingIncome.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDescription('');
      setAmount('');
      setCategory(categories[0]?.id || 'Salário');
      setDate(today);
      setNotes('');
    }
    setError(null);
  }, [editingIncome, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Por favor, informe a descrição da receita.');
      return;
    }

    const parsedAmount = parseCurrencyInput(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, informe um valor válido maior que zero.');
      return;
    }

    if (!category) {
      setError('Por favor, selecione uma categoria.');
      return;
    }

    const monthRef = date ? date.substring(0, 7) : currentMonth;

    onSave(
      {
        description: description.trim(),
        amount: parsedAmount,
        category,
        date: date || new Date().toISOString().split('T')[0],
        monthRef,
        notes: notes.trim() || undefined,
      },
      editingIncome?.id
    );

    onClose();
  };

  const selectedCategoryObj = categories.find((c) => c.id === category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {editingIncome ? 'Editar Receita' : 'Nova Receita'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {editingIncome
                  ? 'Atualize os dados da entrada financeira'
                  : 'Registre um novo ganho ou entrada'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Valor */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Valor da Receita (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                R$
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descrição *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário da Empresa X, Venda de item..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Categoria */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoria *
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Data *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Recebido via Pix, comprovante no Drive..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Botões */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
            >
              {editingIncome ? 'Salvar Alterações' : 'Cadastrar Receita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
