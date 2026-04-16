'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { KpiCardSkeleton, ChartSkeleton } from '@/components/shared/LoadingSkeleton';
import { useTransactionsSummary, useRecentTransactions } from '@/hooks/useTransactions';
import { useCashFlowChart, useExpenseBreakdown } from '@/hooks/useCashFlow';
import { getDateRange, calculatePercentageChange } from '@/lib/utils';
import { PERIOD_OPTIONS } from '@/constants';

const CashFlowChart = dynamic(
  () => import('@/components/dashboard/CashFlowChart').then((m) => ({ default: m.CashFlowChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const ExpenseBreakdownChart = dynamic(
  () =>
    import('@/components/dashboard/ExpenseBreakdownChart').then((m) => ({
      default: m.ExpenseBreakdownChart,
    })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export default function DashboardPage() {
  const [period, setPeriod] = useState('this_month');
  const selectedPeriodLabel =
    PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? 'Período';

  const dateRange = useMemo(() => getDateRange(period), [period]);
  const prevDateRange = useMemo(() => {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: new Date(dateRange.start.getTime() - 1),
    };
  }, [dateRange]);

  const { summary, loading: summaryLoading } = useTransactionsSummary(
    dateRange.start,
    dateRange.end
  );
  const { summary: prevSummary } = useTransactionsSummary(
    prevDateRange.start,
    prevDateRange.end
  );

  const { data: cashFlowData, loading: cashFlowLoading } = useCashFlowChart(6);
  const { data: expenseData, loading: expenseLoading } = useExpenseBreakdown(
    dateRange.start,
    dateRange.end
  );
  const { transactions: recentTx, loading: recentLoading } = useRecentTransactions(5);

  const grossMargin =
    summary.totalIncome > 0
      ? ((summary.totalIncome - summary.totalCosts) / summary.totalIncome) * 100
      : 0;

  const netMargin =
    summary.totalIncome > 0 ? (summary.netResult / summary.totalIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe a saúde financeira da sua empresa
          </p>
        </div>
        <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>{selectedPeriodLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.filter((o) => o.value !== 'custom').map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      {summaryLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
          <KpiCard
            title="Receita Total"
            value={summary.totalIncome}
            change={calculatePercentageChange(summary.totalIncome, prevSummary.totalIncome)}
            changeLabel="vs. anterior"
            icon={TrendingUp}
            variant="success"
          />
          <KpiCard
            title="Custos (CMV)"
            value={summary.totalCosts}
            change={calculatePercentageChange(summary.totalCosts, prevSummary.totalCosts)}
            changeLabel="vs. anterior"
            icon={TrendingDown}
            variant="danger"
          />
          <KpiCard
            title="Margem Bruta"
            value={grossMargin}
            icon={BarChart3}
            suffix="%"
          />
          <KpiCard
            title="Despesas Operacionais"
            value={summary.totalExpenses}
            change={calculatePercentageChange(summary.totalExpenses, prevSummary.totalExpenses)}
            changeLabel="vs. anterior"
            icon={DollarSign}
            variant="warning"
          />
          <KpiCard
            title="Resultado Líquido"
            value={summary.netResult}
            change={calculatePercentageChange(summary.netResult, prevSummary.netResult)}
            changeLabel="vs. anterior"
            icon={Wallet}
            variant={summary.netResult >= 0 ? 'success' : 'danger'}
          />
          <KpiCard
            title="Margem Líquida"
            value={netMargin}
            icon={AlertTriangle}
            suffix="%"
            variant={netMargin >= 0 ? 'success' : 'danger'}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {cashFlowLoading ? <ChartSkeleton /> : <CashFlowChart data={cashFlowData} />}
        {expenseLoading ? <ChartSkeleton /> : <ExpenseBreakdownChart data={expenseData} />}
      </div>

      {/* Recent Transactions */}
      <div className="grid gap-6 grid-cols-1">
        {recentLoading ? (
          <ChartSkeleton />
        ) : (
          <RecentTransactions transactions={recentTx} />
        )}
      </div>
    </div>
  );
}
