import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Calendar,
  CreditCard,
  ArrowUpDown,
  ExternalLink,
  Pencil,
  X,
} from 'lucide-react';
import { Expense, CategoryOption } from '../types/finance';
import { DEFAULT_CATEGORIES, formatCurrency, formatDateBR, formatMonthYearNumeric } from '../constants/financeData';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseListProps {
  expenses: Expense[];
  selectedMonth: string;
  onMonthChange?: (month: string) => void;
  availableMonths?: string[];
  onRequestDelete: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  spreadsheetUrl?: string;
  categories?: CategoryOption[];
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  selectedMonth,
  onMonthChange,
  availableMonths = [],
  onRequestDelete,
  onEdit,
  spreadsheetUrl,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>(selectedMonth || 'ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'credito' | 'avista'>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Keep monthFilter in sync if selectedMonth prop changes externally
  React.useEffect(() => {
    if (selectedMonth) {
      setMonthFilter(selectedMonth);
    }
  }, [selectedMonth]);

  // Handle month filter change (isolated to ExpenseList)
  const handleMonthFilterChange = (newVal: string) => {
    setMonthFilter(newVal);
  };

  // Combine and sort available months list
  const monthsList = useMemo(() => {
    const set = new Set<string>(availableMonths);
    if (selectedMonth && selectedMonth !== 'ALL') set.add(selectedMonth);
    expenses.forEach((e) => {
      if (e.monthRef) set.add(e.monthRef);
      else if (e.date) set.add(e.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [availableMonths, selectedMonth, expenses]);

  // Filter expenses for selected month (or ALL)
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (monthFilter === 'ALL') return true;
      return e.monthRef === monthFilter || e.date.startsWith(monthFilter);
    });
  }, [expenses, monthFilter]);

  // Apply search, category, type and sort
  const filteredExpenses = useMemo(() => {
    return monthExpenses
      .filter((e) => {
        const matchesSearch =
          !searchTerm.trim() ||
          e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.card.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategory === 'ALL' || e.category === filterCategory;
        const matchesType = filterType === 'ALL' || e.type === filterType;

        return matchesSearch && matchesCategory && matchesType;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [monthExpenses, searchTerm, filterCategory, filterType, sortOrder]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Extrato de Despesas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'item' : 'itens'} • Total:{' '}
            <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatCurrency(filteredTotal)}</strong>
          </p>
        </div>

        {spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <span>Planilha Google</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
        {/* Search Input */}
        <div className="sm:col-span-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, cartão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por Data (Mês/Ano ex: 10/2026) ao lado das outras buscas */}
        <div className="sm:col-span-3 relative flex items-center">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={monthFilter}
            onChange={(e) => handleMonthFilterChange(e.target.value)}
            title="Filtrar por data (mês/ano)"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              Todos os Meses
            </option>
            {monthsList.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono">
                {formatMonthYearNumeric(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'ALL' | 'credito' | 'avista')}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todos os Tipos</option>
            <option value="credito" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Só Crédito</option>
            <option value="avista" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Só À Vista/Pix</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="sm:col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="w-full py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center justify-center text-xs"
            title={sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Expenses Table/List */}
      {filteredExpenses.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Nenhuma despesa encontrada</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {searchTerm || monthFilter !== 'ALL' || filterCategory !== 'ALL' || filterType !== 'ALL'
              ? 'Tente ajustar os filtros aplicados.'
              : 'Nenhuma despesa registrada para este mês.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredExpenses.map((expense) => {
            const catObj = categories.find((c) => c.id === expense.category);
            const isCredit = expense.type === 'credito';

            return (
              <div
                key={expense.id}
                className="py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3 group"
              >
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50"
                    style={{
                      backgroundColor: `${catObj?.color || '#ef4444'}15`,
                      color: catObj?.color || '#ef4444',
                    }}
                  >
                    <CategoryIcon name={catObj?.iconName || 'ShoppingBag'} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                        {expense.description}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {isCredit ? 'Crédito' : 'À Vista'}
                      </span>
                      {expense.installments && expense.installments !== 'À Vista' && (
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {expense.installments}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatDateBR(expense.date)}</span>
                      <span>•</span>
                      <span className="truncate">{catObj?.name || expense.category}</span>
                      <span>•</span>
                      <span className="truncate">{expense.card}</span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    - {formatCurrency(expense.amount)}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(expense)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Editar despesa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRequestDelete(expense)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Excluir despesa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
