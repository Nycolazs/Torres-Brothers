'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { ChartDataPoint, Transaction } from '@/types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function useCashFlowChart(months: number = 6) {
  const { companyUid } = useAuth();
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyUid) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const start = startOfMonth(subMonths(now, months - 1));
        const end = endOfMonth(now);

        const transactions = await getTransactionsByDateRange(companyUid, start, end);
        const monthlyData: Record<string, { receitas: number; custos: number; despesas: number }> = {};

        for (let i = 0; i < months; i++) {
          const monthDate = subMonths(now, months - 1 - i);
          const key = format(monthDate, 'yyyy-MM');
          const label = format(monthDate, 'MMM/yy', { locale: ptBR });
          monthlyData[key] = { receitas: 0, custos: 0, despesas: 0 };
        }

        for (const t of transactions) {
          if (t.status === 'cancelled') continue;
          const date = t.dueDate.toDate();
          const key = format(date, 'yyyy-MM');
          if (!monthlyData[key]) continue;

          switch (t.type) {
            case 'income':
              monthlyData[key].receitas += t.amount;
              break;
            case 'cost':
              monthlyData[key].custos += t.amount;
              break;
            case 'expense':
              monthlyData[key].despesas += t.amount;
              break;
          }
        }

        const chartData: ChartDataPoint[] = Object.entries(monthlyData).map(([key, values]) => {
          const date = new Date(key + '-01');
          return {
            name: format(date, 'MMM/yy', { locale: ptBR }),
            receitas: values.receitas,
            custos: values.custos,
            despesas: values.custos + values.despesas,
            resultado: values.receitas - values.custos - values.despesas,
          };
        });

        setData(chartData);
      } catch {
        toast.error('Erro ao carregar fluxo de caixa.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyUid, months]);

  return { data, loading };
}

export function useExpenseBreakdown(startDate: Date, endDate: Date) {
  const { companyUid } = useAuth();
  const [data, setData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyUid) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const transactions = await getTransactionsByDateRange(companyUid, startDate, endDate);
        const categoryTotals: Record<string, { value: number; color: string }> = {};

        for (const t of transactions) {
          if (t.status === 'cancelled' || t.type === 'income') continue;
          const catName = t.categoryId;
          if (!categoryTotals[catName]) {
            categoryTotals[catName] = { value: 0, color: '#6b7280' };
          }
          categoryTotals[catName].value += t.amount;
        }

        const sorted = Object.entries(categoryTotals)
          .map(([name, { value, color }]) => ({ name, value, color }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

        const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
        sorted.forEach((item, i) => {
          item.color = colors[i % colors.length];
        });

        setData(sorted);
      } catch {
        toast.error('Erro ao carregar despesas.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyUid, startDate, endDate]);

  return { data, loading };
}
