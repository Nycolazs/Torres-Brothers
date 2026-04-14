import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Transaction,
  DREReport,
  DRELineItem,
  CashFlowEntry,
  Category,
  TransactionType,
} from '@/types';
import { DRE_CATEGORY_GROUPS } from '@/constants';
import { getCategories } from './categoryService';
import { getBankAccounts } from './accountService';

// ── Helpers ───────────────────────────────────────────────────────

function transactionsCol(uid: string) {
  return collection(db, 'users', uid, 'transactions');
}

function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

async function fetchTransactions(
  uid: string,
  startDate: Date,
  endDate: Date,
  dateField: 'dueDate' | 'paymentDate' | 'competenceDate',
  onlyPaid: boolean
): Promise<Transaction[]> {
  const constraints = [
    where(dateField, '>=', toTimestamp(startDate)),
    where(dateField, '<=', toTimestamp(endDate)),
    orderBy(dateField, 'asc'),
  ];

  if (onlyPaid) {
    constraints.push(where('status', '==', 'paid'));
  }

  const q = query(transactionsCol(uid), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Transaction[];
}

function buildLineItem(
  label: string,
  value: number,
  totalForPercentage?: number,
  children?: DRELineItem[]
): DRELineItem {
  const item: DRELineItem = {
    label,
    value: Math.round(value * 100) / 100,
  };

  if (totalForPercentage && totalForPercentage !== 0) {
    item.percentage = Math.round((value / totalForPercentage) * 10000) / 100;
  }

  if (children) {
    item.children = children;
  }

  return item;
}

// ── DRE (P&L) ─────────────────────────────────────────────────────

export async function generateDRE(
  uid: string,
  startDate: Date,
  endDate: Date
): Promise<DREReport> {
  const [transactions, categories] = await Promise.all([
    fetchTransactions(uid, startDate, endDate, 'competenceDate', false),
    getCategories(uid),
  ]);

  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  // Helper to sum transactions by category names
  function sumByCategories(categoryNames: string[]): {
    total: number;
    children: DRELineItem[];
  } {
    const lowerNames = categoryNames.map((n) => n.toLowerCase());
    let total = 0;
    const breakdown: Record<string, number> = {};

    for (const t of transactions) {
      if (t.status === 'cancelled') continue;
      const cat = categoryMap.get(t.categoryId);
      if (!cat) continue;
      if (lowerNames.includes(cat.name.toLowerCase())) {
        total += t.amount;
        breakdown[cat.name] = (breakdown[cat.name] ?? 0) + t.amount;
      }
    }

    const children = Object.entries(breakdown).map(([name, value]) =>
      buildLineItem(name, value)
    );

    return { total, children };
  }

  // Revenue
  const receitaBruta = sumByCategories([...DRE_CATEGORY_GROUPS.receitaBrutaDeVendas]);
  const outrasReceitas = sumByCategories([...DRE_CATEGORY_GROUPS.outrasReceitas]);
  const totalReceita = receitaBruta.total + outrasReceitas.total;

  // Deductions (placeholder — no specific deduction categories defined)
  const deducoes = 0;
  const receitaLiquida = totalReceita - deducoes;

  // COGS
  const cmv = sumByCategories([...DRE_CATEGORY_GROUPS.custoMercadoriasVendidas]);
  const lucroBruto = receitaLiquida - cmv.total;

  // Operational expenses
  const despAdmin = sumByCategories([...DRE_CATEGORY_GROUPS.despesasAdministrativas]);
  const despVendas = sumByCategories([...DRE_CATEGORY_GROUPS.despesasComVendas]);
  const manutencao = sumByCategories([...DRE_CATEGORY_GROUPS.manutencao]);
  const proLabore = sumByCategories([...DRE_CATEGORY_GROUPS.proLabore]);

  const totalDespOp =
    despAdmin.total + despVendas.total + manutencao.total + proLabore.total;
  const resultadoOp = lucroBruto - totalDespOp;

  // Financial expenses
  const despFinanceiras = sumByCategories([...DRE_CATEGORY_GROUPS.despesasFinanceiras]);
  const resultadoAntesImpostos = resultadoOp - despFinanceiras.total;

  // Taxes
  const impostos = sumByCategories([...DRE_CATEGORY_GROUPS.impostos]);
  const lucroLiquido = resultadoAntesImpostos - impostos.total;

  return {
    period: { start: startDate, end: endDate },
    receitaBrutaDeVendas: buildLineItem(
      'Receita Bruta de Vendas',
      receitaBruta.total,
      totalReceita,
      receitaBruta.children
    ),
    deducoesDeVendas: buildLineItem('Deduções de Vendas', deducoes, totalReceita),
    receitaLiquida: buildLineItem('Receita Líquida', receitaLiquida, totalReceita),
    custoMercadoriasVendidas: buildLineItem(
      'Custo das Mercadorias Vendidas',
      cmv.total,
      totalReceita,
      cmv.children
    ),
    lucroBruto: buildLineItem('Lucro Bruto', lucroBruto, totalReceita),
    despesasOperacionais: buildLineItem(
      'Despesas Operacionais',
      totalDespOp,
      totalReceita,
      [
        ...despAdmin.children,
        ...despVendas.children,
        ...manutencao.children,
        ...proLabore.children,
      ]
    ),
    despesasAdministrativas: buildLineItem(
      'Despesas Administrativas',
      despAdmin.total,
      totalReceita,
      despAdmin.children
    ),
    despesasComVendas: buildLineItem(
      'Despesas com Vendas',
      despVendas.total,
      totalReceita,
      despVendas.children
    ),
    resultadoOperacional: buildLineItem(
      'Resultado Operacional',
      resultadoOp,
      totalReceita
    ),
    despesasFinanceiras: buildLineItem(
      'Despesas Financeiras',
      despFinanceiras.total,
      totalReceita,
      despFinanceiras.children
    ),
    resultadoAntesImpostos: buildLineItem(
      'Resultado Antes dos Impostos',
      resultadoAntesImpostos,
      totalReceita
    ),
    impostos: buildLineItem(
      'Impostos',
      impostos.total,
      totalReceita,
      impostos.children
    ),
    lucroLiquido: buildLineItem('Lucro Líquido', lucroLiquido, totalReceita),
  };
}

// ── Cash Flow ─────────────────────────────────────────────────────

export async function generateCashFlow(
  uid: string,
  startDate: Date,
  endDate: Date,
  regime: 'cash' | 'accrual'
): Promise<CashFlowEntry[]> {
  const dateField = regime === 'cash' ? 'paymentDate' : 'competenceDate';
  const onlyPaid = regime === 'cash';

  const [transactions, categories, bankAccounts] = await Promise.all([
    fetchTransactions(uid, startDate, endDate, dateField, onlyPaid),
    getCategories(uid),
    getBankAccounts(uid),
  ]);

  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const accountMap = new Map<string, string>();
  bankAccounts.forEach((a) => accountMap.set(a.id, a.name));

  let runningBalance = 0;

  return transactions
    .filter((t) => t.status !== 'cancelled')
    .map((t): CashFlowEntry => {
      const dateTs =
        regime === 'cash' && t.paymentDate ? t.paymentDate : t.competenceDate;
      const amount = t.type === 'income' ? t.amount : -t.amount;
      runningBalance += amount;

      return {
        date: dateTs.toDate(),
        description: t.description,
        type: t.type,
        amount: t.amount,
        balance: Math.round(runningBalance * 100) / 100,
        categoryName: categoryMap.get(t.categoryId),
        bankAccountName: accountMap.get(t.bankAccountId),
      };
    });
}

// ── Category Report ───────────────────────────────────────────────

export interface CategoryReportItem {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export async function generateCategoryReport(
  uid: string,
  startDate: Date,
  endDate: Date
): Promise<CategoryReportItem[]> {
  const [transactions, categories] = await Promise.all([
    fetchTransactions(uid, startDate, endDate, 'competenceDate', false),
    getCategories(uid),
  ]);

  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  const aggregation = new Map<
    string,
    { total: number; count: number; type: TransactionType; name: string; color: string }
  >();

  for (const t of transactions) {
    if (t.status === 'cancelled') continue;
    const cat = categoryMap.get(t.categoryId);
    const key = t.categoryId;
    const existing = aggregation.get(key);

    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      aggregation.set(key, {
        total: t.amount,
        count: 1,
        type: t.type,
        name: cat?.name ?? 'Sem Categoria',
        color: cat?.color ?? '#6b7280',
      });
    }
  }

  const grandTotal = Array.from(aggregation.values()).reduce(
    (sum, item) => sum + item.total,
    0
  );

  return Array.from(aggregation.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      type: data.type,
      color: data.color,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      percentage: grandTotal > 0
        ? Math.round((data.total / grandTotal) * 10000) / 100
        : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// ── Cost Center Report ────────────────────────────────────────────

export interface CostCenterReportItem {
  costCenterId: string;
  costCenterName: string;
  totalIncome: number;
  totalCosts: number;
  totalExpenses: number;
  netResult: number;
  transactionCount: number;
}

export async function generateCostCenterReport(
  uid: string,
  startDate: Date,
  endDate: Date
): Promise<CostCenterReportItem[]> {
  const [transactions, costCentersSnap] = await Promise.all([
    fetchTransactions(uid, startDate, endDate, 'competenceDate', false),
    getDocs(
      query(
        collection(db, 'users', uid, 'costCenters'),
        orderBy('name', 'asc')
      )
    ),
  ]);

  const costCenterMap = new Map<string, string>();
  costCentersSnap.docs.forEach((docSnap) => {
    costCenterMap.set(docSnap.id, (docSnap.data() as { name: string }).name);
  });

  const aggregation = new Map<
    string,
    { income: number; costs: number; expenses: number; count: number }
  >();

  for (const t of transactions) {
    if (t.status === 'cancelled' || !t.costCenterId) continue;

    const key = t.costCenterId;
    const existing = aggregation.get(key) ?? {
      income: 0,
      costs: 0,
      expenses: 0,
      count: 0,
    };

    switch (t.type) {
      case 'income':
        existing.income += t.amount;
        break;
      case 'cost':
        existing.costs += t.amount;
        break;
      case 'expense':
        existing.expenses += t.amount;
        break;
    }
    existing.count += 1;
    aggregation.set(key, existing);
  }

  return Array.from(aggregation.entries())
    .map(([costCenterId, data]) => ({
      costCenterId,
      costCenterName: costCenterMap.get(costCenterId) ?? 'Desconhecido',
      totalIncome: Math.round(data.income * 100) / 100,
      totalCosts: Math.round(data.costs * 100) / 100,
      totalExpenses: Math.round(data.expenses * 100) / 100,
      netResult: Math.round((data.income - data.costs - data.expenses) * 100) / 100,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.netResult - a.netResult);
}

// ── Aging Report ──────────────────────────────────────────────────

export interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  totalAmount: number;
  count: number;
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    dueDate: Date;
    daysOverdue: number;
    contactName?: string;
  }>;
}

export async function generateAgingReport(uid: string): Promise<AgingBucket[]> {
  const now = new Date();
  const today = Timestamp.fromDate(now);

  // Fetch all overdue and pending transactions
  const q = query(
    transactionsCol(uid),
    where('type', '==', 'income'),
    where('status', 'in', ['pending', 'overdue']),
    where('dueDate', '<', today),
    orderBy('dueDate', 'asc')
  );

  const snapshot = await getDocs(q);
  const transactions = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Transaction[];

  const buckets: AgingBucket[] = [
    { label: '0-30 dias', minDays: 0, maxDays: 30, totalAmount: 0, count: 0, transactions: [] },
    { label: '31-60 dias', minDays: 31, maxDays: 60, totalAmount: 0, count: 0, transactions: [] },
    { label: '61-90 dias', minDays: 61, maxDays: 90, totalAmount: 0, count: 0, transactions: [] },
    { label: '90+ dias', minDays: 91, maxDays: null, totalAmount: 0, count: 0, transactions: [] },
  ];

  for (const t of transactions) {
    const dueDate = t.dueDate.toDate();
    const diffMs = now.getTime() - dueDate.getTime();
    const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const bucket = buckets.find(
      (b) => daysOverdue >= b.minDays && (b.maxDays === null || daysOverdue <= b.maxDays)
    );

    if (bucket) {
      bucket.totalAmount += t.amount;
      bucket.count += 1;
      bucket.transactions.push({
        id: t.id,
        description: t.description,
        amount: t.amount,
        dueDate,
        daysOverdue,
        contactName: t.contactName,
      });
    }
  }

  // Round totals
  buckets.forEach((b) => {
    b.totalAmount = Math.round(b.totalAmount * 100) / 100;
  });

  return buckets;
}

// ── Bank Statement ────────────────────────────────────────────────

export interface BankStatementEntry {
  id: string;
  date: Date;
  description: string;
  type: TransactionType;
  amount: number;
  balance: number;
  categoryName?: string;
  status: string;
}

export interface BankStatement {
  bankAccountId: string;
  bankAccountName: string;
  initialBalance: number;
  finalBalance: number;
  totalCredits: number;
  totalDebits: number;
  entries: BankStatementEntry[];
}

export async function generateBankStatement(
  uid: string,
  bankAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<BankStatement> {
  const [accountSnap, categoriesData] = await Promise.all([
    getDocs(
      query(
        collection(db, 'users', uid, 'bankAccounts'),
        where('__name__', '==', bankAccountId)
      )
    ),
    getCategories(uid),
  ]);

  const accountDoc = accountSnap.docs[0];
  const account = accountDoc
    ? (accountDoc.data() as { name: string; initialBalance: number })
    : { name: 'Desconhecida', initialBalance: 0 };

  const categoryMap = new Map<string, string>();
  categoriesData.forEach((c) => categoryMap.set(c.id, c.name));

  // Get all paid transactions for this account before the start date to compute opening balance
  const priorQ = query(
    transactionsCol(uid),
    where('bankAccountId', '==', bankAccountId),
    where('status', '==', 'paid'),
    where('paymentDate', '<', toTimestamp(startDate)),
    orderBy('paymentDate', 'asc')
  );
  const priorSnap = await getDocs(priorQ);

  let openingBalance = account.initialBalance;
  priorSnap.docs.forEach((docSnap) => {
    const t = docSnap.data();
    if (t.type === 'income') {
      openingBalance += t.amount;
    } else {
      openingBalance -= t.amount;
    }
  });

  // Get transactions in the date range
  const periodQ = query(
    transactionsCol(uid),
    where('bankAccountId', '==', bankAccountId),
    where('status', '==', 'paid'),
    where('paymentDate', '>=', toTimestamp(startDate)),
    where('paymentDate', '<=', toTimestamp(endDate)),
    orderBy('paymentDate', 'asc')
  );
  const periodSnap = await getDocs(periodQ);

  let runningBalance = openingBalance;
  let totalCredits = 0;
  let totalDebits = 0;

  const entries: BankStatementEntry[] = periodSnap.docs.map((docSnap) => {
    const t = docSnap.data() as Transaction;

    if (t.type === 'income') {
      runningBalance += t.amount;
      totalCredits += t.amount;
    } else {
      runningBalance -= t.amount;
      totalDebits += t.amount;
    }

    return {
      id: docSnap.id,
      date: t.paymentDate!.toDate(),
      description: t.description,
      type: t.type,
      amount: t.amount,
      balance: Math.round(runningBalance * 100) / 100,
      categoryName: categoryMap.get(t.categoryId),
      status: t.status,
    };
  });

  return {
    bankAccountId,
    bankAccountName: account.name,
    initialBalance: Math.round(openingBalance * 100) / 100,
    finalBalance: Math.round(runningBalance * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    totalDebits: Math.round(totalDebits * 100) / 100,
    entries,
  };
}
