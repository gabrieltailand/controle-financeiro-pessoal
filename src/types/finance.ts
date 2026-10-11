export type PaymentType = 'avista' | 'credito';
export type PaymentSource = 'cartao' | 'conta';

export interface CreditCardItem {
  id: string;
  name: string; // Ex: Nubank Ultravioleta
  brand: string; // Ex: Mastercard, Visa, Elo, American Express, Hipercard, Outra
  bank: string; // Ex: Nubank, Itaú, Bradesco, Inter, Santander, XP, C6
  color: string;
  lastDigits?: string;
}

export interface AccountItem {
  id: string;
  name: string; // Ex: Conta Corrente Itaú, Carteira Pix, Dinheiro
  bank: string;
  color: string;
}

export interface Expense {
  id: string;
  rowIndex?: number; // Row index in Google Sheets (1-based, 2 is first data row)
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // in BRL (e.g. 150.50)
  type: PaymentType;
  source?: PaymentSource; // 'cartao' ou 'conta'
  installments?: string; // e.g. "1/1", "2/6" or "À Vista"
  installmentCount?: number;
  currentInstallment?: number;
  card: string; // e.g. "Nubank (Mastercard)" ou "Conta Itaú"
  category: string; // e.g. "Alimentação", "Transporte"
  monthRef: string; // YYYY-MM
  notes?: string;
  createdAt: string;
}

export interface ExpenseInput {
  date: string;
  description: string;
  amount: number;
  type: PaymentType;
  source?: PaymentSource;
  installmentCount?: number;
  card: string;
  category: string;
  notes?: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  iconName: string;
  color: string;
  bgClass?: string;
  textClass?: string;
  borderClass?: string;
}

export interface CardOption {
  id: string;
  name: string;
  color: string;
  lastDigits?: string;
  brand?: string;
  bank?: string;
}

export interface MonthlyStats {
  total: number;
  creditTotal: number;
  cashTotal: number;
  count: number;
  categoryTotals: Record<string, number>;
  cardTotals: Record<string, number>;
}

export interface IncomeItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  monthRef: string; // YYYY-MM
  notes?: string;
  createdAt: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  iconName: string;
  color: string;
}

export interface InvestmentItem {
  id: string;
  description: string;
  amount: number;
  category: string; // Tipo de investimento: Renda Fixa, Ações, FIIs, etc.
  date: string; // YYYY-MM-DD
  monthRef: string; // YYYY-MM
  institution?: string; // XP, NuInvest, Banco Inter, etc.
  notes?: string;
  createdAt: string;
}

export interface InvestmentCategory {
  id: string;
  name: string;
  iconName: string;
  color: string;
}
