/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  BarChart3,
  ListFilter,
  AlertCircle,
  CreditCard,
  Plus,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  SpreadsheetDetails,
  findOrCreateExpenseSpreadsheet,
  getSpreadsheetMetadata,
  createExpenseSpreadsheet,
  fetchExpenses,
  appendExpenseToSheet,
  deleteExpenseRow,
  updateExpenseInSheet,
  searchDriveSpreadsheets,
  saveSpreadsheetId,
  fetchIncomes,
  syncAllIncomesToSheet,
  fetchInvestments,
  syncAllInvestmentsToSheet,
  fetchCategoriesFromSheet,
  syncCategoriesToSheet,
  fetchAccountsFromSheet,
  syncAccountsToSheet,
  fetchCardsFromSheet,
  syncCardsToSheet,
} from './services/sheetsService';
import {
  Expense,
  ExpenseInput,
  CreditCardItem,
  AccountItem,
  CategoryOption,
  IncomeItem,
  IncomeCategory,
  InvestmentItem,
  InvestmentCategory,
} from './types/finance';
import { Navbar } from './components/Navbar';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { ExpenseModal } from './components/ExpenseModal';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { ConfirmModal } from './components/ConfirmModal';
import { SettingsModal } from './components/SettingsModal';
import { IncomeTab } from './components/IncomeTab';
import { InvestmentTab } from './components/InvestmentTab';
import { AllTransactionsList } from './components/AllTransactionsList';
import { IncomeModal } from './components/IncomeModal';
import { InvestmentModal } from './components/InvestmentModal';
import {
  formatCurrency,
  formatDateBR,
  getStoredCreditCards,
  saveStoredCreditCards,
  getStoredAccounts,
  saveStoredAccounts,
  getStoredCategories,
  saveStoredCategories,
  getStoredIncomeCategories,
  saveStoredIncomeCategories,
  getStoredInvestmentCategories,
  saveStoredInvestmentCategories,
  getStoredIncomes,
  saveStoredIncomes,
  getStoredInvestments,
  saveStoredInvestments,
  getStoredMonthlyBudgets,
  saveStoredMonthlyBudgets,
  getStoredCategoryBudgets,
  saveStoredCategoryBudgets,
} from './constants/financeData';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('carteira_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('carteira_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Registered cards, accounts and categories (customizable by user via Settings)
  const [cards, setCards] = useState<CreditCardItem[]>(() => getStoredCreditCards());
  const [accounts, setAccounts] = useState<AccountItem[]>(() => getStoredAccounts());
  const [categories, setCategories] = useState<CategoryOption[]>(() => getStoredCategories());

  // Income & Investment states
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>(() =>
    getStoredIncomeCategories()
  );
  const [investmentCategories, setInvestmentCategories] = useState<InvestmentCategory[]>(() =>
    getStoredInvestmentCategories()
  );
  const [incomes, setIncomes] = useState<IncomeItem[]>(() => getStoredIncomes());
  const [investments, setInvestments] = useState<InvestmentItem[]>(() => getStoredInvestments());
  const [monthlyBudgets, setMonthlyBudgets] = useState<Record<string, number>>(() =>
    getStoredMonthlyBudgets()
  );
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, Record<string, number>>>(() =>
    getStoredCategoryBudgets()
  );

  const handleSetBudget = (month: string, amount: number) => {
    setMonthlyBudgets((prev) => {
      const updated = { ...prev };
      if (amount <= 0) {
        delete updated[month];
      } else {
        updated[month] = amount;
      }
      saveStoredMonthlyBudgets(updated);
      return updated;
    });
  };

  const handleSetCategoryBudgets = (month: string, budgets: Record<string, number>) => {
    setCategoryBudgets((prev) => {
      const updated = { ...prev, [month]: budgets };
      saveStoredCategoryBudgets(updated);
      return updated;
    });
  };

  // Spreadsheet state
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetDetails | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI state: Default to 'resumo' as requested
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [activeTab, setActiveTab] = useState<'resumo' | 'extrato' | 'receitas' | 'investimentos'>(
    'resumo'
  );

  // Modals & Edit state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Income & Investment Modal states
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentItem | null>(null);

  const [availableDriveFiles, setAvailableDriveFiles] = useState<
    Array<{ id: string; name: string; webViewLink?: string }>
  >([]);
  const [isRefreshingFiles, setIsRefreshingFiles] = useState(false);

  // Confirmation modal for update
  const [updateConfirmModalState, setUpdateConfirmModalState] = useState<{
    isOpen: boolean;
    pendingExpense: Expense | null;
    isUpdating: boolean;
  }>({
    isOpen: false,
    pendingExpense: null,
    isUpdating: false,
  });

  // Deletion modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    expense: Expense | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    expense: null,
    isDeleting: false,
  });

  // Calculate available months
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthKey);

    const [y, m] = currentMonthKey.split('-').map(Number);
    for (let i = -3; i <= 3; i++) {
      const d = new Date(y, m - 1 + i, 1);
      monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    expenses.forEach((e) => {
      if (e.monthRef) monthsSet.add(e.monthRef);
      if (e.date) monthsSet.add(e.date.substring(0, 7));
    });

    incomes.forEach((i) => {
      if (i.monthRef) monthsSet.add(i.monthRef);
      if (i.date) monthsSet.add(i.date.substring(0, 7));
    });

    investments.forEach((inv) => {
      if (inv.monthRef) monthsSet.add(inv.monthRef);
      if (inv.date) monthsSet.add(inv.date.substring(0, 7));
    });

    return Array.from(monthsSet).sort().reverse();
  }, [currentMonthKey, expenses, incomes, investments]);

  // Load all data across the 6 spreadsheet tabs
  const loadSpreadsheetAndData = useCallback(
    async (accessToken: string, specificSpreadsheetId?: string) => {
      setIsLoadingSpreadsheet(true);
      setErrorMessage(null);
      try {
        let sheetDetails: SpreadsheetDetails;
        if (specificSpreadsheetId) {
          sheetDetails = await getSpreadsheetMetadata(accessToken, specificSpreadsheetId);
          saveSpreadsheetId(specificSpreadsheetId);
        } else {
          sheetDetails = await findOrCreateExpenseSpreadsheet(accessToken);
        }
        setSpreadsheet(sheetDetails);

        // 1. Fetch Expenses (Despesas)
        try {
          const loadedExpenses = await fetchExpenses(
            accessToken,
            sheetDetails.id,
            sheetDetails.sheetTitle
          );
          setExpenses(loadedExpenses);
        } catch (e) {
          console.warn('Error loading expenses:', e);
        }

        // 2. Fetch Incomes (Receitas)
        try {
          const loadedIncomes = await fetchIncomes(accessToken, sheetDetails.id);
          if (loadedIncomes.length > 0) {
            setIncomes(loadedIncomes);
            saveStoredIncomes(loadedIncomes);
          } else {
            // Seed current local incomes to spreadsheet
            const localIncomes = getStoredIncomes();
            if (localIncomes.length > 0) {
              await syncAllIncomesToSheet(accessToken, sheetDetails.id, localIncomes);
            }
          }
        } catch (e) {
          console.warn('Error loading incomes from sheet:', e);
        }

        // 3. Fetch Investments (Investimentos)
        try {
          const loadedInvestments = await fetchInvestments(accessToken, sheetDetails.id);
          if (loadedInvestments.length > 0) {
            setInvestments(loadedInvestments);
            saveStoredInvestments(loadedInvestments);
          } else {
            const localInvestments = getStoredInvestments();
            if (localInvestments.length > 0) {
              await syncAllInvestmentsToSheet(accessToken, sheetDetails.id, localInvestments);
            }
          }
        } catch (e) {
          console.warn('Error loading investments from sheet:', e);
        }

        // 4. Fetch Categories (Categorias)
        try {
          const loadedCats = await fetchCategoriesFromSheet(accessToken, sheetDetails.id);
          if (loadedCats.expenseCategories.length > 0) {
            setCategories(loadedCats.expenseCategories);
            saveStoredCategories(loadedCats.expenseCategories);
          }
          if (loadedCats.incomeCategories.length > 0) {
            setIncomeCategories(loadedCats.incomeCategories);
            saveStoredIncomeCategories(loadedCats.incomeCategories);
          }
          if (loadedCats.investmentCategories.length > 0) {
            setInvestmentCategories(loadedCats.investmentCategories);
            saveStoredInvestmentCategories(loadedCats.investmentCategories);
          }
          if (loadedCats.expenseCategories.length === 0) {
            // Seed categories
            await syncCategoriesToSheet(
              accessToken,
              sheetDetails.id,
              getStoredCategories(),
              getStoredIncomeCategories(),
              getStoredInvestmentCategories()
            );
          }
        } catch (e) {
          console.warn('Error loading categories from sheet:', e);
        }

        // 5. Fetch Accounts (Bancos)
        try {
          const loadedAccounts = await fetchAccountsFromSheet(accessToken, sheetDetails.id);
          if (loadedAccounts.length > 0) {
            setAccounts(loadedAccounts);
            saveStoredAccounts(loadedAccounts);
          } else {
            await syncAccountsToSheet(accessToken, sheetDetails.id, getStoredAccounts());
          }
        } catch (e) {
          console.warn('Error loading accounts from sheet:', e);
        }

        // 6. Fetch Cards (Cartoes)
        try {
          const loadedCards = await fetchCardsFromSheet(accessToken, sheetDetails.id);
          if (loadedCards.length > 0) {
            setCards(loadedCards);
            saveStoredCreditCards(loadedCards);
          } else {
            await syncCardsToSheet(accessToken, sheetDetails.id, getStoredCreditCards());
          }
        } catch (e) {
          console.warn('Error loading cards from sheet:', e);
        }
      } catch (err: unknown) {
        console.error('Error loading spreadsheet:', err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Erro ao carregar ou criar a planilha no seu Google Drive.'
        );
      } finally {
        setIsLoadingSpreadsheet(false);
        setIsSyncing(false);
      }
    },
    []
  );

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        loadSpreadsheetAndData(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );

    return () => unsubscribe();
  }, [loadSpreadsheetAndData]);

  // Google Sign-In
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        await loadSpreadsheetAndData(result.accessToken);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Não foi possível conectar com o Google. Verifique a janela de permissões.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign out
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setSpreadsheet(null);
    setExpenses([]);
    setNeedsAuth(true);
  };

  // Manual Sync of all tabs
  const handleSync = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken || !spreadsheet) return;
    setIsSyncing(true);
    try {
      await loadSpreadsheetAndData(activeToken, spreadsheet.id);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao sincronizar planilha');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Add Expense
  const handleAddExpense = async (input: ExpenseInput) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken || !spreadsheet) {
      throw new Error('Sessão expirada. Conecte-se novamente.');
    }

    setIsSubmitting(true);
    try {
      const added = await appendExpenseToSheet(
        activeToken,
        spreadsheet.id,
        spreadsheet.sheetTitle,
        input
      );
      setExpenses((prev) => [...added, ...prev]);

      const targetMonth = input.date ? input.date.substring(0, 7) : selectedMonth;
      if (targetMonth && targetMonth !== selectedMonth) {
        setSelectedMonth(targetMonth);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gravar despesa na planilha';
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request deletion of an expense
  const handleRequestDelete = (expense: Expense) => {
    setDeleteModalState({
      isOpen: true,
      expense,
      isDeleting: false,
    });
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken || !spreadsheet || !deleteModalState.expense) return;

    const exp = deleteModalState.expense;
    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

    try {
      if (exp.rowIndex && exp.rowIndex >= 2) {
        await deleteExpenseRow(activeToken, spreadsheet.id, spreadsheet.sheetId, exp.rowIndex);
      }
      setExpenses((prev) => prev.filter((item) => item.id !== exp.id));
      setDeleteModalState({ isOpen: false, expense: null, isDeleting: false });

      fetchExpenses(activeToken, spreadsheet.id, spreadsheet.sheetTitle)
        .then((fresh) => setExpenses(fresh))
        .catch(console.warn);
    } catch (err: unknown) {
      console.error('Error deleting expense:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Não foi possível excluir a despesa da planilha.'
      );
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Request update of an expense
  const handleRequestUpdate = async (updated: Expense) => {
    setUpdateConfirmModalState({
      isOpen: true,
      pendingExpense: updated,
      isUpdating: false,
    });
  };

  // Confirm update
  const handleConfirmUpdate = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken || !spreadsheet || !updateConfirmModalState.pendingExpense) return;

    const pendingExpense = updateConfirmModalState.pendingExpense;
    setUpdateConfirmModalState((prev) => ({ ...prev, isUpdating: true }));

    try {
      if (pendingExpense.rowIndex && pendingExpense.rowIndex >= 2) {
        await updateExpenseInSheet(
          activeToken,
          spreadsheet.id,
          spreadsheet.sheetTitle,
          pendingExpense.rowIndex,
          pendingExpense
        );
      }

      setExpenses((prev) =>
        prev.map((e) => (e.id === pendingExpense.id ? pendingExpense : e))
      );

      setUpdateConfirmModalState({ isOpen: false, pendingExpense: null, isUpdating: false });
      setIsExpenseModalOpen(false);
      setEditingExpense(null);

      fetchExpenses(activeToken, spreadsheet.id, spreadsheet.sheetTitle)
        .then((fresh) => setExpenses(fresh))
        .catch(console.warn);
    } catch (err: unknown) {
      console.error('Error updating expense:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar a despesa na planilha do Google Drive.'
      );
      setUpdateConfirmModalState((prev) => ({ ...prev, isUpdating: false }));
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  // Refresh Drive spreadsheets
  const handleRefreshDriveFiles = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;
    setIsRefreshingFiles(true);
    try {
      const files = await searchDriveSpreadsheets(activeToken);
      setAvailableDriveFiles(files);
    } finally {
      setIsRefreshingFiles(false);
    }
  };

  // Switch spreadsheet
  const handleSelectSpreadsheet = async (id: string) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;
    await loadSpreadsheetAndData(activeToken, id);
  };

  // Create new spreadsheet
  const handleCreateNewSpreadsheet = async (title?: string) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;
    setIsLoadingSpreadsheet(true);
    try {
      const created = await createExpenseSpreadsheet(activeToken, title);
      setSpreadsheet(created);
      setExpenses([]);
    } finally {
      setIsLoadingSpreadsheet(false);
    }
  };

  // Card customization handlers with Google Sheets persistence
  const handleSaveCard = (card: CreditCardItem) => {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      const updated = exists ? prev.map((c) => (c.id === card.id ? card : c)) : [...prev, card];
      saveStoredCreditCards(updated);

      // Async sync to Google Sheets
      if (token && spreadsheet) {
        syncCardsToSheet(token, spreadsheet.id, updated).catch(console.warn);
      }

      return updated;
    });
  };

  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => {
      const updated = prev.filter((c) => c.id !== cardId);
      saveStoredCreditCards(updated);

      if (token && spreadsheet) {
        syncCardsToSheet(token, spreadsheet.id, updated).catch(console.warn);
      }

      return updated;
    });
  };

  // Expense Category customization handlers with Google Sheets persistence
  const handleSaveCategory = (cat: CategoryOption) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === cat.id);
      const updated = exists ? prev.map((c) => (c.id === cat.id ? cat : c)) : [...prev, cat];
      saveStoredCategories(updated);

      if (token && spreadsheet) {
        syncCategoriesToSheet(
          token,
          spreadsheet.id,
          updated,
          incomeCategories,
          investmentCategories
        ).catch(console.warn);
      }

      return updated;
    });
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== catId);
      saveStoredCategories(updated);

      if (token && spreadsheet) {
        syncCategoriesToSheet(
          token,
          spreadsheet.id,
          updated,
          incomeCategories,
          investmentCategories
        ).catch(console.warn);
      }

      return updated;
    });
  };

  // Income Category customization handlers with Google Sheets persistence
  const handleSaveIncomeCategory = (cat: IncomeCategory) => {
    setIncomeCategories((prev) => {
      const exists = prev.some((c) => c.id === cat.id);
      const updated = exists ? prev.map((c) => (c.id === cat.id ? cat : c)) : [...prev, cat];
      saveStoredIncomeCategories(updated);

      if (token && spreadsheet) {
        syncCategoriesToSheet(
          token,
          spreadsheet.id,
          categories,
          updated,
          investmentCategories
        ).catch(console.warn);
      }

      return updated;
    });
  };

  const handleDeleteIncomeCategory = (catId: string) => {
    setIncomeCategories((prev) => {
      const updated = prev.filter((c) => c.id !== catId);
      saveStoredIncomeCategories(updated);

      if (token && spreadsheet) {
        syncCategoriesToSheet(
          token,
          spreadsheet.id,
          categories,
          updated,
          investmentCategories
        ).catch(console.warn);
      }

      return updated;
    });
  };

  // Investment Category customization handlers with Google Sheets persistence
  const handleSaveInvestmentCategory = (cat: InvestmentCategory) => {
    setInvestmentCategories((prev) => {
      const exists = prev.some((c) => c.id === cat.id);
      const updated = exists ? prev.map((c) => (c.id === cat.id ? cat : c)) : [...prev, cat];
      saveStoredInvestmentCategories(updated);

      if (token && spreadsheet) {
        syncCategoriesToSheet(
          token,
          spreadsheet.id,
          categories,
          incomeCategories,
          updated
        ).catch(console.warn);
      }

      return updated;
    });
  };

  const handleDeleteInvestmentCategory = (catId: string) => {
    setInvestmentCategories((prev) => {
      const updated = prev.filter((c) => c.id !== catId);
      saveStoredInvestmentCategories(updated);

      if (token && spreadsheet) {
        syncCategoriesToSheet(
          token,
          spreadsheet.id,
          categories,
          incomeCategories,
          updated
        ).catch(console.warn);
      }

      return updated;
    });
  };

  // Account customization handlers with Google Sheets persistence
  const handleSaveAccount = (acc: AccountItem) => {
    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === acc.id);
      const updated = exists ? prev.map((a) => (a.id === acc.id ? acc : a)) : [...prev, acc];
      saveStoredAccounts(updated);

      if (token && spreadsheet) {
        syncAccountsToSheet(token, spreadsheet.id, updated).catch(console.warn);
      }

      return updated;
    });
  };

  const handleDeleteAccount = (accId: string) => {
    setAccounts((prev) => {
      const updated = prev.filter((a) => a.id !== accId);
      saveStoredAccounts(updated);

      if (token && spreadsheet) {
        syncAccountsToSheet(token, spreadsheet.id, updated).catch(console.warn);
      }

      return updated;
    });
  };

  // Income handlers with Google Sheets persistence
  const handleOpenNewIncome = () => {
    setEditingIncome(null);
    setIsIncomeModalOpen(true);
  };

  const handleEditIncome = (income: IncomeItem) => {
    setEditingIncome(income);
    setIsIncomeModalOpen(true);
  };

  const handleSaveIncome = (
    incomeData: Omit<IncomeItem, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    setIncomes((prev) => {
      let updated: IncomeItem[];
      if (editingId) {
        updated = prev.map((item) =>
          item.id === editingId ? { ...item, ...incomeData } : item
        );
      } else {
        const newItem: IncomeItem = {
          ...incomeData,
          id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        updated = [newItem, ...prev];
      }
      saveStoredIncomes(updated);

      if (token && spreadsheet) {
        syncAllIncomesToSheet(token, spreadsheet.id, updated).catch(console.warn);
      }

      return updated;
    });
  };

  const handleDeleteIncome = (id: string) => {
    setIncomes((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveStoredIncomes(updated);

      if (token && spreadsheet) {
        syncAllIncomesToSheet(token, spreadsheet.id, updated).catch(console.warn);
      }

      return updated;
    });
  };

  // Investment handlers with Google Sheets persistence
  const handleOpenNewInvestment = () => {
    setEditingInvestment(null);
    setIsInvestmentModalOpen(true);
  };

  const handleEditInvestment = (investment: InvestmentItem) => {
    setEditingInvestment(investment);
    setIsInvestmentModalOpen(true);
  };

  const handleSaveInvestment = (
    investmentData: Omit<InvestmentItem, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    setInvestments((prev) => {
      let updated: InvestmentItem[];
      if (editingId) {
        updated = prev.map((item) =>
          item.id === editingId ? { ...item, ...investmentData } : item
        );
      } else {
        const newItem: InvestmentItem = {
          ...investmentData,
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        updated = [newItem, ...prev];
      }
      saveStoredInvestments(updated);

      if (token && spreadsheet) {
        syncAllInvestmentsToSheet(token, spreadsheet.id, updated).catch(console.warn);
      }

      return updated;
    });
  };

  const handleDeleteInvestment = (id: string) => {
    setInvestments((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveStoredInvestments(updated);

      if (token && spreadsheet) {
        syncAllInvestmentsToSheet(token, spreadsheet.id, updated).catch(console.warn);
      }

      return updated;
    });
  };

  // Open settings
  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true);
    handleRefreshDriveFiles();
  };

  // Welcome View (unauthenticated)
  if (needsAuth) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <header className="py-5 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Controle Financeiro Pessoal
                </h1>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sincronizados com Google Drive
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium"
            >
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Controle Financeiro Pessoal
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Gerencie despesas, receitas e investimentos com total sincronização no seu Google Drive.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conecte-se com sua conta Google para ler e gravar suas abas na planilha.
              </p>
              <GoogleSignInButton
                onClick={handleLogin}
                loading={isLoggingIn}
                className="w-full py-3"
              />
            </div>
          </div>
        </main>

        <footer className="py-4 px-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          Controle Financeiro Pessoal • Google Drive & Google Sheets API
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Navbar */}
      <Navbar
        user={user}
        spreadsheet={spreadsheet}
        isSyncing={isSyncing}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSync={handleSync}
        onOpenSettingsModal={handleOpenSettingsModal}
        onLogout={handleLogout}
        onOpenNewExpense={handleOpenNewExpense}
        onOpenNewIncome={handleOpenNewIncome}
        onOpenNewInvestment={handleOpenNewInvestment}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification bar */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs underline font-medium"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Loading Spreadsheet banner */}
        {isLoadingSpreadsheet && (
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <span>Sincronizando abas com o Google Drive...</span>
          </div>
        )}

        {/* Minimalist Tabs Bar (Clean, sem botões destacados) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          {/* Tabs: Resumo, Despesas, Receitas, Investimentos */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('resumo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'resumo'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-transparent dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Resumo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('extrato')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'extrato'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-transparent dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Despesas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('receitas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'receitas'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-transparent dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Receitas ({incomes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('investimentos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'investimentos'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-transparent dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Investimentos ({investments.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Resumo do Mês */}
        {activeTab === 'resumo' && (
          <div className="space-y-6">
            <Dashboard
              expenses={expenses}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              availableMonths={availableMonths}
              categories={categories}
              cards={cards}
              incomes={incomes}
              investments={investments}
              monthlyBudget={monthlyBudgets[selectedMonth] || 0}
              onSetBudget={(amount) => handleSetBudget(selectedMonth, amount)}
              categoryBudgets={categoryBudgets[selectedMonth] || {}}
              allCategoryBudgets={categoryBudgets}
              onSetCategoryBudgets={handleSetCategoryBudgets}
            />

            {/* All Monthly Transactions Section with clean date filter (mês e ano) */}
            <AllTransactionsList
              expenses={expenses}
              incomes={incomes}
              investments={investments}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              availableMonths={availableMonths}
              categories={categories}
              incomeCategories={incomeCategories}
              investmentCategories={investmentCategories}
              spreadsheetUrl={spreadsheet?.webViewLink}
              onRequestDeleteExpense={handleRequestDelete}
              onEditExpense={handleEditExpense}
              onDeleteIncome={handleDeleteIncome}
              onEditIncome={handleEditIncome}
              onDeleteInvestment={handleDeleteInvestment}
              onEditInvestment={handleEditInvestment}
            />
          </div>
        )}

        {/* Tab 2: Despesas */}
        {activeTab === 'extrato' && (
          <div className="space-y-4">
            <ExpenseList
              expenses={expenses}
              selectedMonth={selectedMonth}
              availableMonths={availableMonths}
              onRequestDelete={handleRequestDelete}
              onEdit={handleEditExpense}
              spreadsheetUrl={spreadsheet?.webViewLink}
              categories={categories}
            />
          </div>
        )}

        {/* Tab 3: Receitas */}
        {activeTab === 'receitas' && (
          <IncomeTab
            incomes={incomes}
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            categories={incomeCategories}
            onOpenNewIncome={handleOpenNewIncome}
            onEditIncome={handleEditIncome}
            onDeleteIncome={handleDeleteIncome}
          />
        )}

        {/* Tab 4: Investimentos */}
        {activeTab === 'investimentos' && (
          <InvestmentTab
            investments={investments}
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            categories={investmentCategories}
            onOpenNewInvestment={handleOpenNewInvestment}
            onEditInvestment={handleEditInvestment}
            onDeleteInvestment={handleDeleteInvestment}
          />
        )}
      </main>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onAddExpense={handleAddExpense}
        onUpdateExpense={handleRequestUpdate}
        initialExpense={editingExpense}
        cards={cards}
        accounts={accounts}
        categories={categories}
        isSubmitting={isSubmitting}
      />

      {/* Income Modal */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
        editingIncome={editingIncome}
        categories={incomeCategories}
        currentMonth={selectedMonth}
      />

      {/* Investment Modal */}
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => {
          setIsInvestmentModalOpen(false);
          setEditingInvestment(null);
        }}
        onSave={handleSaveInvestment}
        editingInvestment={editingInvestment}
        categories={investmentCategories}
        currentMonth={selectedMonth}
      />

      {/* Update confirmation */}
      <ConfirmModal
        isOpen={updateConfirmModalState.isOpen}
        title="Confirmar Atualização de Lançamento?"
        message={
          updateConfirmModalState.pendingExpense
            ? `Deseja atualizar "${updateConfirmModalState.pendingExpense.description}" no valor de ${formatCurrency(
                updateConfirmModalState.pendingExpense.amount
              )} (${formatDateBR(updateConfirmModalState.pendingExpense.date)}) na planilha "${
                spreadsheet?.title
              }" no Google Drive?`
            : 'Deseja atualizar este lançamento na planilha?'
        }
        confirmLabel="Sim, Atualizar"
        cancelLabel="Cancelar"
        isDestructive={false}
        isLoading={updateConfirmModalState.isUpdating}
        onConfirm={handleConfirmUpdate}
        onCancel={() =>
          setUpdateConfirmModalState({ isOpen: false, pendingExpense: null, isUpdating: false })
        }
      />

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Excluir Lançamento da Planilha?"
        message={
          deleteModalState.expense
            ? `Tem certeza que deseja remover "${deleteModalState.expense.description}" no valor de ${formatCurrency(
                deleteModalState.expense.amount
              )}? Esta linha será excluída permanentemente da planilha "${
                spreadsheet?.title
              }" no Google Drive.`
            : 'Tem certeza que deseja excluir esta despesa?'
        }
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        isDestructive={true}
        isLoading={deleteModalState.isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, expense: null, isDeleting: false })}
      />

      {/* Settings Modal (Menu vertical com listas e janelas dedicadas) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        cards={cards}
        onSaveCard={handleSaveCard}
        onDeleteCard={handleDeleteCard}
        accounts={accounts}
        onSaveAccount={handleSaveAccount}
        onDeleteAccount={handleDeleteAccount}
        categories={categories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        incomeCategories={incomeCategories}
        onSaveIncomeCategory={handleSaveIncomeCategory}
        onDeleteIncomeCategory={handleDeleteIncomeCategory}
        investmentCategories={investmentCategories}
        onSaveInvestmentCategory={handleSaveInvestmentCategory}
        onDeleteInvestmentCategory={handleDeleteInvestmentCategory}
        selectedMonth={selectedMonth}
        expenses={expenses}
        categoryBudgets={categoryBudgets}
        onSaveCategoryBudgets={handleSetCategoryBudgets}
        spreadsheet={spreadsheet}
        onSelectSpreadsheet={handleSelectSpreadsheet}
        onCreateNewSpreadsheet={handleCreateNewSpreadsheet}
        availableDriveFiles={availableDriveFiles}
        isRefreshingFiles={isRefreshingFiles}
        onRefreshDriveFiles={handleRefreshDriveFiles}
      />
    </div>
  );
}
