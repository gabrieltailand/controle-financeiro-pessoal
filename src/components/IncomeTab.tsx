import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Calendar,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { IncomeItem, IncomeCategory } from '../types/finance';
import { formatCurrency, formatDateBR, formatMonthYearNumeric } from '../constants/financeData';
import { CategoryIcon } from './CategoryIcon';

interface IncomeTabProps {
  incomes: IncomeItem[];
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  availableMonths?: string[];
  categories: IncomeCategory[];
  onOpenNewIncome: () => void;
  onEditIncome: (income: IncomeItem) => void;
  onDeleteIncome: (id: string) => void;
}

export const IncomeTab: React.FC<IncomeTabProps> = ({
  incomes,
  selectedMonth: initialSelectedMonth = 'ALL',
  availableMonths = [],
  categories,
  onOpenNewIncome,
  onEditIncome,
  onDeleteIncome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Combine available months specifically from income items and availableMonths prop
  const monthsList = useMemo(() => {
    const set = new Set<string>(availableMonths);
    incomes.forEach((inc) => {
      if (inc.monthRef) set.add(inc.monthRef);
      else if (inc.date) set.add(inc.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [availableMonths, incomes]);

  // Filter incomes for the local monthFilter (or all)
  const monthIncomes = useMemo(() => {
    if (monthFilter === 'ALL') return incomes;
    return incomes.filter((inc) => {
      return inc.monthRef === monthFilter || inc.date.startsWith(monthFilter);
    });
  }, [incomes, monthFilter]);

  // KPIs
  const stats = useMemo(() => {
    const total = monthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const count = monthIncomes.length;
    const average = count > 0 ? total / count : 0;
    const highest = monthIncomes.reduce((max, curr) => Math.max(max, curr.amount), 0);

    const catTotals: Record<string, number> = {};
    monthIncomes.forEach((inc) => {
      catTotals[inc.category] = (catTotals[inc.category] || 0) + inc.amount;
    });

    return { total, count, average, highest, catTotals };
  }, [monthIncomes]);

  // Filtered by search & category
  const filteredIncomes = useMemo(() => {
    return monthIncomes.filter((inc) => {
      const matchCat =
        selectedCategoryFilter === 'ALL' || inc.category === selectedCategoryFilter;
      const matchSearch =
        !searchTerm.trim() ||
        inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.notes && inc.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [monthIncomes, selectedCategoryFilter, searchTerm]);

  // Sorted categories by value
  const sortedCategories = useMemo(() => {
    return Object.entries(stats.catTotals)
      .map(([catId, amount]) => {
        const catObj = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: catObj?.name || catId,
          color: catObj?.color || '#10b981',
          iconName: catObj?.iconName || 'DollarSign',
          amount,
          percent: stats.total > 0 ? (amount / stats.total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [stats, categories]);

  const handleDelete = (id: string) => {
    onDeleteIncome(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-5">
      {/* Header - Clean without duplicated buttons */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Receitas & Ganhos
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(stats.total)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Salários, honorários, rendimentos e outras entradas
          </p>
        </div>
      </div>

      {/* KPI Cards: Minimalist & Clean */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Total Recebido
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(stats.total)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {stats.count} {stats.count === 1 ? 'registro' : 'registros'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Média por Entrada
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatCurrency(stats.average)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Média calculada</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Maior Entrada
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatCurrency(stats.highest)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Pico do mês</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Principal Categoria
          </span>
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-1">
            {sortedCategories[0]?.name || 'Nenhuma'}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {sortedCategories[0] ? formatCurrency(sortedCategories[0].amount) : 'R$ 0,00'}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar: Filtro por data (mês e ano) ao lado das outras buscas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
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

        {/* Filtro por Data (Mês e Ano) ao lado das outras buscas */}
        <div className="sm:col-span-4 relative flex items-center">
          <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            title="Filtrar por data (mês e ano)"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
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

        {/* Category Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              Todas as Categorias
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Income List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white text-xs">
            Lançamentos de Receita ({filteredIncomes.length})
          </h3>
        </div>

        {filteredIncomes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Nenhuma receita encontrada</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              {searchTerm || selectedCategoryFilter !== 'ALL'
                ? 'Nenhum lançamento corresponde aos filtros aplicados.'
                : 'Nenhuma receita registrada neste período.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredIncomes.map((inc) => {
              const catObj = categories.find((c) => c.id === inc.category);
              const isConfirmingDelete = deleteConfirmId === inc.id;

              return (
                <div
                  key={inc.id}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50"
                      style={{
                        backgroundColor: `${catObj?.color || '#10b981'}15`,
                        color: catObj?.color || '#10b981',
                      }}
                    >
                      <CategoryIcon
                        name={catObj?.iconName || 'DollarSign'}
                        className="w-4 h-4"
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                          {inc.description}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {catObj?.name || inc.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{formatDateBR(inc.date)}</span>
                        {inc.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{inc.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      + {formatCurrency(inc.amount)}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(inc.id)}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-medium hover:bg-rose-500"
                          >
                            Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px]"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditIncome(inc)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Editar receita"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(inc.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Excluir receita"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
