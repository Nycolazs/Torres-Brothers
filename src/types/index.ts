import { Timestamp } from 'firebase/firestore';

// ── Transaction Enums ──────────────────────────────────────────────

export type TransactionType = 'income' | 'cost' | 'expense';
export type TransactionStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';
export type PaymentMethod =
  | 'cash'
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'boleto'
  | 'check';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type BankAccountType = 'checking' | 'savings' | 'cash' | 'investment';

// ── Transaction ────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  costCenterId?: string;
  bankAccountId: string;
  competenceDate: Timestamp;
  dueDate: Timestamp;
  paymentDate?: Timestamp;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: Timestamp;
  notes?: string;
  attachmentUrl?: string;
  tags?: string[];
  contactName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uid: string;
}

export interface TransactionFormData {
  id?: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  costCenterId?: string;
  bankAccountId: string;
  competenceDate: Date;
  dueDate: Date;
  paymentDate?: Date;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: Date;
  notes?: string;
  attachmentUrl?: string;
  tags?: string[];
  contactName?: string;
}

// ── Category ───────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  uid: string;
}

// ── Cost Center ────────────────────────────────────────────────────

export interface CostCenter {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  uid: string;
}

// ── Bank Account ───────────────────────────────────────────────────

export interface BankAccount {
  id: string;
  name: string;
  type: BankAccountType;
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uid: string;
}

// ── Budget ─────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  categoryId: string;
  month: number; // 1-12
  year: number;
  plannedAmount: number;
  actualAmount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uid: string;
}

// ── User Profile ───────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  companyName?: string;
  companyDocument?: string; // CNPJ
  phone?: string;
  photoUrl?: string;
  currency: string;
  locale: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ── DRE (P&L) Report ──────────────────────────────────────────────

export interface DRELineItem {
  label: string;
  value: number;
  percentage?: number;
  children?: DRELineItem[];
}

export interface DREReport {
  period: {
    start: Date;
    end: Date;
  };
  receitaBrutaDeVendas: DRELineItem;
  deducoesDeVendas: DRELineItem;
  receitaLiquida: DRELineItem;
  custoMercadoriasVendidas: DRELineItem;
  lucroBruto: DRELineItem;
  despesasOperacionais: DRELineItem;
  despesasAdministrativas: DRELineItem;
  despesasComVendas: DRELineItem;
  resultadoOperacional: DRELineItem;
  despesasFinanceiras: DRELineItem;
  resultadoAntesImpostos: DRELineItem;
  impostos: DRELineItem;
  lucroLiquido: DRELineItem;
}

// ── Cash Flow ──────────────────────────────────────────────────────

export interface CashFlowEntry {
  date: Date;
  description: string;
  type: TransactionType;
  amount: number;
  balance: number;
  categoryName?: string;
  bankAccountName?: string;
}

// ── Report Filters ─────────────────────────────────────────────────

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  type?: TransactionType;
  categoryIds?: string[];
  costCenterIds?: string[];
  bankAccountIds?: string[];
  status?: TransactionStatus;
  tags?: string[];
}

// ── Dashboard ──────────────────────────────────────────────────────

export interface DashboardSummary {
  totalIncome: number;
  totalCosts: number;
  totalExpenses: number;
  netResult: number;
  incomeChange: number;
  costsChange: number;
  expensesChange: number;
  netResultChange: number;
  pendingCount: number;
  overdueCount: number;
  overdueAmount: number;
}

export interface ChartDataPoint {
  name: string;
  receitas: number;
  custos: number;
  despesas: number;
  resultado: number;
}

// ── Pagination ─────────────────────────────────────────────────────

export interface PaginationState {
  page: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
