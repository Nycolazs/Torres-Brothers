'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { useAuth } from '@/hooks/useAuth';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { Transaction } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameMonth,
  addDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FluxoCaixaPage() {
  const { companyUid } = useAuth();
  const { accounts } = useBankAccounts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [regime, setRegime] = useState<'cash' | 'accrual'>('cash');
  const [bankAccountId, setBankAccountId] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(subMonths(new Date(), 5)));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(addMonths(new Date(), 2)));

  useEffect(() => {
    const activeCompanyUid = companyUid;
    if (!activeCompanyUid) return;

    async function loadTransactions(activeUid: string) {
      setLoading(true);
      try {
        const data = await getTransactionsByDateRange(activeUid, dateFrom, dateTo);
        setTransactions(data);
      } catch {
        toast.error('Erro ao carregar fluxo de caixa.');
      } finally {
        setLoading(false);
      }
    }

    loadTransactions(activeCompanyUid);
  }, [companyUid, dateFrom, dateTo]);

  const getTransactionDate = useCallback(
    (t: Transaction) => {
      if (regime === 'cash') {
        return t.paymentDate ? t.paymentDate.toDate() : t.dueDate.toDate();
      }
      return t.competenceDate.toDate();
    },
    [regime]
  );

  // Monthly view data
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: dateFrom, end: dateTo });
    const scopedTransactions = transactions.filter((transaction) =>
      bankAccountId === 'all' ? true : transaction.bankAccountId === bankAccountId
    );
    return months.reduce<Array<{
      month: string;
      entradas: number;
      saidas: number;
      entradasPrevistas: number;
      saidasPrevistas: number;
      saldo: number;
      previsto: number;
      acumulado: number;
    }>>((rows, month) => {
      let income = 0;
      let expenses = 0;
      let projectedIncome = 0;
      let projectedExpenses = 0;

      for (const t of scopedTransactions) {
        if (t.status === 'cancelled') continue;
        const date = getTransactionDate(t);
        if (!isSameMonth(date, month)) continue;

        const realizedAmount = t.status === 'paid' ? t.amount : t.paidAmount || 0;
        const openAmount = t.status === 'paid' ? 0 : t.remainingAmount ?? t.amount;

        if (t.type === 'income') {
          income += realizedAmount;
          projectedIncome += openAmount;
        } else {
          expenses += realizedAmount;
          projectedExpenses += openAmount;
        }
      }

      const balance = income - expenses;
      const projectedBalance = projectedIncome - projectedExpenses;
      const accumulated = (rows[rows.length - 1]?.acumulado || 0) + balance;

      return [
        ...rows,
        {
          month: format(month, 'MMM/yy', { locale: ptBR }),
          entradas: income,
          saidas: expenses,
          entradasPrevistas: projectedIncome,
          saidasPrevistas: projectedExpenses,
          saldo: balance,
          previsto: projectedBalance,
          acumulado: accumulated,
        },
      ];
    }, []);
  }, [bankAccountId, dateFrom, dateTo, getTransactionDate, transactions]);

  // Projection data for chart (next 90 days)
  const projectionData = useMemo(() => {
    const now = new Date();
    const end = addDays(now, 90);
    const days = eachDayOfInterval({ start: now, end });
    const scopedTransactions = transactions.filter((transaction) =>
      bankAccountId === 'all' ? true : transaction.bankAccountId === bankAccountId
    );
    const accountInitialBalance =
      bankAccountId === 'all'
        ? accounts.reduce((sum, account) => sum + account.initialBalance, 0)
        : accounts.find((account) => account.id === bankAccountId)?.initialBalance || 0;
    const initialBalance = scopedTransactions.reduce((total, transaction) => {
      if (transaction.status !== 'paid') return total;

      const date = getTransactionDate(transaction);
      if (date > now) return total;

      const realizedAmount = transaction.paidAmount || transaction.amount;
      return total + (transaction.type === 'income' ? realizedAmount : -realizedAmount);
    }, accountInitialBalance);

    return days.reduce<Array<{ date: string; saldo: number }>>((rows, day) => {
      const balanceDelta = scopedTransactions.reduce((total, transaction) => {
        if (transaction.status === 'cancelled') return total;

        const date = transaction.dueDate.toDate();
        if (!isSameDay(date, day)) return total;

        const openAmount = transaction.status === 'paid' ? 0 : transaction.remainingAmount ?? transaction.amount;
        return total + (transaction.type === 'income' ? openAmount : -openAmount);
      }, 0);

      const previousBalance = rows[rows.length - 1]?.saldo ?? initialBalance;
      const nextBalance = Math.round((previousBalance + balanceDelta) * 100) / 100;

      return [
        ...rows,
        {
          date: format(day, 'dd/MM', { locale: ptBR }),
          saldo: nextBalance,
        },
      ];
    }, []);
  }, [accounts, bankAccountId, getTransactionDate, transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe a movimentação financeira da empresa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={regime === 'cash' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRegime('cash')}
            >
              Regime de Caixa
            </Button>
            <Button
              variant={regime === 'accrual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRegime('accrual')}
            >
              Competência
            </Button>
          </div>
          <Select value={bankAccountId} onValueChange={(value) => value && setBankAccountId(value)}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Consolidado</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onSelect={({ from, to }) => {
              if (from) setDateFrom(from);
              if (to) setDateTo(to);
            }}
          />
        </div>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Visão Mensal</TabsTrigger>
          <TabsTrigger value="projection">Projeção (90 dias)</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6 mt-4">
          {loading ? (
            <TableSkeleton />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                        <TableHead className="text-right">Saídas</TableHead>
                        <TableHead className="text-right">Previsto</TableHead>
                        <TableHead className="text-right">Saldo do Período</TableHead>
                        <TableHead className="text-right">Saldo Acumulado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell className="font-medium capitalize">{row.month}</TableCell>
                          <TableCell className="text-right text-emerald-600 tabular-nums">
                            {formatCurrency(row.entradas)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 tabular-nums">
                            {formatCurrency(row.saidas)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold tabular-nums',
                              row.previsto >= 0 ? 'text-emerald-600' : 'text-red-600'
                            )}
                            title={`Entradas previstas: ${formatCurrency(row.entradasPrevistas)} | Saídas previstas: ${formatCurrency(row.saidasPrevistas)}`}
                          >
                            {formatCurrency(row.previsto)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold tabular-nums',
                              row.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'
                            )}
                          >
                            {formatCurrency(row.saldo)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold tabular-nums',
                              row.acumulado >= 0 ? 'text-emerald-600' : 'text-red-600'
                            )}
                          >
                            {formatCurrency(row.acumulado)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projection" className="mt-4">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Projeção de Saldo — Próximos 90 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={projectionData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()
                      }
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Saldo']}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      stroke="#3b82f6"
                      fill="url(#colorSaldo)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
