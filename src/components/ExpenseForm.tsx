import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CreditCard,
  Layers,
  Sparkles,
  Edit3,
  Wallet,
  Building2,
  FileText,
} from 'lucide-react';
import {
  Expense,
  ExpenseInput,
  PaymentType,
  PaymentSource,
  CreditCardItem,
  AccountItem,
  CategoryOption,
} from '../types/finance';
import {
  DEFAULT_CREDIT_CARDS,
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  formatCurrency,
  parseCurrencyInput,
} from '../constants/financeData';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseFormProps {
  onAddExpense?: (input: ExpenseInput) => Promise<void>;
  onUpdateExpense?: (updated: Expense) => Promise<void>;
  initialExpense?: Expense | null;
  cards?: CreditCardItem[];
  accounts?: AccountItem[];
  categories?: CategoryOption[];
  isSubmitting: boolean;
  isModal?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  onAddExpense,
  onUpdateExpense,
  initialExpense = null,
  cards = DEFAULT_CREDIT_CARDS,
  accounts = DEFAULT_ACCOUNTS,
  categories = DEFAULT_CATEGORIES,
  isSubmitting,
  isModal = false,
}) => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const isEditing = !!initialExpense;

  const [paymentOrigin, setPaymentOrigin] = useState<PaymentSource>('cartao');
  const [cardInstallmentMode, setCardInstallmentMode] = useState<'1x' | 'parcelado'>('1x');
  const [installmentCount, setInstallmentCount] = useState(2);

  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [description, setDescription] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || 'card_nubank');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'acc_nubank');
  const [category, setCategory] = useState<string>(categories[0]?.id || 'Alimentação');
  const [notes, setNotes] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (initialExpense) {
      setAmountStr(String(initialExpense.amount).replace('.', ','));
      setDate(initialExpense.date || getTodayDate());
      setDescription(initialExpense.description);
      setCategory(initialExpense.category || categories[0]?.id);
      setNotes(initialExpense.notes || '');

      const isAccount =
        initialExpense.card.toLowerCase().includes('conta') ||
        initialExpense.card.toLowerCase().includes('pix') ||
        initialExpense.card.toLowerCase().includes('dinheiro') ||
        initialExpense.installments?.toLowerCase().includes('conta') ||
        accounts.some(
          (a) =>
            a.name.toLowerCase() === initialExpense.card.toLowerCase() ||
            initialExpense.card.toLowerCase().includes(a.name.toLowerCase())
        );

      if (isAccount) {
        setPaymentOrigin('conta');
        const matchedAcc = accounts.find(
          (a) =>
            a.name.toLowerCase() === initialExpense.card.toLowerCase() ||
            initialExpense.card.toLowerCase().includes(a.name.toLowerCase()) ||
            a.name.toLowerCase().includes(initialExpense.card.toLowerCase())
        );
        if (matchedAcc) setSelectedAccountId(matchedAcc.id);
      } else {
        setPaymentOrigin('cartao');
        const inst = initialExpense.installments || '';
        const slashMatch = inst.match(/(\d+)\/(\d+)/);
        const xMatch = inst.match(/(\d+)x/);

        if (slashMatch && slashMatch[2] && slashMatch[2] !== '1') {
          setCardInstallmentMode('parcelado');
          setInstallmentCount(parseInt(slashMatch[2], 10));
        } else if (slashMatch && slashMatch[1] && slashMatch[1] !== '1') {
          setCardInstallmentMode('parcelado');
          setInstallmentCount(parseInt(slashMatch[1], 10));
        } else if (xMatch && xMatch[1] && xMatch[1] !== '1') {
          setCardInstallmentMode('parcelado');
          setInstallmentCount(parseInt(xMatch[1], 10));
        }

        const matchedCard = cards.find(
          (c) =>
            c.name.toLowerCase() === initialExpense.card.toLowerCase() ||
            initialExpense.card.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(initialExpense.card.toLowerCase())
        );
        if (matchedCard) setSelectedCardId(matchedCard.id);
      }
    } else {
      setAmountStr('');
      setDate(getTodayDate());
      setDescription('');
      setPaymentOrigin('cartao');
      setCardInstallmentMode('1x');
      setSelectedCardId(cards[0]?.id || '');
      setSelectedAccountId(accounts[0]?.id || '');
      setCategory(categories[0]?.id || 'Alimentação');
      setNotes('');
    }
  }, [initialExpense, cards, accounts, categories]);

  const parsedAmount = parseCurrencyInput(amountStr);

  const handleAmountQuickAdd = (value: number) => {
    const current = parsedAmount;
    const next = (current + value).toFixed(2).replace('.', ',');
    setAmountStr(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;
    if (!description.trim()) return;

    let finalPaymentType: PaymentType = 'credito';
    let finalInstallmentCount = 1;
    let paymentLabel = '';

    if (paymentOrigin === 'cartao') {
      const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];
      paymentLabel = activeCard ? activeCard.name : 'Cartão de Crédito';

      if (cardInstallmentMode === 'parcelado') {
        finalPaymentType = 'credito';
        finalInstallmentCount = installmentCount;
      } else {
        finalPaymentType = 'credito';
        finalInstallmentCount = 1;
      }
    } else {
      const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
      paymentLabel = activeAccount ? activeAccount.name : 'Conta / Pix';
      finalPaymentType = 'avista';
      finalInstallmentCount = 1;
    }

    if (isEditing && initialExpense && onUpdateExpense) {
      const updatedItem: Expense = {
        ...initialExpense,
        amount: parsedAmount,
        date,
        description: description.trim(),
        type: finalPaymentType,
        source: paymentOrigin,
        card: paymentLabel,
        category,
        installments:
          paymentOrigin === 'cartao'
            ? cardInstallmentMode === 'parcelado'
              ? `${installmentCount}x`
              : 'À Vista (1x)'
            : 'Pela Conta',
        notes: notes.trim() || undefined,
        monthRef: date.substring(0, 7),
      };

      try {
        await onUpdateExpense(updatedItem);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } catch {
        // handled in parent
      }
      return;
    }

    if (onAddExpense) {
      const expensePayload: ExpenseInput = {
        amount: parsedAmount,
        date,
        description: description.trim(),
        type: finalPaymentType,
        source: paymentOrigin,
        installmentCount: finalInstallmentCount,
        card: paymentLabel,
        category,
        notes: notes.trim() || undefined,
      };

      try {
        await onAddExpense(expensePayload);
        setAmountStr('');
        setDescription('');
        setNotes('');
        setCardInstallmentMode('1x');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
      } catch {
        // handled in parent
      }
    }
  };

  const selectedCategoryObj =
    categories.find((c) => c.id === category) || categories[0] || DEFAULT_CATEGORIES[0];

  return (
    <div className="relative text-slate-900 dark:text-slate-100">
      {/* Origem do Pagamento: Cartão de Crédito OU Pela Conta */}
      <div className="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
          Forma de Pagamento *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentOrigin('cartao')}
            className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
              paymentOrigin === 'cartao'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-slate-900 dark:text-white shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                paymentOrigin === 'cartao'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Cartão de Crédito</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">À vista ou parcelado</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentOrigin('conta')}
            className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
              paymentOrigin === 'conta'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-slate-900 dark:text-white shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                paymentOrigin === 'conta'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Conta / Pix</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Débito ou dinheiro</p>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Valor e Data */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-7">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor da Despesa (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-600 dark:text-rose-400 font-bold text-base">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="0,00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-base font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400">Atalhos:</span>
              {[10, 25, 50, 100, 200].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleAmountQuickAdd(v)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data do Gasto *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
              />
            </div>
            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setDate(getTodayDate())}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition ${
                  date === getTodayDate()
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setDate(getYesterdayDate())}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition ${
                  date === getYesterdayDate()
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Ontem
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Descrição */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Descrição do Gasto *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Supermercado, Almoço, Uber, Farmácia..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition"
            />
          </div>
        </div>

        {/* SE CARTÃO DE CRÉDITO */}
        {paymentOrigin === 'cartao' && (
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Modalidade no Cartão:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCardInstallmentMode('1x')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    cardInstallmentMode === '1x'
                      ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm border border-transparent dark:border-slate-700'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  À Vista (1x)
                </button>
                <button
                  type="button"
                  onClick={() => setCardInstallmentMode('parcelado')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    cardInstallmentMode === 'parcelado'
                      ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm border border-transparent dark:border-slate-700'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Parcelado
                </button>
              </div>
            </div>

            {cardInstallmentMode === 'parcelado' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Parcelas:</span>
                  <select
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(parseInt(e.target.value, 10))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => (
                      <option key={n} value={n} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{n}x</option>
                    ))}
                  </select>
                </div>
                {parsedAmount > 0 && (
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    {installmentCount}x de {formatCurrency(parsedAmount / installmentCount)}
                  </span>
                )}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Cartão:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {cards.map((c) => {
                  const isSelected = selectedCardId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCardId(c.id)}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-purple-500 ring-1 ring-purple-500 text-slate-900 dark:text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-medium truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SE PELA CONTA */}
        {paymentOrigin === 'conta' && (
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Conta ou Carteira:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {accounts.map((a) => {
                const isSelected = selectedAccountId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAccountId(a.id)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-blue-500 ring-1 ring-blue-500 text-slate-900 dark:text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                    <span className="text-xs font-medium truncate">{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Categoria */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Categoria da Despesa *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-emerald-500 ring-1 ring-emerald-500 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.iconName} className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Observações (opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: Comprovante salvo, detalhes da compra..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || parsedAmount <= 0 || !description.trim()}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 border border-transparent dark:border-slate-700/80 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
                <span>Gravando na Planilha...</span>
              </>
            ) : isEditing ? (
              <span>Atualizar Despesa</span>
            ) : (
              <span>Salvar Despesa</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
