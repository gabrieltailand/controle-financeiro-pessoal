import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar } from 'lucide-react';
import { InvestmentItem, InvestmentCategory } from '../types/finance';
import { parseCurrencyInput } from '../constants/financeData';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (investment: Omit<InvestmentItem, 'id' | 'createdAt'>, editingId?: string) => void;
  editingInvestment: InvestmentItem | null;
  categories: InvestmentCategory[];
  currentMonth: string;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingInvestment,
  categories,
  currentMonth,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [institution, setInstitution] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingInvestment) {
      setDescription(editingInvestment.description);
      setAmount(editingInvestment.amount.toString().replace('.', ','));
      setCategory(editingInvestment.category);
      setInstitution(editingInvestment.institution || '');
      setDate(editingInvestment.date);
      setNotes(editingInvestment.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDescription('');
      setAmount('');
      setCategory(categories[0]?.id || 'Renda Fixa');
      setInstitution('Banco Inter');
      setDate(today);
      setNotes('');
    }
    setError(null);
  }, [editingInvestment, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Por favor, informe a descrição do investimento.');
      return;
    }

    const parsedAmount = parseCurrencyInput(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, informe um valor válido maior que zero.');
      return;
    }

    if (!category) {
      setError('Por favor, selecione uma classe de investimento.');
      return;
    }

    const monthRef = date ? date.substring(0, 7) : currentMonth;

    onSave(
      {
        description: description.trim(),
        amount: parsedAmount,
        category,
        institution: institution.trim() || undefined,
        date: date || new Date().toISOString().split('T')[0],
        monthRef,
        notes: notes.trim() || undefined,
      },
      editingInvestment?.id
    );

    onClose();
  };

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
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {editingInvestment ? 'Editar Investimento' : 'Novo Investimento'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {editingInvestment
                  ? 'Atualize os dados da aplicação financeira'
                  : 'Registre um aporte em ações, fundos ou renda fixa'}
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
              Valor do Aporte (R$) *
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
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Descrição do Ativo */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ativo / Descrição *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: CDB 110% CDI, Tesouro IPCA+ 2035, IVVB11..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Categoria / Classe */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Classe de Ativo *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Instituição / Corretora */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Corretora / Banco
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: XP, NuInvest, Inter, BTG..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Data do Aporte *
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              />
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
              placeholder="Ex: Reserva de emergência, longo prazo..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
            >
              {editingInvestment ? 'Salvar Alterações' : 'Cadastrar Investimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
