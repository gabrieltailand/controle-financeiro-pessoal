import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  CreditCard,
  Wallet,
  Calendar,
  PieChart,
  Layers,
  Target,
  Pencil,
  CheckCircle2,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Expense, CategoryOption, CreditCardItem, IncomeItem, InvestmentItem } from '../types/finance';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CREDIT_CARDS,
  formatCurrency,
  formatMonthYear,
  parseCurrencyInput,
} from '../constants/financeData';
import { CategoryIcon } from './CategoryIcon';
import { CategoryBudgetModal } from './CategoryBudgetModal';

interface DashboardProps {
  expenses: Expense[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  categories?: CategoryOption[];
  cards?: CreditCardItem[];
  incomes?: IncomeItem[];
  investments?: InvestmentItem[];
  monthlyBudget?: number;
  onSetBudget?: (amount: number) => void;
  categoryBudgets?: Record<string, number>;
  allCategoryBudgets?: Record<string, Record<string, number>>;
  onSetCategoryBudgets?: (month: string, budgets: Record<string, number>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  selectedMonth,
  onMonthChange,
  availableMonths,
  categories = DEFAULT_CATEGORIES,
  cards = DEFAULT_CREDIT_CARDS,
  incomes = [],
  investments = [],
  monthlyBudget = 0,
  onSetBudget,
  categoryBudgets = {},
  allCategoryBudgets = {},
  onSetCategoryBudgets,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInputValue, setBudgetInputValue] = useState('');
  const [isCategoryBudgetModalOpen, setIsCategoryBudgetModalOpen] = useState(false);

  useEffect(() => {
    setBudgetInputValue(monthlyBudget > 0 ? monthlyBudget.toString().replace('.', ',') : '');
    setIsEditingBudget(false);
  }, [monthlyBudget, selectedMonth]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseCurrencyInput(budgetInputValue);
    if (parsed > 0) {
      onSetBudget?.(parsed);
      setIsEditingBudget(false);
    } else if (budgetInputValue.trim() === '' || parsed === 0) {
      onSetBudget?.(0);
      setIsEditingBudget(false);
    }
  };

  const handleRemoveBudget = () => {
    onSetBudget?.(0);
    setBudgetInputValue('');
    setIsEditingBudget(false);
  };

  // Filter expenses for selected month
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => e.monthRef === selectedMonth || e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  // Aggregate incomes for selected month
  const monthIncomeTotal = useMemo(() => {
    return incomes
      .filter((i) => i.monthRef === selectedMonth || i.date.startsWith(selectedMonth))
      .reduce((sum, curr) => sum + curr.amount, 0);
  }, [incomes, selectedMonth]);

  // Aggregate investments for selected month
  const monthInvestmentTotal = useMemo(() => {
    return investments
      .filter((inv) => inv.monthRef === selectedMonth || inv.date.startsWith(selectedMonth))
      .reduce((sum, curr) => sum + curr.amount, 0);
  }, [investments, selectedMonth]);

  // Month navigation
  const currentIndex = availableMonths.indexOf(selectedMonth);
  const handlePrevMonth = () => {
    if (currentIndex < availableMonths.length - 1 && currentIndex !== -1) {
      onMonthChange(availableMonths[currentIndex + 1]);
    } else {
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      onMonthChange(prevKey);
    }
  };

  const handleNextMonth = () => {
    if (currentIndex > 0) {
      onMonthChange(availableMonths[currentIndex - 1]);
    } else {
      const [y, m] = selectedMonth.split('-').map(Number);
      const nextDate = new Date(y, m, 1);
      const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      onMonthChange(nextKey);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let total = 0;
    let creditTotal = 0;
    let cashTotal = 0;
    const categoryTotals: Record<string, number> = {};
    const cardTotals: Record<string, number> = {};

    monthExpenses.forEach((exp) => {
      total += exp.amount;
      if (exp.type === 'credito') {
        creditTotal += exp.amount;
      } else {
        cashTotal += exp.amount;
      }

      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      const cardKey = exp.card || 'Geral';
      cardTotals[cardKey] = (cardTotals[cardKey] || 0) + exp.amount;
    });

    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyAverage = total / (daysInMonth || 30);

    return {
      total,
      creditTotal,
      cashTotal,
      count: monthExpenses.length,
      categoryTotals,
      cardTotals,
      dailyAverage,
    };
  }, [monthExpenses, selectedMonth]);

  // Calculate sum of category budgets
  const sumCategoryBudgets = useMemo(() => {
    return Object.values(categoryBudgets).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  }, [categoryBudgets]);

  const hasCategoryBudgets = sumCategoryBudgets > 0;
  const effectiveBudget = hasCategoryBudgets ? sumCategoryBudgets : monthlyBudget;
  const budgetRatio = effectiveBudget > 0 ? (stats.total / effectiveBudget) * 100 : 0;
  const budgetRemaining = effectiveBudget > 0 ? effectiveBudget - stats.total : 0;
  const isOverBudget = effectiveBudget > 0 && stats.total > effectiveBudget;
  const isNearBudget = effectiveBudget > 0 && !isOverBudget && budgetRatio >= 80;

  // Detailed status for each category budget
  const categoryBudgetItems = useMemo(() => {
    return categories.map((cat) => {
      const spent = stats.categoryTotals[cat.id] || stats.categoryTotals[cat.name] || 0;
      const budget = categoryBudgets[cat.id] ?? categoryBudgets[cat.name] ?? 0;
      const hasBudget = budget > 0;
      const ratio = hasBudget ? (spent / budget) * 100 : 0;
      const isOver = hasBudget && spent > budget;
      const isNear = hasBudget && !isOver && ratio >= 80;
      const remaining = hasBudget ? budget - spent : 0;

      return {
        ...cat,
        spent,
        budget,
        hasBudget,
        ratio,
        isOver,
        isNear,
        remaining,
      };
    });
  }, [categories, stats.categoryTotals, categoryBudgets]);

  const configuredBudgetItems = useMemo(() => {
    return categoryBudgetItems
      .filter((item) => item.hasBudget)
      .sort((a, b) => b.ratio - a.ratio);
  }, [categoryBudgetItems]);

  const handleSaveCategoryBudgets = (newBudgets: Record<string, number>) => {
    onSetCategoryBudgets?.(selectedMonth, newBudgets);
    const sum = Object.values(newBudgets).reduce((a, b) => a + (Number(b) || 0), 0);
    onSetBudget?.(sum);
  };

  // Sort categories by highest spend
  const sortedCategories = useMemo(() => {
    return Object.entries(stats.categoryTotals)
      .map(([catId, amount]) => {
        const catObj = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: catObj ? catObj.name : catId,
          iconName: catObj ? catObj.iconName : 'MoreHorizontal',
          color: catObj ? catObj.color : '#94a3b8',
          amount,
          percentage: stats.total > 0 ? (amount / stats.total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [stats.categoryTotals, stats.total, categories]);

  // Sort cards by highest spend
  const sortedCards = useMemo(() => {
    return Object.entries(stats.cardTotals)
      .map(([cardName, amount]) => ({
        name: cardName,
        amount,
        percentage: stats.total > 0 ? (amount / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [stats.cardTotals, stats.total]);

  return (
    <div className="space-y-5">
      {/* Month Navigation Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white capitalize">
              {formatMonthYear(selectedMonth)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stats.count} {stats.count === 1 ? 'gasto registrado' : 'gastos registrados'}
            </p>
          </div>
        </div>

        {/* Month selector controls */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-end sm:self-auto">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none px-2 py-1 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {formatMonthYear(m)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Consolidated Financial Overview (Receitas, Gastos, Investimentos & Balanço) */}
      {(monthIncomeTotal > 0 || monthInvestmentTotal > 0) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Balanço do Mês
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {formatMonthYear(selectedMonth)}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                (+) Receitas
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {formatCurrency(monthIncomeTotal)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                (-) Despesas
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-rose-700 dark:text-rose-400">
                {formatCurrency(stats.total)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 block mb-1">
                (✦) Investimentos
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-blue-700 dark:text-blue-400">
                {formatCurrency(monthInvestmentTotal)}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                monthIncomeTotal - stats.total - monthInvestmentTotal >= 0
                  ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900/40 text-teal-800 dark:text-teal-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
              }`}
            >
              <span className="text-[11px] font-semibold block mb-1 opacity-90">
                (=) Saldo Livre
              </span>
              <div className="text-base sm:text-lg font-bold font-mono">
                {formatCurrency(monthIncomeTotal - stats.total - monthInvestmentTotal)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Geral */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Total de Gastos
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
            {formatCurrency(stats.total)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
            Média diária: <span className="font-mono">{formatCurrency(stats.dailyAverage)}</span>
          </div>
        </div>

        {/* Cartão de Crédito */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Cartão de Crédito
          </span>
          <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 font-mono tracking-tight mt-1">
            {formatCurrency(stats.creditTotal)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
            {stats.total > 0 ? ((stats.creditTotal / stats.total) * 100).toFixed(0) : 0}% do total
          </div>
        </div>

        {/* À Vista / Pix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            À Vista & Pix
          </span>
          <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 font-mono tracking-tight mt-1">
            {formatCurrency(stats.cashTotal)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
            {stats.total > 0 ? ((stats.cashTotal / stats.total) * 100).toFixed(0) : 0}% do total
          </div>
        </div>

        {/* Quantidade Lançamentos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Lançamentos
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
            {stats.count} <span className="text-xs font-normal text-slate-400">itens</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
            Média: <span className="font-mono">{formatCurrency(stats.count > 0 ? stats.total / stats.count : 0)}</span>
          </div>
        </div>
      </div>

      {/* Orçamento por Categoria & Barra de Progresso */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Orçamento por Categoria
                </h4>
                {effectiveBudget > 0 && (
                  <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                    isOverBudget
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                      : isNearBudget
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {budgetRatio.toFixed(0)}% utilizado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {effectiveBudget > 0
                  ? isOverBudget
                    ? `Excedido em ${formatCurrency(Math.abs(budgetRemaining))}`
                    : `${formatCurrency(budgetRemaining)} restantes de ${formatCurrency(effectiveBudget)}`
                  : 'Defina limites de gastos para acompanhar suas metas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCategoryBudgetModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5 border border-transparent dark:border-slate-700/80 shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{hasCategoryBudgets ? 'Editar Metas' : 'Definir Metas'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Container */}
        {effectiveBudget > 0 && (
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget ? 'bg-rose-500' : isNearBudget ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(Math.max(budgetRatio, 0), 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>Gasto: {formatCurrency(stats.total)}</span>
              <span>Teto: {formatCurrency(effectiveBudget)}</span>
            </div>
          </div>
        )}

        {/* Categorized Budgets Breakdown */}
        {configuredBudgetItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {configuredBudgetItems.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                      {cat.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold ${
                    cat.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {cat.ratio.toFixed(0)}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cat.isOver ? 'bg-rose-500' : cat.isNear ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(cat.ratio, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>{formatCurrency(cat.spent)}</span>
                  <span>de {formatCurrency(cat.budget)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Breakdowns: Categorias & Cartões */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Categorias */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                Gastos por Categoria
              </h4>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {sortedCategories.length} {sortedCategories.length === 1 ? 'categoria' : 'categorias'}
            </span>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              Nenhuma despesa registrada neste mês.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.iconName} className="w-3 h-3" />
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-slate-400 text-[10px]">{cat.percentage.toFixed(0)}%</span>
                      <strong className="text-slate-900 dark:text-white font-semibold">
                        {formatCurrency(cat.amount)}
                      </strong>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(cat.percentage, 2)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cartões / Contas */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                Gastos por Cartão / Conta
              </h4>
            </div>
          </div>

          {sortedCards.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              Nenhum gasto por cartão neste mês.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedCards.map((c) => {
                const matchedCard = cards.find(
                  (card) => card.name.toLowerCase() === c.name.toLowerCase()
                );
                const dotColor = matchedCard?.color || '#10b981';

                return (
                  <div
                    key={c.name}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <div className="truncate">
                        <span className="text-xs font-medium text-slate-900 dark:text-white block truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.percentage.toFixed(0)}% do total
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white shrink-0">
                      {formatCurrency(c.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Budget Modal */}
      <CategoryBudgetModal
        isOpen={isCategoryBudgetModalOpen}
        onClose={() => setIsCategoryBudgetModalOpen(false)}
        selectedMonth={selectedMonth}
        categories={categories}
        expenses={expenses}
        currentBudgets={categoryBudgets}
        allCategoryBudgets={allCategoryBudgets}
        onSave={handleSaveCategoryBudgets}
      />
    </div>
  );
};
