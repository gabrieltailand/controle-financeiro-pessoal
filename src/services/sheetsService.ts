import {
  Expense,
  ExpenseInput,
  IncomeItem,
  IncomeCategory,
  InvestmentItem,
  InvestmentCategory,
  CategoryOption,
  CreditCardItem,
  AccountItem,
} from '../types/finance';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CREDIT_CARDS,
  DEFAULT_ACCOUNTS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_INVESTMENT_CATEGORIES,
} from '../constants/financeData';

export interface SheetTabInfo {
  sheetId: number;
  title: string;
}

export interface SpreadsheetDetails {
  id: string;
  title: string;
  webViewLink: string;
  sheetId: number;
  sheetTitle: string;
  tabs: SheetTabInfo[];
}

const DEFAULT_SHEET_TITLE = 'Controle Financeiro Pessoal';
const STORAGE_KEY_SPREADSHEET_ID = 'carteira_financas_spreadsheet_id';

export const TAB_NAMES = {
  EXPENSES: 'Despesas',
  LEGACY_EXPENSES: 'Gastos',
  INCOMES: 'Receitas',
  INVESTMENTS: 'Investimentos',
  CATEGORIES: 'Categorias',
  BANKS: 'Bancos',
  CARDS: 'Cartoes',
} as const;

export const getSavedSpreadsheetId = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID);
};

export const saveSpreadsheetId = (id: string) => {
  localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, id);
};

export const clearSavedSpreadsheetId = () => {
  localStorage.removeItem(STORAGE_KEY_SPREADSHEET_ID);
};

/**
 * Ensures all required tabs exist in the spreadsheet:
 * Despesas (or Gastos), Receitas, Investimentos, Categorias, Bancos, Cartoes
 */
export const ensureSpreadsheetTabs = async (
  accessToken: string,
  spreadsheetId: string,
  currentSheets: Array<{ properties: { sheetId: number; title: string } }>
): Promise<SheetTabInfo[]> => {
  const existingTitles = currentSheets.map((s) => s.properties.title);
  const tabsList: SheetTabInfo[] = currentSheets.map((s) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
  }));

  const hasExpensesTab =
    existingTitles.includes(TAB_NAMES.EXPENSES) || existingTitles.includes(TAB_NAMES.LEGACY_EXPENSES);
  const hasIncomesTab = existingTitles.includes(TAB_NAMES.INCOMES);
  const hasInvestmentsTab = existingTitles.includes(TAB_NAMES.INVESTMENTS);
  const hasCategoriesTab = existingTitles.includes(TAB_NAMES.CATEGORIES);
  const hasBanksTab = existingTitles.includes(TAB_NAMES.BANKS);
  const hasCardsTab = existingTitles.includes(TAB_NAMES.CARDS);

  const missingTabs: { title: string; headers: string[] }[] = [];

  if (!hasExpensesTab) {
    missingTabs.push({
      title: TAB_NAMES.EXPENSES,
      headers: [
        'ID',
        'Data',
        'Descrição',
        'Valor (R$)',
        'Tipo',
        'Cartão / Forma',
        'Categoria',
        'Parcelas',
        'Mês Referência',
        'Observações',
        'Criado Em',
      ],
    });
  }

  if (!hasIncomesTab) {
    missingTabs.push({
      title: TAB_NAMES.INCOMES,
      headers: ['ID', 'Data', 'Descrição', 'Valor (R$)', 'Categoria', 'Mês Referência', 'Observações', 'Criado Em'],
    });
  }

  if (!hasInvestmentsTab) {
    missingTabs.push({
      title: TAB_NAMES.INVESTMENTS,
      headers: ['ID', 'Data', 'Descrição', 'Valor (R$)', 'Categoria', 'Instituição', 'Mês Referência', 'Observações', 'Criado Em'],
    });
  }

  if (!hasCategoriesTab) {
    missingTabs.push({
      title: TAB_NAMES.CATEGORIES,
      headers: ['ID', 'Nome', 'Tipo', 'Ícone', 'Cor'],
    });
  }

  if (!hasBanksTab) {
    missingTabs.push({
      title: TAB_NAMES.BANKS,
      headers: ['ID', 'Nome', 'Banco', 'Cor'],
    });
  }

  if (!hasCardsTab) {
    missingTabs.push({
      title: TAB_NAMES.CARDS,
      headers: ['ID', 'Nome', 'Bandeira', 'Banco', 'Cor', 'Últimos Dígitos'],
    });
  }

  if (missingTabs.length === 0) {
    return tabsList;
  }

  // Add missing sheets via batchUpdate
  try {
    const addRequests = missingTabs.map((tab) => ({
      addSheet: {
        properties: {
          title: tab.title,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    }));

    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: addRequests }),
      }
    );

    if (addRes.ok) {
      const addData = await addRes.json();
      const replies = addData.replies || [];
      replies.forEach((reply: { addSheet?: { properties?: { sheetId: number; title: string } } }, idx: number) => {
        if (reply.addSheet?.properties) {
          tabsList.push({
            sheetId: reply.addSheet.properties.sheetId,
            title: reply.addSheet.properties.title,
          });
        }
      });

      // Write headers for each newly created tab
      for (const tab of missingTabs) {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
            tab.title
          )}!A1:${String.fromCharCode(64 + tab.headers.length)}1?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: `${tab.title}!A1:${String.fromCharCode(64 + tab.headers.length)}1`,
              majorDimension: 'ROWS',
              values: [tab.headers],
            }),
          }
        );
      }
    }
  } catch (err) {
    console.warn('Could not auto-add missing tabs:', err);
  }

  return tabsList;
};

/**
 * Get spreadsheet metadata (title, all sheets, and ensure required tabs exist)
 */
export const getSpreadsheetMetadata = async (
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetDetails> => {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao acessar planilha (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const sheets = data.sheets || [];
  if (sheets.length === 0) {
    throw new Error('A planilha selecionada não possui abas disponíveis.');
  }

  // Ensure all 6 tabs exist
  const allTabs = await ensureSpreadsheetTabs(accessToken, spreadsheetId, sheets);

  // Find Despesas / Gastos sheet
  const despesasSheet =
    allTabs.find((s) => s.title.toLowerCase().includes('despesa')) ||
    allTabs.find((s) => s.title.toLowerCase().includes('gasto')) ||
    allTabs[0];

  return {
    id: data.spreadsheetId,
    title: data.properties.title,
    webViewLink: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheetId: despesasSheet.sheetId,
    sheetTitle: despesasSheet.title,
    tabs: allTabs,
  };
};

/**
 * Searches user's Google Drive for existing spreadsheets
 */
export const searchDriveSpreadsheets = async (
  accessToken: string
): Promise<Array<{ id: string; name: string; webViewLink?: string }>> => {
  try {
    const query = encodeURIComponent(
      "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
    );
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,webViewLink)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      console.warn('Could not search Drive files:', await res.text());
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.warn('Error querying Google Drive files:', err);
    return [];
  }
};

/**
 * Creates a brand new spreadsheet in Google Sheets with all 6 tabs initialized:
 * Despesas, Receitas, Investimentos, Categorias, Bancos, Cartões
 */
export const createExpenseSpreadsheet = async (
  accessToken: string,
  customTitle?: string
): Promise<SpreadsheetDetails> => {
  const title = customTitle || DEFAULT_SHEET_TITLE;

  const initialSheets = [
    {
      properties: {
        title: TAB_NAMES.EXPENSES,
        gridProperties: { frozenRowCount: 1 },
      },
    },
    {
      properties: {
        title: TAB_NAMES.INCOMES,
        gridProperties: { frozenRowCount: 1 },
      },
    },
    {
      properties: {
        title: TAB_NAMES.INVESTMENTS,
        gridProperties: { frozenRowCount: 1 },
      },
    },
    {
      properties: {
        title: TAB_NAMES.CATEGORIES,
        gridProperties: { frozenRowCount: 1 },
      },
    },
    {
      properties: {
        title: TAB_NAMES.BANKS,
        gridProperties: { frozenRowCount: 1 },
      },
    },
    {
      properties: {
        title: TAB_NAMES.CARDS,
        gridProperties: { frozenRowCount: 1 },
      },
    },
  ];

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: initialSheets,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Falha ao criar planilha no Google Drive: ${errText}`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const createdSheets = spreadsheet.sheets || [];

  const tabs: SheetTabInfo[] = createdSheets.map((s: { properties: { sheetId: number; title: string } }) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
  }));

  // Headers for all tabs
  const tabConfigs = [
    {
      title: TAB_NAMES.EXPENSES,
      headers: [
        'ID',
        'Data',
        'Descrição',
        'Valor (R$)',
        'Tipo',
        'Cartão / Forma',
        'Categoria',
        'Parcelas',
        'Mês Referência',
        'Observações',
        'Criado Em',
      ],
      range: 'A1:K1',
    },
    {
      title: TAB_NAMES.INCOMES,
      headers: ['ID', 'Data', 'Descrição', 'Valor (R$)', 'Categoria', 'Mês Referência', 'Observações', 'Criado Em'],
      range: 'A1:H1',
    },
    {
      title: TAB_NAMES.INVESTMENTS,
      headers: ['ID', 'Data', 'Descrição', 'Valor (R$)', 'Categoria', 'Instituição', 'Mês Referência', 'Observações', 'Criado Em'],
      range: 'A1:I1',
    },
    {
      title: TAB_NAMES.CATEGORIES,
      headers: ['ID', 'Nome', 'Tipo', 'Ícone', 'Cor'],
      range: 'A1:E1',
    },
    {
      title: TAB_NAMES.BANKS,
      headers: ['ID', 'Nome', 'Banco', 'Cor'],
      range: 'A1:D1',
    },
    {
      title: TAB_NAMES.CARDS,
      headers: ['ID', 'Nome', 'Bandeira', 'Banco', 'Cor', 'Últimos Dígitos'],
      range: 'A1:F1',
    },
  ];

  // Populate headers in batch
  const dataValues = tabConfigs.map((tc) => ({
    range: `${tc.title}!${tc.range}`,
    majorDimension: 'ROWS',
    values: [tc.headers],
  }));

  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: dataValues,
        }),
      }
    );
  } catch (e) {
    console.warn('Error setting initial headers:', e);
  }

  // Pre-seed default categories, default accounts and default cards into spreadsheet
  try {
    await seedDefaultDataToSpreadsheet(accessToken, spreadsheetId);
  } catch (seedErr) {
    console.warn('Non-critical seeding notice:', seedErr);
  }

  saveSpreadsheetId(spreadsheetId);

  const despesasTab = tabs.find((t) => t.title === TAB_NAMES.EXPENSES) || tabs[0];

  return {
    id: spreadsheetId,
    title,
    webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetId: despesasTab.sheetId,
    sheetTitle: despesasTab.title,
    tabs,
  };
};

/**
 * Finds an existing spreadsheet or creates a new one
 */
export const findOrCreateExpenseSpreadsheet = async (
  accessToken: string
): Promise<SpreadsheetDetails> => {
  const savedId = getSavedSpreadsheetId();
  if (savedId) {
    try {
      const details = await getSpreadsheetMetadata(accessToken, savedId);
      return details;
    } catch {
      console.warn('Saved spreadsheet not accessible, will search Drive.');
      clearSavedSpreadsheetId();
    }
  }

  // Look for any existing spreadsheet with default title
  const files = await searchDriveSpreadsheets(accessToken);
  const existing = files.find(
    (f) =>
      f.name.toLowerCase().includes('controle financeiro pessoal') ||
      f.name.toLowerCase().includes('controle de gastos') ||
      f.name.toLowerCase().includes('gastos - cart')
  );

  if (existing) {
    try {
      const details = await getSpreadsheetMetadata(accessToken, existing.id);
      saveSpreadsheetId(existing.id);
      return details;
    } catch (e) {
      console.warn('Found file but could not load metadata:', e);
    }
  }

  // Otherwise create a new one
  return await createExpenseSpreadsheet(accessToken);
};

// ==========================================
// 1. DESPESAS / GASTOS
// ==========================================

export const fetchExpenses = async (
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<Expense[]> => {
  const range = `${encodeURIComponent(sheetTitle)}!A2:K`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Falha ao ler dados da aba Despesas: ${errorText}`);
  }

  const data = await res.json();
  const rows: unknown[][] = data.values || [];

  const expenses: Expense[] = [];

  rows.forEach((row, index) => {
    if (!row || row.length === 0) return;
    const rowIndex = index + 2;

    const id = String(row[0] || `exp_${rowIndex}_${Date.now()}`);
    const date = String(row[1] || '');
    const description = String(row[2] || '');

    let amount = 0;
    if (typeof row[3] === 'number') {
      amount = row[3];
    } else if (typeof row[3] === 'string') {
      const cleaned = row[3].replace(/[^\d,-]/g, '').replace(',', '.');
      amount = parseFloat(cleaned) || 0;
    }

    const rawType = String(row[4] || '').toLowerCase();
    const type: 'avista' | 'credito' = rawType.includes('vista') ? 'avista' : 'credito';

    const card = String(row[5] || 'Geral');
    const category = String(row[6] || 'Outros');
    const installments = String(row[7] || (type === 'avista' ? 'À Vista' : '1x'));
    const monthRef = String(row[8] || (date ? date.substring(0, 7) : ''));
    const notes = String(row[9] || '');
    const createdAt = String(row[10] || '');

    if (description || amount > 0) {
      expenses.push({
        id,
        rowIndex,
        date,
        description,
        amount,
        type,
        card,
        category,
        installments,
        monthRef,
        notes,
        createdAt,
      });
    }
  });

  return expenses;
};

export const appendExpenseToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  input: ExpenseInput
): Promise<Expense[]> => {
  const createdTimestamp = new Date().toISOString();
  const rowsToAdd: (string | number)[][] = [];
  const addedExpenses: Expense[] = [];

  const installmentCount = input.type === 'credito' ? (input.installmentCount || 1) : 1;

  if (input.type === 'credito' && installmentCount > 1) {
    const baseDate = new Date(input.date + 'T12:00:00');
    const installmentAmount = Math.round((input.amount / installmentCount) * 100) / 100;

    for (let i = 1; i <= installmentCount; i++) {
      const instDate = new Date(baseDate);
      instDate.setMonth(baseDate.getMonth() + (i - 1));
      const dateStr = instDate.toISOString().split('T')[0];
      const monthRefStr = dateStr.substring(0, 7);
      const installmentLabel = `${i}/${installmentCount}`;
      const id = `exp_${Date.now()}_${i}`;

      const row = [
        id,
        dateStr,
        installmentCount > 1 ? `${input.description} (${i}/${installmentCount})` : input.description,
        installmentAmount,
        'Crédito',
        input.card,
        input.category,
        installmentLabel,
        monthRefStr,
        input.notes || '',
        createdTimestamp,
      ];
      rowsToAdd.push(row);

      addedExpenses.push({
        id,
        date: dateStr,
        description: installmentCount > 1 ? `${input.description} (${i}/${installmentCount})` : input.description,
        amount: installmentAmount,
        type: 'credito',
        card: input.card,
        category: input.category,
        installments: installmentLabel,
        monthRef: monthRefStr,
        notes: input.notes,
        createdAt: createdTimestamp,
      });
    }
  } else {
    const id = `exp_${Date.now()}`;
    const typeLabel = input.type === 'avista' ? 'À Vista' : 'Crédito';
    const installmentsLabel = input.type === 'avista' ? 'À Vista' : '1x';
    const monthRef = input.date ? input.date.substring(0, 7) : new Date().toISOString().substring(0, 7);

    const row = [
      id,
      input.date,
      input.description,
      input.amount,
      typeLabel,
      input.card,
      input.category,
      installmentsLabel,
      monthRef,
      input.notes || '',
      createdTimestamp,
    ];
    rowsToAdd.push(row);

    addedExpenses.push({
      id,
      date: input.date,
      description: input.description,
      amount: input.amount,
      type: input.type,
      card: input.card,
      category: input.category,
      installments: installmentsLabel,
      monthRef,
      notes: input.notes,
      createdAt: createdTimestamp,
    });
  }

  const range = `${encodeURIComponent(sheetTitle)}!A:K`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rowsToAdd }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao salvar despesa na planilha: ${errorText}`);
  }

  return addedExpenses;
};

export const deleteExpenseRow = async (
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number
): Promise<void> => {
  if (rowIndex < 2) {
    throw new Error('Não é permitido excluir o cabeçalho da planilha.');
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao excluir linha da planilha: ${errorText}`);
  }
};

export const updateExpenseInSheet = async (
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rowIndex: number,
  expense: Expense
): Promise<Expense> => {
  if (rowIndex < 2) {
    throw new Error('Não é permitido alterar o cabeçalho da planilha.');
  }

  const typeLabel = expense.type === 'avista' ? 'À Vista' : 'Crédito';
  const monthRef = expense.date ? expense.date.substring(0, 7) : expense.monthRef;

  const rowValues = [
    expense.id,
    expense.date,
    expense.description,
    expense.amount,
    typeLabel,
    expense.card,
    expense.category,
    expense.installments || (expense.type === 'avista' ? 'À Vista' : '1x'),
    monthRef,
    expense.notes || '',
    expense.createdAt || new Date().toISOString(),
  ];

  const range = `${encodeURIComponent(sheetTitle)}!A${rowIndex}:K${rowIndex}`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetTitle}!A${rowIndex}:K${rowIndex}`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao atualizar despesa na planilha: ${errorText}`);
  }

  return {
    ...expense,
    monthRef,
  };
};

// ==========================================
// 2. RECEITAS
// ==========================================

export const fetchIncomes = async (
  accessToken: string,
  spreadsheetId: string
): Promise<IncomeItem[]> => {
  const range = `${encodeURIComponent(TAB_NAMES.INCOMES)}!A2:H`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    console.warn('Could not read Receitas tab');
    return [];
  }

  const data = await res.json();
  const rows: unknown[][] = data.values || [];
  const incomes: IncomeItem[] = [];

  rows.forEach((row, index) => {
    if (!row || row.length === 0) return;
    const rowIndex = index + 2;

    const id = String(row[0] || `inc_${rowIndex}_${Date.now()}`);
    const date = String(row[1] || '');
    const description = String(row[2] || '');

    let amount = 0;
    if (typeof row[3] === 'number') {
      amount = row[3];
    } else if (typeof row[3] === 'string') {
      const cleaned = row[3].replace(/[^\d,-]/g, '').replace(',', '.');
      amount = parseFloat(cleaned) || 0;
    }

    const category = String(row[4] || 'Outros');
    const monthRef = String(row[5] || (date ? date.substring(0, 7) : ''));
    const notes = String(row[6] || '');
    const createdAt = String(row[7] || '');

    if (description || amount > 0) {
      incomes.push({
        id,
        date,
        description,
        amount,
        category,
        monthRef,
        notes,
        createdAt,
      });
    }
  });

  return incomes;
};

export const syncAllIncomesToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  incomes: IncomeItem[]
): Promise<void> => {
  const rows = incomes.map((inc) => [
    inc.id,
    inc.date,
    inc.description,
    inc.amount,
    inc.category,
    inc.monthRef || inc.date.substring(0, 7),
    inc.notes || '',
    inc.createdAt || new Date().toISOString(),
  ]);

  // Clear existing data rows below header
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      TAB_NAMES.INCOMES
    )}!A2:H1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (rows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        TAB_NAMES.INCOMES
      )}!A2:H${rows.length + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${TAB_NAMES.INCOMES}!A2:H${rows.length + 1}`,
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );
  }
};

// ==========================================
// 3. INVESTIMENTOS
// ==========================================

export const fetchInvestments = async (
  accessToken: string,
  spreadsheetId: string
): Promise<InvestmentItem[]> => {
  const range = `${encodeURIComponent(TAB_NAMES.INVESTMENTS)}!A2:I`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    console.warn('Could not read Investimentos tab');
    return [];
  }

  const data = await res.json();
  const rows: unknown[][] = data.values || [];
  const investments: InvestmentItem[] = [];

  rows.forEach((row, index) => {
    if (!row || row.length === 0) return;
    const rowIndex = index + 2;

    const id = String(row[0] || `inv_${rowIndex}_${Date.now()}`);
    const date = String(row[1] || '');
    const description = String(row[2] || '');

    let amount = 0;
    if (typeof row[3] === 'number') {
      amount = row[3];
    } else if (typeof row[3] === 'string') {
      const cleaned = row[3].replace(/[^\d,-]/g, '').replace(',', '.');
      amount = parseFloat(cleaned) || 0;
    }

    const category = String(row[4] || 'Renda Fixa');
    const institution = String(row[5] || '');
    const monthRef = String(row[6] || (date ? date.substring(0, 7) : ''));
    const notes = String(row[7] || '');
    const createdAt = String(row[8] || '');

    if (description || amount > 0) {
      investments.push({
        id,
        date,
        description,
        amount,
        category,
        institution,
        monthRef,
        notes,
        createdAt,
      });
    }
  });

  return investments;
};

export const syncAllInvestmentsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  investments: InvestmentItem[]
): Promise<void> => {
  const rows = investments.map((inv) => [
    inv.id,
    inv.date,
    inv.description,
    inv.amount,
    inv.category,
    inv.institution || '',
    inv.monthRef || inv.date.substring(0, 7),
    inv.notes || '',
    inv.createdAt || new Date().toISOString(),
  ]);

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      TAB_NAMES.INVESTMENTS
    )}!A2:I1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (rows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        TAB_NAMES.INVESTMENTS
      )}!A2:I${rows.length + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${TAB_NAMES.INVESTMENTS}!A2:I${rows.length + 1}`,
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );
  }
};

// ==========================================
// 4. CATEGORIAS (Despesas, Receitas, Investimentos)
// ==========================================

export const fetchCategoriesFromSheet = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{
  expenseCategories: CategoryOption[];
  incomeCategories: IncomeCategory[];
  investmentCategories: InvestmentCategory[];
}> => {
  const range = `${encodeURIComponent(TAB_NAMES.CATEGORIES)}!A2:E`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    return {
      expenseCategories: [],
      incomeCategories: [],
      investmentCategories: [],
    };
  }

  const data = await res.json();
  const rows: unknown[][] = data.values || [];

  const expenseCategories: CategoryOption[] = [];
  const incomeCategories: IncomeCategory[] = [];
  const investmentCategories: InvestmentCategory[] = [];

  rows.forEach((row) => {
    if (!row || row.length === 0) return;
    const id = String(row[0] || '');
    const name = String(row[1] || '');
    const type = String(row[2] || 'Despesa').toLowerCase();
    const iconName = String(row[3] || 'Tag');
    const color = String(row[4] || '#10b981');

    if (!id || !name) return;

    if (type.includes('receita')) {
      incomeCategories.push({ id, name, iconName, color });
    } else if (type.includes('investimento')) {
      investmentCategories.push({ id, name, iconName, color });
    } else {
      expenseCategories.push({
        id,
        name,
        iconName,
        color,
        bgClass: `bg-[${color}]/10 text-[${color}] border-[${color}]/20`,
        textClass: `text-[${color}]`,
        borderClass: `border-[${color}]/30`,
      });
    }
  });

  return {
    expenseCategories,
    incomeCategories,
    investmentCategories,
  };
};

export const syncCategoriesToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  expenseCats: CategoryOption[],
  incomeCats: IncomeCategory[],
  investmentCats: InvestmentCategory[]
): Promise<void> => {
  const rows: (string | number)[][] = [];

  expenseCats.forEach((c) => {
    rows.push([c.id, c.name, 'Despesa', c.iconName || 'Tag', c.color || '#10b981']);
  });
  incomeCats.forEach((c) => {
    rows.push([c.id, c.name, 'Receita', c.iconName || 'DollarSign', c.color || '#10b981']);
  });
  investmentCats.forEach((c) => {
    rows.push([c.id, c.name, 'Investimento', c.iconName || 'TrendingUp', c.color || '#3b82f6']);
  });

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      TAB_NAMES.CATEGORIES
    )}!A2:E500:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (rows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        TAB_NAMES.CATEGORIES
      )}!A2:E${rows.length + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${TAB_NAMES.CATEGORIES}!A2:E${rows.length + 1}`,
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );
  }
};

// ==========================================
// 5. BANCOS & CONTAS
// ==========================================

export const fetchAccountsFromSheet = async (
  accessToken: string,
  spreadsheetId: string
): Promise<AccountItem[]> => {
  const range = `${encodeURIComponent(TAB_NAMES.BANKS)}!A2:D`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const rows: unknown[][] = data.values || [];
  const accounts: AccountItem[] = [];

  rows.forEach((row) => {
    if (!row || row.length === 0) return;
    const id = String(row[0] || '');
    const name = String(row[1] || '');
    const bank = String(row[2] || '');
    const color = String(row[3] || '#10b981');

    if (id && name) {
      accounts.push({ id, name, bank, color });
    }
  });

  return accounts;
};

export const syncAccountsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  accounts: AccountItem[]
): Promise<void> => {
  const rows = accounts.map((a) => [a.id, a.name, a.bank, a.color]);

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      TAB_NAMES.BANKS
    )}!A2:D500:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (rows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        TAB_NAMES.BANKS
      )}!A2:D${rows.length + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${TAB_NAMES.BANKS}!A2:D${rows.length + 1}`,
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );
  }
};

// ==========================================
// 6. CARTÕES DE CRÉDITO
// ==========================================

export const fetchCardsFromSheet = async (
  accessToken: string,
  spreadsheetId: string
): Promise<CreditCardItem[]> => {
  const range = `${encodeURIComponent(TAB_NAMES.CARDS)}!A2:F`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const rows: unknown[][] = data.values || [];
  const cards: CreditCardItem[] = [];

  rows.forEach((row) => {
    if (!row || row.length === 0) return;
    const id = String(row[0] || '');
    const name = String(row[1] || '');
    const brand = String(row[2] || 'Mastercard');
    const bank = String(row[3] || 'Nubank');
    const color = String(row[4] || '#8a05be');
    const lastDigits = String(row[5] || '');

    if (id && name) {
      cards.push({ id, name, brand, bank, color, lastDigits });
    }
  });

  return cards;
};

export const syncCardsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  cards: CreditCardItem[]
): Promise<void> => {
  const rows = cards.map((c) => [c.id, c.name, c.brand, c.bank, c.color, c.lastDigits || '']);

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      TAB_NAMES.CARDS
    )}!A2:F500:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (rows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        TAB_NAMES.CARDS
      )}!A2:F${rows.length + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${TAB_NAMES.CARDS}!A2:F${rows.length + 1}`,
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );
  }
};

/**
 * Seeds default categories, accounts, and cards if empty
 */
export const seedDefaultDataToSpreadsheet = async (
  accessToken: string,
  spreadsheetId: string
) => {
  // Sync default categories
  await syncCategoriesToSheet(
    accessToken,
    spreadsheetId,
    DEFAULT_CATEGORIES,
    DEFAULT_INCOME_CATEGORIES,
    DEFAULT_INVESTMENT_CATEGORIES
  );
  // Sync default accounts
  await syncAccountsToSheet(accessToken, spreadsheetId, DEFAULT_ACCOUNTS);
  // Sync default cards
  await syncCardsToSheet(accessToken, spreadsheetId, DEFAULT_CREDIT_CARDS);
};
