import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Tag,
  FileSpreadsheet,
  Plus,
  Pencil,
  Trash2,
  Check,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Building2,
  Wallet,
  DollarSign,
  TrendingUp,
  Target,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';
import {
  CreditCardItem,
  CategoryOption,
  AccountItem,
  IncomeCategory,
  InvestmentCategory,
  Expense,
} from '../types/finance';
import {
  CARD_BRANDS,
  BANK_ISSUERS,
  AVAILABLE_ICONS,
  COLOR_PALETTE,
  formatCurrency,
  parseCurrencyInput,
} from '../constants/financeData';
import { CategoryIcon } from './CategoryIcon';
import { SpreadsheetDetails } from '../services/sheetsService';

export type SettingsWindow =
  | 'menu'
  | 'cards'
  | 'accounts'
  | 'categories'
  | 'income_categories'
  | 'investment_categories'
  | 'budgets'
  | 'spreadsheet';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Cards
  cards: CreditCardItem[];
  onSaveCard: (card: CreditCardItem) => void;
  onDeleteCard: (cardId: string) => void;
  // Accounts
  accounts: AccountItem[];
  onSaveAccount: (acc: AccountItem) => void;
  onDeleteAccount: (accId: string) => void;
  // Expense Categories
  categories: CategoryOption[];
  onSaveCategory: (cat: CategoryOption) => void;
  onDeleteCategory: (catId: string) => void;
  // Income Categories
  incomeCategories: IncomeCategory[];
  onSaveIncomeCategory: (cat: IncomeCategory) => void;
  onDeleteIncomeCategory: (catId: string) => void;
  // Investment Categories
  investmentCategories: InvestmentCategory[];
  onSaveInvestmentCategory: (cat: InvestmentCategory) => void;
  onDeleteInvestmentCategory: (catId: string) => void;
  // Budgets
  selectedMonth: string;
  expenses: Expense[];
  categoryBudgets: Record<string, Record<string, number>>;
  onSaveCategoryBudgets: (month: string, budgets: Record<string, number>) => void;
  // Spreadsheet
  spreadsheet: SpreadsheetDetails | null;
  onSelectSpreadsheet: (id: string) => Promise<void>;
  onCreateNewSpreadsheet: (name?: string) => Promise<void>;
  availableDriveFiles: Array<{ id: string; name: string; webViewLink?: string }>;
  isRefreshingFiles: boolean;
  onRefreshDriveFiles: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cards,
  onSaveCard,
  onDeleteCard,
  accounts,
  onSaveAccount,
  onDeleteAccount,
  categories,
  onSaveCategory,
  onDeleteCategory,
  incomeCategories,
  onSaveIncomeCategory,
  onDeleteIncomeCategory,
  investmentCategories,
  onSaveInvestmentCategory,
  onDeleteInvestmentCategory,
  selectedMonth,
  expenses,
  categoryBudgets,
  onSaveCategoryBudgets,
  spreadsheet,
  onSelectSpreadsheet,
  onCreateNewSpreadsheet,
  availableDriveFiles,
  isRefreshingFiles,
  onRefreshDriveFiles,
}) => {
  const [currentWindow, setCurrentWindow] = useState<SettingsWindow>('menu');

  // --- CARDS STATE ---
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState('Mastercard');
  const [cardBank, setCardBank] = useState('Nubank');
  const [cardColor, setCardColor] = useState(COLOR_PALETTE[0]);
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);

  // --- ACCOUNTS STATE ---
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [accName, setAccName] = useState('');
  const [accBank, setAccBank] = useState('Nubank');
  const [accColor, setAccColor] = useState(COLOR_PALETTE[1]);
  const [isAccFormOpen, setIsAccFormOpen] = useState(false);

  // --- EXPENSE CATEGORY STATE ---
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('ShoppingCart');
  const [catColor, setCatColor] = useState(COLOR_PALETTE[0]);
  const [isCatFormOpen, setIsCatFormOpen] = useState(false);

  // --- INCOME CATEGORY STATE ---
  const [editingIncCatId, setEditingIncCatId] = useState<string | null>(null);
  const [incCatName, setIncCatName] = useState('');
  const [incCatIcon, setIncCatIcon] = useState('DollarSign');
  const [incCatColor, setIncCatColor] = useState(COLOR_PALETTE[0]);
  const [isIncCatFormOpen, setIsIncCatFormOpen] = useState(false);

  // --- INVESTMENT CATEGORY STATE ---
  const [editingInvCatId, setEditingInvCatId] = useState<string | null>(null);
  const [invCatName, setInvCatName] = useState('');
  const [invCatIcon, setInvCatIcon] = useState('TrendingUp');
  const [invCatColor, setInvCatColor] = useState(COLOR_PALETTE[1]);
  const [isInvCatFormOpen, setIsInvCatFormOpen] = useState(false);

  // --- BUDGETS STATE ---
  const currentMonthBudgets = categoryBudgets[selectedMonth] || {};
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});

  // --- SPREADSHEET STATE ---
  const [manualSheetId, setManualSheetId] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [loadingSheetAction, setLoadingSheetAction] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handlers for Cards
  const handleOpenNewCard = () => {
    setEditingCardId(null);
    setCardName('');
    setCardBrand('Mastercard');
    setCardBank('Nubank');
    setCardColor(COLOR_PALETTE[0]);
    setIsCardFormOpen(true);
  };

  const handleEditCard = (card: CreditCardItem) => {
    setEditingCardId(card.id);
    setCardName(card.name);
    setCardBrand(card.brand || 'Mastercard');
    setCardBank(card.bank || 'Nubank');
    setCardColor(card.color || COLOR_PALETTE[0]);
    setIsCardFormOpen(true);
  };

  const handleSaveCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;

    onSaveCard({
      id: editingCardId || `card_${Date.now()}`,
      name: cardName.trim(),
      brand: cardBrand,
      bank: cardBank,
      color: cardColor,
    });
    setIsCardFormOpen(false);
  };

  // Handlers for Accounts
  const handleOpenNewAccount = () => {
    setEditingAccId(null);
    setAccName('');
    setAccBank('Nubank');
    setAccColor(COLOR_PALETTE[1]);
    setIsAccFormOpen(true);
  };

  const handleEditAccount = (acc: AccountItem) => {
    setEditingAccId(acc.id);
    setAccName(acc.name);
    setAccBank(acc.bank || 'Nubank');
    setAccColor(acc.color || COLOR_PALETTE[1]);
    setIsAccFormOpen(true);
  };

  const handleSaveAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    onSaveAccount({
      id: editingAccId || `acc_${Date.now()}`,
      name: accName.trim(),
      bank: accBank,
      color: accColor,
    });
    setIsAccFormOpen(false);
  };

  // Handlers for Expense Categories
  const handleOpenNewCat = () => {
    setEditingCatId(null);
    setCatName('');
    setCatIcon('ShoppingCart');
    setCatColor(COLOR_PALETTE[0]);
    setIsCatFormOpen(true);
  };

  const handleEditCat = (cat: CategoryOption) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatIcon(cat.iconName || 'ShoppingCart');
    setCatColor(cat.color || COLOR_PALETTE[0]);
    setIsCatFormOpen(true);
  };

  const handleSaveCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    onSaveCategory({
      id: editingCatId || `cat_${Date.now()}`,
      name: catName.trim(),
      iconName: catIcon,
      color: catColor,
      bgClass: `bg-[${catColor}]/10 text-[${catColor}] border-[${catColor}]/20`,
      textClass: `text-[${catColor}]`,
      borderClass: `border-[${catColor}]/30`,
    });
    setIsCatFormOpen(false);
  };

  // Handlers for Income Categories
  const handleOpenNewIncCat = () => {
    setEditingIncCatId(null);
    setIncCatName('');
    setIncCatIcon('DollarSign');
    setIncCatColor(COLOR_PALETTE[0]);
    setIsIncCatFormOpen(true);
  };

  const handleEditIncCat = (cat: IncomeCategory) => {
    setEditingIncCatId(cat.id);
    setIncCatName(cat.name);
    setIncCatIcon(cat.iconName || 'DollarSign');
    setIncCatColor(cat.color || COLOR_PALETTE[0]);
    setIsIncCatFormOpen(true);
  };

  const handleSaveIncCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incCatName.trim()) return;

    onSaveIncomeCategory({
      id: editingIncCatId || `inc_cat_${Date.now()}`,
      name: incCatName.trim(),
      iconName: incCatIcon,
      color: incCatColor,
    });
    setIsIncCatFormOpen(false);
  };

  // Handlers for Investment Categories
  const handleOpenNewInvCat = () => {
    setEditingInvCatId(null);
    setInvCatName('');
    setInvCatIcon('TrendingUp');
    setInvCatColor(COLOR_PALETTE[1]);
    setIsInvCatFormOpen(true);
  };

  const handleEditInvCat = (cat: InvestmentCategory) => {
    setEditingInvCatId(cat.id);
    setInvCatName(cat.name);
    setInvCatIcon(cat.iconName || 'TrendingUp');
    setInvCatColor(cat.color || COLOR_PALETTE[1]);
    setIsInvCatFormOpen(true);
  };

  const handleSaveInvCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCatName.trim()) return;

    onSaveInvestmentCategory({
      id: editingInvCatId || `inv_cat_${Date.now()}`,
      name: invCatName.trim(),
      iconName: invCatIcon,
      color: invCatColor,
    });
    setIsInvCatFormOpen(false);
  };

  // Budgets save
  const handleSaveBudgets = () => {
    const updated: Record<string, number> = { ...currentMonthBudgets };
    Object.entries(budgetInputs).forEach(([catId, val]) => {
      const num = parseCurrencyInput(val);
      if (num > 0) {
        updated[catId] = num;
      } else {
        delete updated[catId];
      }
    });
    onSaveCategoryBudgets(selectedMonth, updated);
    setCurrentWindow('menu');
  };

  // Spreadsheet actions
  const handleLinkExisting = async (sheetId: string) => {
    setSheetError(null);
    setLoadingSheetAction(sheetId);
    try {
      await onSelectSpreadsheet(sheetId);
    } catch (err: unknown) {
      setSheetError(err instanceof Error ? err.message : 'Erro ao conectar planilha.');
    } finally {
      setLoadingSheetAction(null);
    }
  };

  const handleCreateNew = async () => {
    setSheetError(null);
    setLoadingSheetAction('new');
    try {
      await onCreateNewSpreadsheet(newSheetTitle.trim() || undefined);
      setNewSheetTitle('');
    } catch (err: unknown) {
      setSheetError(err instanceof Error ? err.message : 'Erro ao criar nova planilha.');
    } finally {
      setLoadingSheetAction(null);
    }
  };

  // Menu items list
  const menuItems = [
    {
      id: 'cards' as SettingsWindow,
      title: 'Cartões de Crédito',
      desc: 'Gerenciar cartões cadastrados, bandeiras e bancos',
      icon: CreditCard,
      badge: `${cards.length} cartões`,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      id: 'accounts' as SettingsWindow,
      title: 'Bancos & Contas',
      desc: 'Gerenciar contas correntes, contas digitais e carteiras',
      icon: Building2,
      badge: `${accounts.length} contas`,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'categories' as SettingsWindow,
      title: 'Categorias de Despesas',
      desc: 'Personalizar categorias de gastos, ícones e cores',
      icon: Tag,
      badge: `${categories.length} categorias`,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'income_categories' as SettingsWindow,
      title: 'Categorias de Receitas',
      desc: 'Personalizar fontes e tipos de receita',
      icon: DollarSign,
      badge: `${incomeCategories.length} categorias`,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'investment_categories' as SettingsWindow,
      title: 'Categorias de Investimentos',
      desc: 'Classes de ativos e aplicações financeiras',
      icon: TrendingUp,
      badge: `${investmentCategories.length} categorias`,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: 'budgets' as SettingsWindow,
      title: 'Orçamento por Categoria',
      desc: 'Definir metas e limites mensais de gastos por categoria',
      icon: Target,
      badge: 'Metas',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
    {
      id: 'spreadsheet' as SettingsWindow,
      title: 'Planilha Google Drive',
      desc: 'Abas sincronizadas (Despesas, Receitas, Investimentos, etc.)',
      icon: FileSpreadsheet,
      badge: spreadsheet ? 'Conectada' : 'Pendente',
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentWindow !== 'menu' && (
              <button
                type="button"
                onClick={() => setCurrentWindow('menu')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Voltar ao menu de configurações"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {currentWindow === 'menu' && 'Configurações do Sistema'}
                {currentWindow === 'cards' && 'Cartões de Crédito'}
                {currentWindow === 'accounts' && 'Bancos & Contas'}
                {currentWindow === 'categories' && 'Categorias de Despesas'}
                {currentWindow === 'income_categories' && 'Categorias de Receitas'}
                {currentWindow === 'investment_categories' && 'Categorias de Investimentos'}
                {currentWindow === 'budgets' && 'Orçamento por Categoria'}
                {currentWindow === 'spreadsheet' && 'Planilha Google Drive'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentWindow === 'menu' && 'Escolha uma opção para abrir sua janela de gerenciamento'}
                {currentWindow !== 'menu' && 'Todos os cadastros são sincronizados com sua planilha no Google Drive'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body based on active window */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* ========================================================= */}
          {/* WINDOW: MENU VERTICAL COM LISTAS */}
          {/* ========================================================= */}
          {currentWindow === 'menu' && (
            <div className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentWindow(item.id)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition" />
                  </button>
                );
              })}
            </div>
          )}

          {/* ========================================================= */}
          {/* WINDOW: CARTÕES DE CRÉDITO */}
          {/* ========================================================= */}
          {currentWindow === 'cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Cartões registrados ({cards.length})
                </span>
                {!isCardFormOpen && (
                  <button
                    type="button"
                    onClick={handleOpenNewCard}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5 border border-transparent dark:border-slate-700/80 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Cartão</span>
                  </button>
                )}
              </div>

              {isCardFormOpen && (
                <form
                  onSubmit={handleSaveCardSubmit}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3"
                >
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {editingCardId ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Nome do Cartão
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Nubank Ultravioleta"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Banco / Instituição
                      </label>
                      <select
                        value={cardBank}
                        onChange={(e) => setCardBank(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        {BANK_ISSUERS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Bandeira
                      </label>
                      <select
                        value={cardBrand}
                        onChange={(e) => setCardBrand(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        {CARD_BRANDS.map((br) => (
                          <option key={br} value={br}>{br}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Cor de Identificação
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {COLOR_PALETTE.slice(0, 8).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCardColor(c)}
                            className={`w-6 h-6 rounded-full transition-transform ${cardColor === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCardFormOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Salvar Cartão
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {cards.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: c.color }}
                      >
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {c.bank} • {c.brand}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditCard(c)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCard(c.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* WINDOW: BANCOS & CONTAS */}
          {/* ========================================================= */}
          {currentWindow === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Contas cadastradas ({accounts.length})
                </span>
                {!isAccFormOpen && (
                  <button
                    type="button"
                    onClick={handleOpenNewAccount}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5 border border-transparent dark:border-slate-700/80 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Conta/Banco</span>
                  </button>
                )}
              </div>

              {isAccFormOpen && (
                <form
                  onSubmit={handleSaveAccountSubmit}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3"
                >
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {editingAccId ? 'Editar Conta' : 'Nova Conta Bancária'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Nome da Conta
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Conta Corrente Itaú"
                        value={accName}
                        onChange={(e) => setAccName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Banco
                      </label>
                      <select
                        value={accBank}
                        onChange={(e) => setAccBank(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        {BANK_ISSUERS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAccFormOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Salvar Conta
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: a.color }}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{a.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{a.bank}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditAccount(a)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAccount(a.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* WINDOW: CATEGORIAS DE DESPESAS */}
          {/* ========================================================= */}
          {currentWindow === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Categorias ({categories.length})
                </span>
                {!isCatFormOpen && (
                  <button
                    type="button"
                    onClick={handleOpenNewCat}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5 border border-transparent dark:border-slate-700/80 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Categoria</span>
                  </button>
                )}
              </div>

              {isCatFormOpen && (
                <form
                  onSubmit={handleSaveCatSubmit}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3"
                >
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {editingCatId ? 'Editar Categoria' : 'Nova Categoria'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Nome da Categoria
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Assinaturas & Streaming"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Ícone
                      </label>
                      <select
                        value={catIcon}
                        onChange={(e) => setCatIcon(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        {AVAILABLE_ICONS.map((i) => (
                          <option key={i.id} value={i.id}>{i.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCatFormOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Salvar Categoria
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${c.color}20`, color: c.color }}
                      >
                        <CategoryIcon name={c.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditCat(c)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(c.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* WINDOW: CATEGORIAS DE RECEITAS */}
          {/* ========================================================= */}
          {currentWindow === 'income_categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Categorias de Receita ({incomeCategories.length})
                </span>
                {!isIncCatFormOpen && (
                  <button
                    type="button"
                    onClick={handleOpenNewIncCat}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5 border border-transparent dark:border-slate-700/80 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Categoria</span>
                  </button>
                )}
              </div>

              {isIncCatFormOpen && (
                <form
                  onSubmit={handleSaveIncCatSubmit}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3"
                >
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {editingIncCatId ? 'Editar Categoria de Receita' : 'Nova Categoria de Receita'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Nome da Categoria
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Salário, Dividendos, Aluguel"
                        value={incCatName}
                        onChange={(e) => setIncCatName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Cor
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {COLOR_PALETTE.slice(0, 6).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setIncCatColor(c)}
                            className={`w-5 h-5 rounded-full transition-transform ${incCatColor === c ? 'scale-125 ring-2 ring-emerald-500' : ''}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsIncCatFormOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {incomeCategories.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${c.color}20`, color: c.color }}
                      >
                        <CategoryIcon name={c.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditIncCat(c)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteIncomeCategory(c.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* WINDOW: CATEGORIAS DE INVESTIMENTOS */}
          {/* ========================================================= */}
          {currentWindow === 'investment_categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Classes de Investimento ({investmentCategories.length})
                </span>
                {!isInvCatFormOpen && (
                  <button
                    type="button"
                    onClick={handleOpenNewInvCat}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5 border border-transparent dark:border-slate-700/80 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Classe/Categoria</span>
                  </button>
                )}
              </div>

              {isInvCatFormOpen && (
                <form
                  onSubmit={handleSaveInvCatSubmit}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3"
                >
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {editingInvCatId ? 'Editar Classe de Ativo' : 'Nova Classe de Investimento'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Nome da Classe
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Renda Fixa, Ações, FIIs"
                        value={invCatName}
                        onChange={(e) => setInvCatName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Cor
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {COLOR_PALETTE.slice(0, 6).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setInvCatColor(c)}
                            className={`w-5 h-5 rounded-full transition-transform ${invCatColor === c ? 'scale-125 ring-2 ring-blue-500' : ''}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsInvCatFormOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {investmentCategories.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${c.color}20`, color: c.color }}
                      >
                        <CategoryIcon name={c.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditInvCat(c)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteInvestmentCategory(c.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* WINDOW: ORÇAMENTO POR CATEGORIA */}
          {/* ========================================================= */}
          {currentWindow === 'budgets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Definir Teto de Gastos ({selectedMonth})
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Insira o limite para cada categoria de despesa
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveBudgets}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                >
                  Salvar Metas
                </button>
              </div>

              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {categories.map((c) => {
                  const currentLimit = currentMonthBudgets[c.id] || 0;
                  const inputValue =
                    budgetInputs[c.id] !== undefined
                      ? budgetInputs[c.id]
                      : currentLimit > 0
                      ? String(currentLimit).replace('.', ',')
                      : '';

                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${c.color}20`, color: c.color }}
                        >
                          <CategoryIcon name={c.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {c.name}
                        </span>
                      </div>

                      <div className="relative w-36">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">
                          R$
                        </span>
                        <input
                          type="text"
                          placeholder="0,00"
                          value={inputValue}
                          onChange={(e) =>
                            setBudgetInputs((prev) => ({
                              ...prev,
                              [c.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-right font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* WINDOW: PLANILHA GOOGLE DRIVE & ABAS */}
          {/* ========================================================= */}
          {currentWindow === 'spreadsheet' && (
            <div className="space-y-4">
              {sheetError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sheetError}</span>
                </div>
              )}

              {/* Connected details */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Planilha Conectada
                  </span>
                  {spreadsheet && (
                    <a
                      href={spreadsheet.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                    >
                      <span>Abrir no Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {spreadsheet ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {spreadsheet.title}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      ID: {spreadsheet.id}
                    </p>

                    {/* 6 Tabs status */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Abas sincronizadas no Google Drive:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { name: 'Despesas', icon: CreditCard },
                          { name: 'Receitas', icon: DollarSign },
                          { name: 'Investimentos', icon: TrendingUp },
                          { name: 'Categorias', icon: Tag },
                          { name: 'Bancos', icon: Building2 },
                          { name: 'Cartões', icon: Wallet },
                        ].map((t) => (
                          <div
                            key={t.name}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{t.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nenhuma planilha conectada no momento.
                  </p>
                )}
              </div>

              {/* Create or Switch Sheet */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Criar Nova Planilha com todas as Abas
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nome da nova planilha (opcional)"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={loadingSheetAction === 'new'}
                    onClick={handleCreateNew}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition disabled:opacity-50 shrink-0 border border-transparent dark:border-slate-700/80 shadow-sm"
                  >
                    {loadingSheetAction === 'new' ? 'Criando...' : 'Criar Planilha'}
                  </button>
                </div>
              </div>

              {/* Drive files */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Planilhas Encontradas no seu Google Drive
                  </h4>
                  <button
                    type="button"
                    onClick={onRefreshDriveFiles}
                    disabled={isRefreshingFiles}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Recarregar arquivos"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingFiles ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableDriveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-medium text-slate-900 dark:text-white truncate">
                        {file.name}
                      </span>
                      {spreadsheet?.id === file.id ? (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                          Ativa
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLinkExisting(file.id)}
                          disabled={loadingSheetAction === file.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition"
                        >
                          {loadingSheetAction === file.id ? 'Conectando...' : 'Conectar'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
