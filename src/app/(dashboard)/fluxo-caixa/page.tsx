'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
import { Badge } from '@/components/ui/badge';
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
import { getTransactionsByDateRange } from '@/services/transactionService';
import { Transaction } from '@/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfDay,
  endOfDay,
  isSameDay,
  isSameMonth,
  addDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FluxoCaixaPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [regime, setRegime] = useState<'cash' | 'accrual'>('cash');
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(subMonths(new Date(), 5)));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(addMonths(new Date(), 2)));

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getTransactionsByDateRange(user.uid, dateFrom, dateTo)
      .then(setTransactions)
      .catch(() => toast.error('Erro ao carregar fluxo de caixa.'))
      .finally(() => setLoading(false));
  }, [user, dateFrom, dateTo]);

  const getTransactionDate = (t: Transaction) => {
    if (regime === 'cash') {
      return t.paymentDate ? t.paymentDate.toDate() : t.dueDate.toDate();
    }
    return t.competenceDate.toDate();
  };

  // Monthly view data
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: dateFrom, end: dateTo });
    let accumulated = 0;

    return months.map((month) => {
      let income = 0;
      let expenses = 0;

      for (const t of transactions) {
        if (t.status === 'cancelled') continue;
        const date = getTransactionDate(t);
        if (!isSameMonth(date, month)) continue;

        if (t.type === 'income') income += t.amount;
        else expenses += t.amount;
      }

      const balance = income - expenses;
      accumulated += balance;

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        entradas: income,
        saidas: expenses,
        saldo: balance,
        acumulado: accumulated,
      };
    });
  }, [transactions, dateFrom, dateTo, regime]);

  // Projection data for chart (next 90 days)
  const projectionData = useMemo(() => {
    const now = new Date();
    const end = addDays(now, 90);
    const days = eachDayOfInterval({ start: now, end });
    let balance = 0;

    // Calculate current balance from paid transactions
    for (const t of transactions) {
      if (t.status !== 'paid') continue;
      const date = getTransactionDate(t);
      if (date <= now) {
        balance += t.type === 'income' ? t.amount : -t.amount;
      }
    }

    return days.map((day) => {
      for (const t of transactions) {
        if (t.status === 'cancelled') continue;
        const date = t.dueDate.toDate();
        if (isSameDay(date, day)) {
          balance += t.type === 'income' ? t.amount : -t.amount;
        }
      }

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        saldo: Math.round(balance * 100) / 100,
      };
    });
  }, [transactions, regime]);

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
