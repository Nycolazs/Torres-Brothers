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
export type UserAccessStatus = 'pending' | 'approved' | 'rejected';
export type UserRole =
  | 'admin'
  | 'finance'
  | 'finance_readonly'
  | 'fiscal'
  | 'operator'
  | 'auditor'
  | 'user';
export type ContactType = 'customer' | 'supplier' | 'both';
export type PaymentStatus = 'open' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type DREClassification =
  | 'gross_revenue'
  | 'sales_deduction'
  | 'cogs'
  | 'administrative_expense'
  | 'sales_expense'
  | 'financial_expense'
  | 'tax'
  | 'other_revenue'
  | 'none';
export type ChargeStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type ChargeMethod = 'manual' | 'pix' | 'boleto' | 'card' | 'tef';
export type ReconciliationStatus = 'pending' | 'matched' | 'reconciled' | 'ignored';
export type ProviderKind = 'manual' | 'mock' | 'pixProvider' | 'boletoProvider' | 'tefProvider';
export type ProviderStatus = 'disabled' | 'sandbox' | 'production';

// ── Transaction ────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  financialAccountId?: string;
  costCenterId?: string;
  bankAccountId: string;
  contactId?: string;
  contactSnapshot?: ContactSnapshot;
  documentNumber?: string;
  competenceDate: Timestamp;
  dueDate: Timestamp;
  paymentDate?: Timestamp;
  status: TransactionStatus;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod?: PaymentMethod;
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: Timestamp;
  recurrenceGroupId?: string;
  notes?: string;
  attachmentUrl?: string;
  tags?: string[];
  contactName?: string;
  sourceModule?: string;
  reconciliationId?: string;
  chargeId?: string;
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
  financialAccountId?: string;
  costCenterId?: string;
  bankAccountId: string;
  contactId?: string;
  contactSnapshot?: ContactSnapshot;
  documentNumber?: string;
  competenceDate: Date;
  dueDate: Date;
  paymentDate?: Date;
  status: TransactionStatus;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod?: PaymentMethod;
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: Date;
  recurrenceGroupId?: string;
  notes?: string;
  attachmentUrl?: string;
  tags?: string[];
  contactName?: string;
  sourceModule?: string;
  reconciliationId?: string;
  chargeId?: string;
}

// ── Contacts ──────────────────────────────────────────────────────

export interface ContactAddress {
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  cityCode?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface ContactSnapshot {
  id: string;
  type: ContactType;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: ContactAddress;
}

export interface Contact {
  id: string;
  type: ContactType;
  name: string;
  tradeName?: string;
  document?: string;
  normalizedDocument?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: ContactAddress;
  blocked: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uid: string;
}

export interface ContactFormData {
  id?: string;
  type: ContactType;
  name: string;
  tradeName?: string;
  document?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: ContactAddress;
  blocked: boolean;
  notes?: string;
}

// ── Service Catalog ────────────────────────────────────────────────

export interface ServiceCatalogItem {
  id: string;
  description: string;
  serviceListItem: string;
  municipalServiceCode?: string;
  taxRate: number;
  issWithheld: boolean;
  defaultAmount: number;
  isActive: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uid: string;
}

export interface ServiceCatalogFormData {
  id?: string;
  description: string;
  serviceListItem: string;
  municipalServiceCode?: string;
  taxRate: number;
  issWithheld: boolean;
  defaultAmount: number;
  isActive: boolean;
  notes?: string;
}

// ── Financial Accounts ────────────────────────────────────────────

export interface FinancialAccount {
  id: string;
  name: string;
  type: TransactionType;
  dreClassification: DREClassification;
  parentId?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uid: string;
}

export interface FinancialAccountFormData {
  id?: string;
  name: string;
  type: TransactionType;
  dreClassification: DREClassification;
  parentId?: string;
  isActive: boolean;
}

// ── Payments / Settlements ────────────────────────────────────────

export interface TransactionPayment {
  id: string;
  transactionId: string;
  type: TransactionType;
  amount: number;
  interest?: number;
  discount?: number;
  paidTotal: number;
  paymentDate: Timestamp;
  bankAccountId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptNumber?: string;
  createdAt: Timestamp;
  uid: string;
}

export interface TransactionPaymentFormData {
  transactionId: string;
  type: TransactionType;
  amount: number;
  interest?: number;
  discount?: number;
  paymentDate: Date;
  bankAccountId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// ── Charges ───────────────────────────────────────────────────────

export interface Charge {
  id: string;
  transactionId?: string;
  contactId?: string;
  contactSnapshot?: ContactSnapshot;
  description: string;
  amount: number;
  dueDate: Timestamp;
  method: ChargeMethod;
  status: ChargeStatus;
  provider: ProviderKind;
  providerChargeId?: string;
  paymentLink?: string;
  barcode?: string;
  pixCode?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uid: string;
}

export interface ChargeFormData {
  id?: string;
  transactionId?: string;
  contactId?: string;
  contactSnapshot?: ContactSnapshot;
  description: string;
  amount: number;
  dueDate: Date;
  method: ChargeMethod;
  status: ChargeStatus;
  provider: ProviderKind;
  notes?: string;
}

// ── Bank Reconciliation ───────────────────────────────────────────

export interface BankStatementImport {
  id: string;
  bankAccountId: string;
  fileName: string;
  format: 'ofx' | 'cnab';
  itemCount: number;
  importedAt: Timestamp;
  uid: string;
}

export interface BankStatementItem {
  id: string;
  importId: string;
  bankAccountId: string;
  date: Timestamp;
  description: string;
  amount: number;
  externalId?: string;
  status: ReconciliationStatus;
  matchedTransactionId?: string;
  createdTransactionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uid: string;
}

// ── Audit / Provider Settings ─────────────────────────────────────

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
  uid: string;
}

export interface ClientErrorLog {
  id: string;
  uid?: string | null;
  route?: string | null;
  source: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  userAgent?: string | null;
  createdAt: Timestamp;
}

export interface ProviderSetting {
  id: string;
  kind: ProviderKind;
  status: ProviderStatus;
  displayName: string;
  notes?: string;
  updatedAt: Timestamp;
  updatedBy?: string;
  uid: string;
}

export interface ProviderSettingFormData {
  id?: string;
  kind: ProviderKind;
  status: ProviderStatus;
  displayName: string;
  notes?: string;
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
  companyName: string;
  companyDocument?: string; // CNPJ
  phone?: string;
  photoUrl?: string;
  currency: string;
  locale: string;
  role: UserRole;
  accessStatus: UserAccessStatus;
  approvedAt?: Timestamp;
  approvedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SystemConfig {
  primaryCompanyName: string;
  adminUid: string;
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

// ── Fiscal Invoices (NFS-e) ───────────────────────────────────────

export type FiscalInvoiceStatus =
  | 'draft'
  | 'processing'
  | 'authorized'
  | 'rejected'
  | 'cancelled'
  | 'simulation';

export interface FiscalAddress {
  street: string;
  number: string;
  complement?: string;
  district: string;
  cityCode: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface FiscalCustomer {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  address: FiscalAddress;
}

export interface FiscalService {
  description: string;
  serviceListItem: string;
  municipalServiceCode?: string;
  taxRate: number;
  issWithheld: boolean;
  amount: number;
  deductions?: number;
}

export interface FiscalInvoice {
  id: string;
  reference: string;
  status: FiscalInvoiceStatus;
  provider: 'focus' | 'nfeio' | 'mock';
  environment: 'homologation' | 'production';
  providerInvoiceId?: string;
  transactionId?: string;
  customerId?: string;
  customerSnapshot?: ContactSnapshot;
  serviceId?: string;
  serviceSnapshot?: {
    id: string;
    description: string;
    serviceListItem: string;
    municipalServiceCode?: string;
    taxRate: number;
    issWithheld: boolean;
    defaultAmount: number;
  };
  customer: FiscalCustomer;
  service: FiscalService;
  issuedAt?: Timestamp;
  providerStatus?: string;
  providerMessage?: string;
  invoiceNumber?: string;
  verificationCode?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  rawResponse?: Record<string, unknown>;
  statusEvents?: Array<{
    status: FiscalInvoiceStatus;
    message?: string;
    at: Timestamp;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uid: string;
}

export interface FiscalInvoiceFormData {
  transactionId?: string;
  customerId?: string;
  customerSnapshot?: ContactSnapshot;
  serviceId?: string;
  serviceSnapshot?: {
    id: string;
    description: string;
    serviceListItem: string;
    municipalServiceCode?: string;
    taxRate: number;
    issWithheld: boolean;
    defaultAmount: number;
  };
  customer: FiscalCustomer;
  service: FiscalService;
}

// ── Pagination ─────────────────────────────────────────────────────

export interface PaginationState {
  page: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
