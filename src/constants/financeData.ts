import {
  CategoryOption,
  CreditCardItem,
  AccountItem,
  IncomeItem,
  IncomeCategory,
  InvestmentItem,
  InvestmentCategory,
} from '../types/finance';

export const CARD_BRANDS = [
  'Mastercard',
  'Visa',
  'Elo',
  'American Express',
  'Hipercard',
  'Outra',
];

export const BANK_ISSUERS = [
  'Nubank',
  'Itaú',
  'Bradesco',
  'Banco Inter',
  'Santander',
  'XP Investimentos',
  'C6 Bank',
  'Caixa Econômica',
  'Banco do Brasil',
  'BTG Pactual',
  'PicPay',
  'Outro Banco',
];

export const AVAILABLE_ICONS = [
  { id: 'ShoppingCart', label: 'Carrinho de Compras' },
  { id: 'Utensils', label: 'Restaurante / Alimentação' },
  { id: 'Car', label: 'Carro / Transporte' },
  { id: 'Home', label: 'Casa / Moradia' },
  { id: 'ShoppingBag', label: 'Bolsa de Compras' },
  { id: 'Sparkles', label: 'Lazer & Entretenimento' },
  { id: 'HeartPulse', label: 'Saúde & Farmácia' },
  { id: 'Tv', label: 'Streaming & TV' },
  { id: 'GraduationCap', label: 'Educação' },
  { id: 'CreditCard', label: 'Cartão de Crédito' },
  { id: 'Wallet', label: 'Carteira / Dinheiro' },
  { id: 'MoreHorizontal', label: 'Outros' },
];

export const COLOR_PALETTE = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#8a05be', // nubank purple
  '#ec7000', // itau orange
  '#ff7a00', // inter orange
  '#111827', // dark
  '#64748b', // slate
];

export const DEFAULT_CREDIT_CARDS: CreditCardItem[] = [
  {
    id: 'card_nubank',
    name: 'Nubank Ultravioleta',
    brand: 'Mastercard',
    bank: 'Nubank',
    color: '#8a05be',
  },
  {
    id: 'card_itau',
    name: 'Itaú Black',
    brand: 'Visa',
    bank: 'Itaú',
    color: '#ec7000',
  },
  {
    id: 'card_xp',
    name: 'XP Visa Infinite',
    brand: 'Visa',
    bank: 'XP Investimentos',
    color: '#111827',
  },
  {
    id: 'card_inter',
    name: 'Inter Black',
    brand: 'Mastercard',
    bank: 'Banco Inter',
    color: '#ff7a00',
  },
  {
    id: 'card_c6',
    name: 'C6 Carbon',
    brand: 'Mastercard',
    bank: 'C6 Bank',
    color: '#242424',
  },
];

export const DEFAULT_ACCOUNTS: AccountItem[] = [
  {
    id: 'acc_nubank',
    name: 'Conta Nubank',
    bank: 'Nubank',
    color: '#8a05be',
  },
  {
    id: 'acc_itau',
    name: 'Conta Itaú',
    bank: 'Itaú',
    color: '#ec7000',
  },
  {
    id: 'acc_pix',
    name: 'Pix / Dinheiro',
    bank: 'Pix',
    color: '#059669',
  },
];

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  {
    id: 'Supermercado',
    name: 'Supermercado & Feira',
    iconName: 'ShoppingCart',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
  },
  {
    id: 'Alimentação',
    name: 'Alimentação & Restaurantes',
    iconName: 'Utensils',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  {
    id: 'Transporte',
    name: 'Transporte & Combustível',
    iconName: 'Car',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
  },
  {
    id: 'Moradia',
    name: 'Moradia & Contas',
    iconName: 'Home',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
  },
  {
    id: 'Compras',
    name: 'Compras & Vestuário',
    iconName: 'ShoppingBag',
    color: '#ec4899',
    bgClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    textClass: 'text-pink-400',
    borderClass: 'border-pink-500/30',
  },
  {
    id: 'Lazer',
    name: 'Lazer & Viagens',
    iconName: 'Sparkles',
    color: '#06b6d4',
    bgClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/30',
  },
  {
    id: 'Saúde',
    name: 'Saúde & Farmácia',
    iconName: 'HeartPulse',
    color: '#ef4444',
    bgClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
  },
  {
    id: 'Assinaturas',
    name: 'Streaming & Assinaturas',
    iconName: 'Tv',
    color: '#6366f1',
    bgClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    textClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/30',
  },
  {
    id: 'Educação',
    name: 'Educação & Cursos',
    iconName: 'GraduationCap',
    color: '#14b8a6',
    bgClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    textClass: 'text-teal-400',
    borderClass: 'border-teal-500/30',
  },
  {
    id: 'Outros',
    name: 'Outros & Imprevistos',
    iconName: 'MoreHorizontal',
    color: '#94a3b8',
    bgClass: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-500/30',
  },
];

// Categorias Padrão de Receitas
export const DEFAULT_INCOME_CATEGORIES: IncomeCategory[] = [
  {
    id: 'Salário',
    name: 'Salário & Remuneração',
    iconName: 'Briefcase',
    color: '#10b981', // emerald
  },
  {
    id: 'Freelance',
    name: 'Freelance & Consultoria',
    iconName: 'Sparkles',
    color: '#06b6d4', // cyan
  },
  {
    id: 'Rendimentos',
    name: 'Rendimentos & Dividendos',
    iconName: 'TrendingUp',
    color: '#3b82f6', // blue
  },
  {
    id: 'Vendas',
    name: 'Vendas & Negócios',
    iconName: 'ShoppingBag',
    color: '#f59e0b', // amber
  },
  {
    id: 'Reembolso',
    name: 'Reembolso & Devolução',
    iconName: 'ArrowDownCircle',
    color: '#8b5cf6', // purple
  },
  {
    id: 'Bonificação',
    name: 'Bônus & Presente',
    iconName: 'Gift',
    color: '#ec4899', // pink
  },
  {
    id: 'Outras Receitas',
    name: 'Outras Receitas',
    iconName: 'DollarSign',
    color: '#64748b', // slate
  },
];

// Categorias Padrão de Investimentos
export const DEFAULT_INVESTMENT_CATEGORIES: InvestmentCategory[] = [
  {
    id: 'Renda Fixa',
    name: 'Renda Fixa (CDB, LCI, LCA)',
    iconName: 'Building2',
    color: '#10b981', // emerald
  },
  {
    id: 'Tesouro Direto',
    name: 'Tesouro Direto',
    iconName: 'Landmark',
    color: '#3b82f6', // blue
  },
  {
    id: 'Ações',
    name: 'Ações (B3 & Globais)',
    iconName: 'TrendingUp',
    color: '#8b5cf6', // purple
  },
  {
    id: 'FIIs',
    name: 'Fundos Imobiliários (FIIs)',
    iconName: 'Home',
    color: '#06b6d4', // cyan
  },
  {
    id: 'Criptomoedas',
    name: 'Criptomoedas (Bitcoin, ETH)',
    iconName: 'Coins',
    color: '#f59e0b', // amber
  },
  {
    id: 'Reserva de Emergência',
    name: 'Reserva de Emergência',
    iconName: 'ShieldCheck',
    color: '#14b8a6', // teal
  },
  {
    id: 'Previdência Privada',
    name: 'Previdência Privada',
    iconName: 'Clock',
    color: '#ec4899', // pink
  },
  {
    id: 'ETFs & Fundos',
    name: 'ETFs & Fundos Multimercado',
    iconName: 'PieChart',
    color: '#6366f1', // indigo
  },
  {
    id: 'Outros Investimentos',
    name: 'Outros Investimentos',
    iconName: 'MoreHorizontal',
    color: '#64748b', // slate
  },
];

// LocalStorage keys
const STORAGE_CARDS = 'carteira_credit_cards';
const STORAGE_ACCOUNTS = 'carteira_bank_accounts';
const STORAGE_CATEGORIES = 'carteira_categories';
const STORAGE_INCOME_CATEGORIES = 'carteira_income_categories';
const STORAGE_INVESTMENT_CATEGORIES = 'carteira_investment_categories';
const STORAGE_INCOMES = 'carteira_incomes_list';
const STORAGE_INVESTMENTS = 'carteira_investments_list';
const STORAGE_MONTHLY_BUDGETS = 'carteira_monthly_budgets';
const STORAGE_CATEGORY_BUDGETS = 'carteira_category_budgets';

export const getStoredMonthlyBudgets = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(STORAGE_MONTHLY_BUDGETS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored monthly budgets:', e);
  }
  return {};
};

export const saveStoredMonthlyBudgets = (budgets: Record<string, number>) => {
  localStorage.setItem(STORAGE_MONTHLY_BUDGETS, JSON.stringify(budgets));
};

export const getStoredCategoryBudgets = (): Record<string, Record<string, number>> => {
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORY_BUDGETS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored category budgets:', e);
  }
  return {};
};

export const saveStoredCategoryBudgets = (
  budgets: Record<string, Record<string, number>>
) => {
  localStorage.setItem(STORAGE_CATEGORY_BUDGETS, JSON.stringify(budgets));
};

export const getStoredCreditCards = (): CreditCardItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_CARDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored cards:', e);
  }
  return DEFAULT_CREDIT_CARDS;
};

export const saveStoredCreditCards = (cards: CreditCardItem[]) => {
  localStorage.setItem(STORAGE_CARDS, JSON.stringify(cards));
};

export const getStoredAccounts = (): AccountItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored accounts:', e);
  }
  return DEFAULT_ACCOUNTS;
};

export const saveStoredAccounts = (accounts: AccountItem[]) => {
  localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(accounts));
};

export const getStoredCategories = (): CategoryOption[] => {
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored categories:', e);
  }
  return DEFAULT_CATEGORIES;
};

export const saveStoredCategories = (categories: CategoryOption[]) => {
  localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories));
};

export const getStoredIncomeCategories = (): IncomeCategory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_INCOME_CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored income categories:', e);
  }
  return DEFAULT_INCOME_CATEGORIES;
};

export const saveStoredIncomeCategories = (categories: IncomeCategory[]) => {
  localStorage.setItem(STORAGE_INCOME_CATEGORIES, JSON.stringify(categories));
};

export const getStoredInvestmentCategories = (): InvestmentCategory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_INVESTMENT_CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored investment categories:', e);
  }
  return DEFAULT_INVESTMENT_CATEGORIES;
};

export const saveStoredInvestmentCategories = (categories: InvestmentCategory[]) => {
  localStorage.setItem(STORAGE_INVESTMENT_CATEGORIES, JSON.stringify(categories));
};

// Initial sample incomes
const getInitialIncomes = (): IncomeItem[] => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dayStr = String(now.getDate()).padStart(2, '0');
  return [
    {
      id: 'inc_sample_1',
      description: 'Salário Mensal',
      amount: 6500.0,
      category: 'Salário',
      date: `${currentMonth}-${dayStr}`,
      monthRef: currentMonth,
      notes: 'Depósito em conta corrente',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_sample_2',
      description: 'Consultoria Web / Freelance',
      amount: 1400.0,
      category: 'Freelance',
      date: `${currentMonth}-${dayStr}`,
      monthRef: currentMonth,
      notes: 'Projeto recebido via Pix',
      createdAt: new Date().toISOString(),
    },
  ];
};

// Initial sample investments
const getInitialInvestments = (): InvestmentItem[] => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dayStr = String(now.getDate()).padStart(2, '0');
  return [
    {
      id: 'inv_sample_1',
      description: 'CDB 110% CDI Liquidez Diária',
      amount: 1000.0,
      category: 'Renda Fixa',
      institution: 'Banco Inter',
      date: `${currentMonth}-${dayStr}`,
      monthRef: currentMonth,
      notes: 'Aporte reserva de emergência',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inv_sample_2',
      description: 'Tesouro IPCA+ 2035',
      amount: 500.0,
      category: 'Tesouro Direto',
      institution: 'Tesouro Direto / NuInvest',
      date: `${currentMonth}-${dayStr}`,
      monthRef: currentMonth,
      notes: 'Aporte de longo prazo',
      createdAt: new Date().toISOString(),
    },
  ];
};

export const getStoredIncomes = (): IncomeItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_INCOMES);
    if (raw) return JSON.parse(raw);
    const initial = getInitialIncomes();
    saveStoredIncomes(initial);
    return initial;
  } catch (e) {
    console.warn('Error reading stored incomes:', e);
    return getInitialIncomes();
  }
};

export const saveStoredIncomes = (incomes: IncomeItem[]) => {
  localStorage.setItem(STORAGE_INCOMES, JSON.stringify(incomes));
};

export const getStoredInvestments = (): InvestmentItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_INVESTMENTS);
    if (raw) return JSON.parse(raw);
    const initial = getInitialInvestments();
    saveStoredInvestments(initial);
    return initial;
  } catch (e) {
    console.warn('Error reading stored investments:', e);
    return getInitialInvestments();
  }
};

export const saveStoredInvestments = (investments: InvestmentItem[]) => {
  localStorage.setItem(STORAGE_INVESTMENTS, JSON.stringify(investments));
};

// Legacy exports for backwards compatibility
export const CATEGORIES = DEFAULT_CATEGORIES;
export const DEFAULT_CARDS = DEFAULT_CREDIT_CARDS.map((c) => ({
  id: c.id,
  name: c.name,
  color: c.color,
}));

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

/**
 * Parses user input into a valid number, accepting Brazilian comma format (ex: '25,50' ou '1.250,50')
 * as well as standard dot format (ex: '25.50').
 */
export const parseCurrencyInput = (val: string | number | undefined | null): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim();
  if (!str) return 0;

  // If contains both '.' and ',' (e.g. 1.250,50 or 1,250.50)
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // Brazilian format: 1.250,50 -> remove dots, replace comma with dot
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,250.50 -> remove commas
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only comma: 25,50 -> 25.50
    str = str.replace(',', '.');
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const formatMonthYear = (monthRef: string): string => {
  if (!monthRef) return '';
  const [year, month] = monthRef.split('-');
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const idx = parseInt(month, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${monthNames[idx]} de ${year}`;
  }
  return monthRef;
};

/**
 * Formats YYYY-MM into MM/YYYY (e.g. "2026-10" -> "10/2026")
 */
export const formatMonthYearNumeric = (monthRef: string): string => {
  if (!monthRef) return '';
  if (monthRef === 'ALL') return 'Todos';
  const parts = monthRef.split('-');
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  return monthRef;
};
