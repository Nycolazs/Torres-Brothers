import { TransactionType, TransactionStatus, PaymentMethod, BankAccountType } from '@/types';

// ── Default Categories ─────────────────────────────────────────────

export interface DefaultCategory {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Receitas (Income)
  { name: 'Vendas à Vista', type: 'income', color: '#22c55e', icon: 'ShoppingCart' },
  { name: 'Vendas a Prazo', type: 'income', color: '#16a34a', icon: 'CreditCard' },
  { name: 'Outras Receitas', type: 'income', color: '#4ade80', icon: 'Plus' },

  // Custos (Costs / COGS)
  { name: 'Compra de Mercadorias', type: 'cost', color: '#ef4444', icon: 'Package' },
  { name: 'Frete de Compras', type: 'cost', color: '#f87171', icon: 'Truck' },
  { name: 'Impostos sobre Compras', type: 'cost', color: '#dc2626', icon: 'Receipt' },

  // Despesas (Expenses)
  { name: 'Aluguel', type: 'expense', color: '#f59e0b', icon: 'Home' },
  { name: 'Energia Elétrica', type: 'expense', color: '#eab308', icon: 'Zap' },
  { name: 'Água', type: 'expense', color: '#3b82f6', icon: 'Droplets' },
  { name: 'Internet/Telefone', type: 'expense', color: '#6366f1', icon: 'Wifi' },
  { name: 'Salários e Encargos', type: 'expense', color: '#8b5cf6', icon: 'Users' },
  { name: 'Marketing', type: 'expense', color: '#ec4899', icon: 'Megaphone' },
  { name: 'Manutenção', type: 'expense', color: '#f97316', icon: 'Wrench' },
  { name: 'Contabilidade', type: 'expense', color: '#14b8a6', icon: 'Calculator' },
  { name: 'Impostos e Taxas', type: 'expense', color: '#ef4444', icon: 'Landmark' },
  { name: 'Taxas Bancárias', type: 'expense', color: '#a855f7', icon: 'Building' },
  { name: 'Pró-labore', type: 'expense', color: '#06b6d4', icon: 'UserCheck' },
  { name: 'Material de Escritório', type: 'expense', color: '#84cc16', icon: 'Paperclip' },
  { name: 'Outros', type: 'expense', color: '#6b7280', icon: 'MoreHorizontal' },
];

// ── Label Maps ─────────────────────────────────────────────────────

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Receita',
  cost: 'Custo',
  expense: 'Despesa',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

export const STATUS_COLORS: Record<TransactionStatus, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência Bancária',
  boleto: 'Boleto',
  check: 'Cheque',
};

export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  cash: 'Caixa',
  investment: 'Investimento',
};

// ── DRE Category Groups ────────────────────────────────────────────

export const DRE_CATEGORY_GROUPS = {
  receitaBrutaDeVendas: ['Vendas à Vista', 'Vendas a Prazo'],
  outrasReceitas: ['Outras Receitas'],
  custoMercadoriasVendidas: ['Compra de Mercadorias', 'Frete de Compras', 'Impostos sobre Compras'],
  despesasAdministrativas: [
    'Aluguel',
    'Energia Elétrica',
    'Água',
    'Internet/Telefone',
    'Salários e Encargos',
    'Contabilidade',
    'Material de Escritório',
    'Outros',
  ],
  despesasComVendas: ['Marketing'],
  despesasFinanceiras: ['Taxas Bancárias'],
  impostos: ['Impostos e Taxas'],
  proLabore: ['Pró-labore'],
  manutencao: ['Manutenção'],
} as const;

// ── Pagination ─────────────────────────────────────────────────────

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

// ── Currency Format ────────────────────────────────────────────────

export const CURRENCY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

// ── Period Options (Dashboard) ─────────────────────────────────────

export interface PeriodOption {
  value: string;
  label: string;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'this_week', label: 'Esta Semana' },
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_month', label: 'Mês Passado' },
  { value: 'this_quarter', label: 'Este Trimestre' },
  { value: 'this_year', label: 'Este Ano' },
  { value: 'last_year', label: 'Ano Passado' },
  { value: 'custom', label: 'Personalizado' },
];

// ── Recurrence Labels ──────────────────────────────────────────────

export const RECURRENCE_TYPE_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

// ── Transaction Type Colors ────────────────────────────────────────

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  income: 'text-green-600 dark:text-green-400',
  cost: 'text-red-600 dark:text-red-400',
  expense: 'text-orange-600 dark:text-orange-400',
};
