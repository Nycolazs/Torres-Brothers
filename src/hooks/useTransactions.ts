'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { Transaction, ReportFilters } from '@/types';
import {
  getTransactions,
  getTransactionsByDateRange,
  getTransactionsSummary,
  createTransaction as createTx,
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
  markAsPaid as markTxPaid,
  bulkMarkAsPaid as bulkMarkTxPaid,
  bulkDelete as bulkDeleteTx,
} from '@/services/transactionService';
import { TransactionFormData } from '@/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useTransactions(filters: ReportFilters, itemsPerPage: number = 10) {
  const { companyUid } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(
    async (pageDoc: DocumentSnapshot | null = null) => {
      if (!companyUid) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await getTransactions(companyUid, filters, {
          itemsPerPage,
          lastDoc: pageDoc,
        });
        setTransactions(result.data);
        setLastDoc(result.lastDoc);
        setTotalItems(result.totalEstimate);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Erro ao carregar lançamentos.');
      } finally {
        setLoading(false);
      }
    },
    [companyUid, filters, itemsPerPage]
  );

  useEffect(() => {
    setPage(1);
    fetchTransactions(null);
  }, [fetchTransactions]);

  const nextPage = useCallback(() => {
    if (lastDoc) {
      setPage((p) => p + 1);
      fetchTransactions(lastDoc);
    }
  }, [lastDoc, fetchTransactions]);

  const refresh = useCallback(() => {
    setPage(1);
    fetchTransactions(null);
  }, [fetchTransactions]);

  const createTransaction = useCallback(
    async (data: TransactionFormData) => {
      if (!companyUid) return;
      await createTx(companyUid, data);
      toast.success('Lançamento criado com sucesso!');
      refresh();
    },
    [companyUid, refresh]
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<TransactionFormData>) => {
      if (!companyUid) return;
      await updateTx(companyUid, id, data);
      toast.success('Lançamento atualizado!');
      refresh();
    },
    [companyUid, refresh]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!companyUid) return;
      await deleteTx(companyUid, id);
      toast.success('Lançamento excluído!');
      refresh();
    },
    [companyUid, refresh]
  );

  const markAsPaid = useCallback(
    async (id: string, paymentDate: Date, bankAccountId: string) => {
      if (!companyUid) return;
      await markTxPaid(companyUid, id, paymentDate, bankAccountId);
      toast.success('Lançamento marcado como pago!');
      refresh();
    },
    [companyUid, refresh]
  );

  const bulkMarkAsPaid = useCallback(
    async (ids: string[], paymentDate: Date, bankAccountId: string) => {
      if (!companyUid) return;
      await bulkMarkTxPaid(companyUid, ids, paymentDate, bankAccountId);
      toast.success(`${ids.length} lançamentos marcados como pagos!`);
      refresh();
    },
    [companyUid, refresh]
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      if (!companyUid) return;
      await bulkDeleteTx(companyUid, ids);
      toast.success(`${ids.length} lançamentos excluídos!`);
      refresh();
    },
    [companyUid, refresh]
  );

  return {
    transactions,
    loading,
    totalItems,
    page,
    totalPages: Math.ceil(totalItems / itemsPerPage),
    nextPage,
    refresh,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    markAsPaid,
    bulkMarkAsPaid,
    bulkDelete,
  };
}

export function useTransactionsSummary(startDate: Date, endDate: Date) {
  const { companyUid } = useAuth();
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalCosts: 0,
    totalExpenses: 0,
    netResult: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeCompanyUid = companyUid;
    if (!activeCompanyUid) return;

    async function loadSummary(activeUid: string) {
      setLoading(true);
      try {
        const data = await getTransactionsSummary(activeUid, startDate, endDate);
        setSummary(data);
      } catch {
        toast.error('Erro ao carregar resumo.');
      } finally {
        setLoading(false);
      }
    }

    loadSummary(activeCompanyUid);
  }, [companyUid, startDate, endDate]);

  return { summary, loading };
}

export function useRecentTransactions(limit: number = 5) {
  const { companyUid } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyUid) return;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    getTransactionsByDateRange(companyUid, sixMonthsAgo, now)
      .then((data) => setTransactions(data.slice(-limit).reverse()))
      .catch(() => toast.error('Erro ao carregar transações recentes.'))
      .finally(() => setLoading(false));
  }, [companyUid, limit]);

  return { transactions, loading };
}
