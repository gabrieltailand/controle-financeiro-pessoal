import React, { useState, useMemo, useEffect } from 'react';
import {
  Target,
  X,
  CheckCircle2,
  Trash2,
  Copy,
  DollarSign,
  TrendingDown,
  Info,
} from 'lucide-react';
import { CategoryOption, Expense } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency, formatMonthYear, parseCurrencyInput } from '../constants/financeData';

interface CategoryBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string; // YYYY-MM
  categories: CategoryOption[];
  expenses: Expense[];
  currentBudgets: Record<string, number>; // { [categoryId]: amount }
  allCategoryBudgets: Record<string, Record<string, number>>;
  onSave: (budgets: Record<string, number>) => void;
}

export const CategoryBudgetModal: React.FC<CategoryBudgetModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  categories,
  expenses,
  currentBudgets,
  allCategoryBudgets,
  onSave,
}) => {
  // Local state for input values: { [catId]: string }
  const [inputs, setInputs] = useState<Record<string, string>>({});

  // Calculate actual spending per category in the selected month
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      if (exp.monthRef === selectedMonth || exp.date?.startsWith(selectedMonth)) {
        const cat = exp.category || 'Outros';
        map[cat] = (map[cat] || 0) + (Number(exp.amount) || 0);
      }
    }
    return map;
  }, [expenses, selectedMonth]);

  // Previous month key (YYYY-MM)
  const prevMonthKey = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);

  const prevMonthBudgets = useMemo(() => {
    return allCategoryBudgets[prevMonthKey] || null;
  }, [allCategoryBudgets, prevMonthKey]);

  const hasPrevMonthBudgets = Boolean(
    prevMonthBudgets && Object.values(prevMonthBudgets).some((v) => v > 0)
  );

  // Initialize inputs when modal opens or selectedMonth changes
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      categories.forEach((cat) => {
        const val = currentBudgets[cat.id] ?? currentBudgets[cat.name] ?? 0;
        initial[cat.id] = val > 0 ? String(val).replace('.', ',') : '';
      });
      setInputs(initial);
    }
  }, [isOpen, selectedMonth, currentBudgets, categories]);

  if (!isOpen) return null;

  // Handle change for a category input
  const handleInputChange = (catId: string, val: string) => {
    setInputs((prev) => ({
      ...prev,
      [catId]: val,
    }));
  };

  // Quick action: Copy from previous month
  const handleCopyPrevMonth = () => {
    if (!prevMonthBudgets) return;
    setInputs((prev) => {
      const updated = { ...prev };
      categories.forEach((cat) => {
        const prevVal = prevMonthBudgets[cat.id] ?? prevMonthBudgets[cat.name] ?? 0;
        if (prevVal > 0) {
          updated[cat.id] = String(prevVal).replace('.', ',');
        }
      });
      return updated;
    });
  };

  // Quick action: Clear all inputs
  const handleClearAll = () => {
    const empty: Record<string, string> = {};
    categories.forEach((cat) => {
      empty[cat.id] = '';
    });
    setInputs(empty);
  };

  // Real-time sum of planned category budgets
  const totalBudgetPlanned = Object.values(inputs).reduce((sum, strVal) => {
    const num = parseCurrencyInput(strVal);
    return sum + (num > 0 ? num : 0);
  }, 0);

  // Real-time total actual spending this month
  const totalMonthSpending = Object.values(categorySpending).reduce((a, b) => a + b, 0);

  // Categories count with budget
  const categoriesWithBudgetCount = Object.values(inputs).filter((val) => {
    const num = parseCurrencyInput(val);
    return num > 0;
  }).length;

  // Submit and save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBudgets: Record<string, number> = {};
    categories.forEach((cat) => {
      const num = parseCurrencyInput(inputs[cat.id]);
      if (num > 0) {
        finalBudgets[cat.id] = num;
      }
    });
    onSave(finalBudgets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Orçamento por Categoria</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {formatMonthYear(selectedMonth)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Estipule limites de gastos para cada categoria e acompanhe o consumo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Total Orçado
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {formatCurrency(totalBudgetPlanned)}
              </div>
              <span className="text-[10px] text-slate-500">
                {categoriesWithBudgetCount} de {categories.length} categorias
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Gastos Atuais
              </span>
              <div className="text-base sm:text-lg font-black text-white font-mono">
                {formatCurrency(totalMonthSpending)}
              </div>
              <span className="text-[10px] text-slate-500">
                {totalBudgetPlanned > 0
                  ? `${((totalMonthSpending / totalBudgetPlanned) * 100).toFixed(0)}% do teto previsto`
                  : 'Nenhum teto configurado'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Saldo Previsto
              </span>
              <div
                className={`text-base sm:text-lg font-black font-mono ${
                  totalBudgetPlanned >= totalMonthSpending
                    ? 'text-teal-300'
                    : 'text-rose-400'
                }`}
              >
                {formatCurrency(totalBudgetPlanned - totalMonthSpending)}
              </div>
              <span className="text-[10px] text-slate-500">
                {totalBudgetPlanned >= totalMonthSpending ? 'Margem disponível' : 'Excedendo meta'}
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              Valores vazios ou 0 removem o limite da categoria.
            </span>

            <div className="flex items-center gap-2">
              {hasPrevMonthBudgets && (
                <button
                  type="button"
                  onClick={handleCopyPrevMonth}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-slate-700/60 transition"
                  title={`Copiar metas de ${formatMonthYear(prevMonthKey)}`}
                >
                  <Copy className="w-3 h-3 text-emerald-400" />
                  <span>Copiar mês anterior</span>
                </button>
              )}

              {categoriesWithBudgetCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[11px] font-semibold flex items-center gap-1 border border-red-500/20 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Zerar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body / Category Inputs List */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3">
          {categories.map((cat) => {
            const currentSpent = categorySpending[cat.id] || categorySpending[cat.name] || 0;
            const inputVal = inputs[cat.id] || '';
            const budgetNum = parseFloat(inputVal.replace(/\./g, '').replace(',', '.'));
            const hasValidBudget = !isNaN(budgetNum) && budgetNum > 0;
            const ratio = hasValidBudget ? (currentSpent / budgetNum) * 100 : 0;
            const isOver = hasValidBudget && currentSpent > budgetNum;
            const isNear = hasValidBudget && !isOver && ratio >= 80;

            return (
              <div
                key={cat.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Category Info */}
                <div className="flex items-center gap-3 min-w-[180px]">
                  <div
                    className="p-2.5 rounded-xl shrink-0"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{cat.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Gasto atual: <strong className="text-slate-300">{formatCurrency(currentSpent)}</strong>
                      </span>
                      {hasValidBudget && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            isOver
                              ? 'bg-rose-500/20 text-rose-300'
                              : isNear
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {ratio.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Input and status */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-44">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputVal}
                      onChange={(e) => handleInputChange(cat.id, e.target.value.replace(/[^0-9.,]/g, ''))}
                      placeholder="0,00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-right"
                    />
                  </div>

                  {inputVal && (
                    <button
                      type="button"
                      onClick={() => handleInputChange(cat.id, '')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                      title="Limpar limite"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-2" />
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Salvar Orçamentos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
