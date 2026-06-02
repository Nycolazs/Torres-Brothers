'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useAuth } from '@/hooks/useAuth';
import { buildContactSnapshot, listContacts, listFinancialAccounts } from '@/services/erpService';
import {
  Contact,
  FinancialAccount,
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionFormData,
  ReportFilters,
} from '@/types';
import { ITEMS_PER_PAGE_OPTIONS } from '@/constants';
import { startOfYear, endOfYear } from 'date-fns';

export default function LancamentosPage() {
  const { companyUid } = useAuth();
  // Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfYear(new Date()));
  const [dateTo, setDateTo] = useState<Date | undefined>(endOfYear(new Date()));
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Build filters
  const filters: ReportFilters = useMemo(
    () => ({
      startDate: dateFrom || new Date(2020, 0, 1),
      endDate: dateTo || new Date(2030, 11, 31),
      type: typeFilter === 'all' ? undefined : typeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [dateFrom, dateTo, typeFilter, statusFilter]
  );

  const {
    transactions,
    loading,
    totalItems,
    page,
    totalPages,
    nextPage,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    markAsPaid,
    bulkDelete,
  } = useTransactions(filters, itemsPerPage);

  const { categories } = useCategories();
  const { accounts: bankAccounts } = useBankAccounts();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);

  useEffect(() => {
    if (!companyUid) return;

    Promise.all([listContacts(companyUid), listFinancialAccounts(companyUid)])
      .then(([contactData, financialAccountData]) => {
        setContacts(contactData);
        setFinancialAccounts(financialAccountData);
      })
      .catch(() => toast.error('Erro ao carregar cadastros financeiros.'));
  }, [companyUid]);

  // Filter by search locally
  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions;
    const term = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(term) ||
        t.contactSnapshot?.name?.toLowerCase().includes(term) ||
        t.contactName?.toLowerCase().includes(term) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(term))
    );
  }, [transactions, search]);

  const hasActiveFilters =
    search.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFrom(startOfYear(new Date()));
    setDateTo(endOfYear(new Date()));
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleSubmit = async (data: TransactionFormData) => {
    const selectedContact = contacts.find((contact) => contact.id === data.contactId);
    if (data.type === 'income' && selectedContact?.blocked) {
      toast.error('Cliente bloqueado. Não é possível criar novo recebível.');
      return;
    }
    const payload: TransactionFormData = {
      ...data,
      contactSnapshot: selectedContact ? buildContactSnapshot(selectedContact) : data.contactSnapshot,
      contactName: selectedContact?.name || data.contactName,
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, payload);
    } else {
      await createTransaction(payload);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTransaction(deleteId);
      setDeleteId(null);
    } catch {
      toast.error('Erro ao excluir lançamento.');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDelete(selectedIds);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error('Erro ao excluir lançamentos.');
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const defaultAccount = bankAccounts[0]?.id;
    if (!defaultAccount) {
      toast.error('Cadastre uma conta bancária primeiro.');
      return;
    }
    await markAsPaid(id, new Date(), defaultAccount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lançamentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as entradas e saídas financeiras
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      {/* Filters */}
      <TransactionFilters
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={({ from, to }) => {
          setDateFrom(from);
          setDateTo(to);
        }}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.length} selecionado(s)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
            Limpar seleção
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={itemsPerPage} />
      ) : (
        <TransactionTable
          transactions={filteredTransactions}
          categories={categories}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteId(id)}
          onMarkAsPaid={handleMarkAsPaid}
        />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens por página:</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => setItemsPerPage(Number(v))}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue>{itemsPerPage}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Página {page} de {Math.max(totalPages, 1)} ({totalItems} itens)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={nextPage}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={editingTransaction}
        categories={categories}
        bankAccounts={bankAccounts}
        contacts={contacts}
        financialAccounts={financialAccounts}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir Lançamento"
        description="Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Excluir Lançamentos"
        description={`Tem certeza que deseja excluir ${selectedIds.length} lançamento(s)? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir Todos"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
