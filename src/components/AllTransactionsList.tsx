import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpDown,
  ExternalLink,
  Pencil,
  DollarSign,
  TrendingUp,
  X,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  Expense,
  IncomeItem,
  InvestmentItem,
  CategoryOption,
  IncomeCategory,
  InvestmentCategory,
} from '../types/finance';
import { formatCurrency, formatDateBR, formatMonthYear, formatMonthYearNumeric, DEFAULT_CATEGORIES } from '../constants/financeData';
import { CategoryIcon } from './CategoryIcon';

export type UnifiedTransactionType = 'expense' | 'income' | 'investment';

export interface UnifiedTransaction {
  id: string;
  kind: UnifiedTransactionType;
  date: string;
  monthRef: string;
  description: string;
  amount: number;
  category: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  subInfo: string;
  notes?: string;
  installments?: string;
  isCredit?: boolean;
  rawExpense?: Expense;
  rawIncome?: IncomeItem;
  rawInvestment?: InvestmentItem;
}

interface AllTransactionsListProps {
  expenses: Expense[];
  incomes: IncomeItem[];
  investments: InvestmentItem[];
  selectedMonth: string;
  onMonthChange?: (month: string) => void;
  availableMonths?: string[];
  categories?: CategoryOption[];
  incomeCategories?: IncomeCategory[];
  investmentCategories?: InvestmentCategory[];
  spreadsheetUrl?: string;
  onRequestDeleteExpense: (expense: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteIncome: (id: string) => void;
  onEditIncome?: (income: IncomeItem) => void;
  onDeleteInvestment: (id: string) => void;
  onEditInvestment?: (investment: InvestmentItem) => void;
}

export const AllTransactionsList: React.FC<AllTransactionsListProps> = ({
  expenses,
  incomes,
  investments,
  selectedMonth,
  onMonthChange,
  availableMonths = [],
  categories = DEFAULT_CATEGORIES,
  incomeCategories = [],
  investmentCategories = [],
  spreadsheetUrl,
  onRequestDeleteExpense,
  onEditExpense,
  onDeleteIncome,
  onEditIncome,
  onDeleteInvestment,
  onEditInvestment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>(selectedMonth || 'ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | UnifiedTransactionType>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Keep monthFilter in sync if selectedMonth prop changes externally and isn't ALL
  React.useEffect(() => {
    if (selectedMonth && selectedMonth !== 'ALL') {
      setMonthFilter(selectedMonth);
    }
  }, [selectedMonth]);

  // Combine and sort available months list
  const monthsList = useMemo(() => {
    const set = new Set<string>(availableMonths);
    if (selectedMonth && selectedMonth !== 'ALL') set.add(selectedMonth);
    expenses.forEach((e) => {
      if (e.monthRef) set.add(e.monthRef);
      else if (e.date) set.add(e.date.slice(0, 7));
    });
    incomes.forEach((i) => {
      if (i.monthRef) set.add(i.monthRef);
      else if (i.date) set.add(i.date.slice(0, 7));
    });
    investments.forEach((inv) => {
      if (inv.monthRef) set.add(inv.monthRef);
      else if (inv.date) set.add(inv.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [availableMonths, selectedMonth, expenses, incomes, investments]);

  // Handle month filter change
  const handleMonthFilterChange = (value: string) => {
    setMonthFilter(value);
    if (value !== 'ALL' && onMonthChange) {
      onMonthChange(value);
    }
  };

  // Convert and combine entries filtered by the chosen month/year
  const allTransactions = useMemo<UnifiedTransaction[]>(() => {
    const list: UnifiedTransaction[] = [];
    const isAll = monthFilter === 'ALL';

    // Expenses
    expenses
      .filter((e) => isAll || e.monthRef === monthFilter || e.date.startsWith(monthFilter))
      .forEach((exp) => {
        const cat = categories.find((c) => c.id === exp.category);
        list.push({
          id: `exp_${exp.id}`,
          kind: 'expense',
          date: exp.date,
          monthRef: exp.monthRef,
          description: exp.description,
          amount: exp.amount,
          category: exp.category,
          categoryName: cat?.name || exp.category,
          categoryColor: cat?.color || '#ef4444',
          categoryIcon: cat?.iconName || 'ShoppingBag',
          subInfo: exp.card || (exp.type === 'credito' ? 'Crédito' : 'À Vista'),
          notes: exp.notes,
          installments: exp.installments,
          isCredit: exp.type === 'credito',
          rawExpense: exp,
        });
      });

    // Incomes
    incomes
      .filter((inc) => isAll || inc.monthRef === monthFilter || inc.date.startsWith(monthFilter))
      .forEach((inc) => {
        const cat = incomeCategories.find((c) => c.id === inc.category);
        list.push({
          id: `inc_${inc.id}`,
          kind: 'income',
          date: inc.date,
          monthRef: inc.monthRef,
          description: inc.description,
          amount: inc.amount,
          category: inc.category,
          categoryName: cat?.name || inc.category,
          categoryColor: cat?.color || '#10b981',
          categoryIcon: cat?.iconName || 'DollarSign',
          subInfo: 'Receita',
          notes: inc.notes,
          rawIncome: inc,
        });
      });

    // Investments
    investments
      .filter((inv) => isAll || inv.monthRef === monthFilter || inv.date.startsWith(monthFilter))
      .forEach((inv) => {
        const cat = investmentCategories.find((c) => c.id === inv.category);
        list.push({
          id: `inv_${inv.id}`,
          kind: 'investment',
          date: inv.date,
          monthRef: inv.monthRef,
          description: inv.description,
          amount: inv.amount,
          category: inv.category,
          categoryName: cat?.name || inv.category,
          categoryColor: cat?.color || '#3b82f6',
          categoryIcon: cat?.iconName || 'TrendingUp',
          subInfo: inv.institution ? `Aporte • ${inv.institution}` : 'Aporte',
          notes: inv.notes,
          rawInvestment: inv,
        });
      });

    return list;
  }, [
    expenses,
    incomes,
    investments,
    monthFilter,
    categories,
    incomeCategories,
    investmentCategories,
  ]);

  // Totals for summary
  const totals = useMemo(() => {
    let expenseTotal = 0;
    let incomeTotal = 0;
    let investmentTotal = 0;

    allTransactions.forEach((t) => {
      if (t.kind === 'expense') expenseTotal += t.amount;
      else if (t.kind === 'income') incomeTotal += t.amount;
      else if (t.kind === 'investment') investmentTotal += t.amount;
    });

    return {
      expense: expenseTotal,
      income: incomeTotal,
      investment: investmentTotal,
      net: incomeTotal - expenseTotal - investmentTotal,
    };
  }, [allTransactions]);

  // Filtered & Sorted
  const filteredTransactions = useMemo(() => {
    return allTransactions
      .filter((item) => {
        const matchesType = typeFilter === 'ALL' || item.kind === typeFilter;
        const matchesSearch =
          !searchTerm.trim() ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.subInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesType && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [allTransactions, typeFilter, searchTerm, sortOrder]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Lançamentos do Mês</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {filteredTransactions.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Despesas, receitas e investimentos {monthFilter === 'ALL' ? 'de todos os períodos' : `de ${formatMonthYear(monthFilter)}`}
          </p>
        </div>

        {/* Minimal Totals Summary */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-slate-500 dark:text-slate-400">
            Rec: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.income)}</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Desp: <span className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(totals.expense)}</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Inv: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(totals.investment)}</span>
          </div>
        </div>
      </div>

      {/* Clean Toolbar: Search alongside Date Filter (Mês e Ano) & Type Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, cartão, categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition"
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

        {/* Filtro por data (Mês e Ano) ao lado das outras buscas */}
        <div className="sm:col-span-4 relative flex items-center">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={monthFilter}
            onChange={(e) => handleMonthFilterChange(e.target.value)}
            title="Filtrar por data (mês e ano)"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              Todos os Meses / Anos
            </option>
            {monthsList.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono">
                {formatMonthYearNumeric(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter Select */}
        <div className="sm:col-span-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'ALL' | UnifiedTransactionType)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todos os Tipos</option>
            <option value="expense" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Despesas</option>
            <option value="income" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Receitas</option>
            <option value="investment" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Investimentos</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="sm:col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="w-full py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center justify-center gap-1 text-xs"
            title={sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* List items */}
      {filteredTransactions.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Nenhum lançamento encontrado</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {searchTerm || typeFilter !== 'ALL'
              ? 'Tente ajustar os filtros de busca ou tipo.'
              : 'Nenhum lançamento registrado neste período.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredTransactions.map((tx) => {
            const isExpense = tx.kind === 'expense';
            const isIncome = tx.kind === 'income';
            const isInvestment = tx.kind === 'investment';

            const valuePrefix = isExpense ? '-' : '+';
            const valueColor = isExpense
              ? 'text-rose-600 dark:text-rose-400'
              : isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-blue-600 dark:text-blue-400';

            const typeLabel = isExpense ? 'Despesa' : isIncome ? 'Receita' : 'Investimento';

            return (
              <div
                key={tx.id}
                className="py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3 group"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50"
                    style={{
                      backgroundColor: `${tx.categoryColor}15`,
                      color: tx.categoryColor,
                    }}
                  >
                    <CategoryIcon name={tx.categoryIcon} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                        {typeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>{formatDateBR(tx.date)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{tx.categoryName}</span>
                      {tx.subInfo && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px] text-slate-400 dark:text-slate-500">
                            {tx.subInfo}
                          </span>
                        </>
                      )}
                      {tx.installments && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400">
                            {tx.installments}
                          </span>
                        </>
                      )}
                    </div>

                    {tx.notes && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 max-w-md">
                        {tx.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`text-xs sm:text-sm font-bold font-mono ${valueColor}`}>
                      {valuePrefix} {formatCurrency(tx.amount)}
                    </p>
                  </div>

                  {/* Edit & Delete actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    {isExpense && tx.rawExpense && onEditExpense && (
                      <button
                        type="button"
                        onClick={() => onEditExpense(tx.rawExpense!)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Editar despesa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isIncome && tx.rawIncome && onEditIncome && (
                      <button
                        type="button"
                        onClick={() => onEditIncome(tx.rawIncome!)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Editar receita"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isInvestment && tx.rawInvestment && onEditInvestment && (
                      <button
                        type="button"
                        onClick={() => onEditInvestment(tx.rawInvestment!)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Editar investimento"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isExpense && tx.rawExpense && (
                      <button
                        type="button"
                        onClick={() => onRequestDeleteExpense(tx.rawExpense!)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Excluir despesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isIncome && (
                      <button
                        type="button"
                        onClick={() => {
                          const realId = tx.id.replace('inc_', '');
                          onDeleteIncome(realId);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Excluir receita"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isInvestment && (
                      <button
                        type="button"
                        onClick={() => {
                          const realId = tx.id.replace('inv_', '');
                          onDeleteInvestment(realId);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Excluir investimento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
