import React, { useState, useRef, useEffect } from 'react';
import {
  CreditCard,
  RefreshCw,
  LogOut,
  Settings,
  Sun,
  Moon,
  Plus,
  TrendingDown,
  DollarSign,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SpreadsheetDetails } from '../services/sheetsService';

interface NavbarProps {
  user: User | null;
  spreadsheet: SpreadsheetDetails | null;
  isSyncing: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSync: () => void;
  onOpenSettingsModal: () => void;
  onLogout: () => void;
  onOpenNewExpense?: () => void;
  onOpenNewIncome?: () => void;
  onOpenNewInvestment?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  spreadsheet,
  isSyncing,
  theme,
  onToggleTheme,
  onSync,
  onOpenSettingsModal,
  onLogout,
  onOpenNewExpense,
  onOpenNewIncome,
  onOpenNewInvestment,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    if (isAddMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddMenuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              Controle Financeiro Pessoal
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Sincronizados com Google Drive
            </p>
          </div>
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Novo Lançamento (Menu discreto, sem botões destacados espalhados pela tela) */}
          {user && (onOpenNewExpense || onOpenNewIncome || onOpenNewInvestment) && (
            <div className="relative" ref={addMenuRef}>
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium border border-transparent dark:border-slate-700/80 transition shadow-sm"
                title="Novo Lançamento"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isAddMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {onOpenNewExpense && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenNewExpense();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition"
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      <span>Nova Despesa</span>
                    </button>
                  )}
                  {onOpenNewIncome && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenNewIncome();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Nova Receita</span>
                    </button>
                  )}
                  {onOpenNewInvestment && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenNewInvestment();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      <span>Novo Investimento</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botão de Modo Escuro / Claro */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition flex items-center gap-1.5 text-xs font-medium"
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="hidden md:inline">Escuro</span>
              </>
            )}
          </button>

          {/* Sincronizar */}
          {user && (
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition disabled:opacity-50"
              title="Sincronizar abas com a planilha no Google Drive"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Atualizando...' : 'Sincronizar'}</span>
            </button>
          )}

          {/* Botão de Configurações (Abre menu vertical de listas) */}
          {user && (
            <button
              type="button"
              onClick={onOpenSettingsModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition group"
              title="Abrir Configurações e Cadastros"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">Configurações</span>
            </button>
          )}

          {/* User profile */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuário'}
                  className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-semibold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left text-xs leading-tight">
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {user.displayName || 'Usuário'}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                title="Desconectar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
