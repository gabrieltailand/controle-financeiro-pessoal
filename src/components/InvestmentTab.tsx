import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Filter,
  Calendar,
  Pencil,
  Trash2,
  Tag,
  Building2,
  X,
} from 'lucide-react';
import { InvestmentItem, InvestmentCategory } from '../types/finance';
import { formatCurrency, formatDateBR, formatMonthYearNumeric } from '../constants/financeData';
import { CategoryIcon } from './CategoryIcon';

interface InvestmentTabProps {
  investments: InvestmentItem[];
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  availableMonths?: string[];
  categories: InvestmentCategory[];
  onOpenNewInvestment: () => void;
  onEditInvestment: (item: InvestmentItem) => void;
  onDeleteInvestment: (id: string) => void;
}

export const InvestmentTab: React.FC<InvestmentTabProps> = ({
  investments,
  selectedMonth: initialSelectedMonth = 'ALL',
  availableMonths = [],
  categories,
  onOpenNewInvestment,
  onEditInvestment,
  onDeleteInvestment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Combine available months specifically from investment items and availableMonths prop
  const monthsList = useMemo(() => {
    const set = new Set<string>(availableMonths);
    investments.forEach((inv) => {
      if (inv.monthRef) set.add(inv.monthRef);
      else if (inv.date) set.add(inv.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [availableMonths, investments]);

  // Filtered by local monthFilter (strictly within Investments page)
  const monthInvestments = useMemo(() => {
    if (monthFilter === 'ALL') return investments;
    return investments.filter(
      (inv) => inv.monthRef === monthFilter || inv.date.startsWith(monthFilter)
    );
  }, [investments, monthFilter]);

  // KPIs
  const stats = useMemo(() => {
    let total = 0;
    let highest = 0;
    const categoryTotals: Record<string, number> = {};

    monthInvestments.forEach((inv) => {
      total += inv.amount;
      if (inv.amount > highest) highest = inv.amount;
      categoryTotals[inv.category] = (categoryTotals[inv.category] || 0) + inv.amount;
    });

    return {
      total,
      count: monthInvestments.length,
      average: monthInvestments.length > 0 ? total / monthInvestments.length : 0,
      highest,
      categoryTotals,
    };
  }, [monthInvestments]);

  // Sorted Categories
  const sortedCategories = useMemo(() => {
    return Object.entries(stats.categoryTotals)
      .map(([catId, amount]) => {
        const catObj = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: catObj?.name || catId,
          color: catObj?.color || '#3b82f6',
          iconName: catObj?.iconName || 'TrendingUp',
          amount,
          percent: stats.total > 0 ? (amount / stats.total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [stats, categories]);

  const handleDelete = (id: string) => {
    onDeleteInvestment(id);
    setDeleteConfirmId(null);
  };

  // Filtered list
  const filteredInvestments = useMemo(() => {
    return monthInvestments.filter((inv) => {
      const matchesSearch =
        !searchTerm.trim() ||
        inv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.institution && inv.institution.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.notes && inv.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat =
        selectedCategoryFilter === 'ALL' || inv.category === selectedCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [monthInvestments, searchTerm, selectedCategoryFilter]);

  return (
    <div className="space-y-5">
      {/* Header - Clean without highlighted buttons */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Investimentos & Aportes
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono">
              {formatCurrency(stats.total)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ações, fundos, renda fixa, cripto e outros ativos
          </p>
        </div>
      </div>

      {/* KPI Cards: Minimalist & Clean */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Total Aportado
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(stats.total)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {stats.count} {stats.count === 1 ? 'aporte' : 'aportes'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Média por Aporte
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatCurrency(stats.average)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Ticket médio</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Maior Aporte
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatCurrency(stats.highest)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Maior valor</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Principal Classe
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
            placeholder="Buscar por ativo, corretora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
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
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
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

        {/* Category Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              Todas as Classes
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {filteredInvestments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Nenhum investimento encontrado
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {searchTerm || selectedCategoryFilter !== 'ALL'
              ? 'Tente ajustar os filtros de busca ou classe.'
              : 'Nenhum aporte registrado para este período.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredInvestments.map((inv) => {
            const catObj = categories.find((c) => c.id === inv.category);
            const isDeleting = deleteConfirmId === inv.id;

            return (
              <div
                key={inv.id}
                className="py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50"
                    style={{
                      backgroundColor: `${catObj?.color || '#3b82f6'}15`,
                      color: catObj?.color || '#3b82f6',
                    }}
                  >
                    <CategoryIcon name={catObj?.iconName || 'TrendingUp'} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {inv.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>{formatDateBR(inv.date)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{catObj?.name || inv.category}</span>
                      {inv.institution && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px] text-slate-400 dark:text-slate-500">
                            {inv.institution}
                          </span>
                        </>
                      )}
                    </div>
                    {inv.notes && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {inv.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-xs sm:text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                    + {formatCurrency(inv.amount)}
                  </p>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => onEditInvestment(inv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Editar investimento"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800">
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          className="px-2 py-0.5 text-[10px] font-semibold text-white bg-rose-600 rounded hover:bg-rose-700 transition"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(inv.id)}
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
