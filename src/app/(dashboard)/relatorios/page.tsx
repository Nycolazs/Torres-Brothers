'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, BarChart3, Building, Landmark, AlertTriangle, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { ExportButton } from '@/components/reports/ExportButton';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { Transaction } from '@/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { startOfMonth, endOfMonth, isBefore, differenceInDays } from 'date-fns';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/constants';

export default function RelatoriosPage() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const { accounts } = useBankAccounts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getTransactionsByDateRange(user.uid, dateFrom, dateTo)
      .then(setTransactions)
      .catch(() => toast.error('Erro ao carregar relatórios.'))
      .finally(() => setLoading(false));
  }, [user, dateFrom, dateTo]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Category Report
  const categoryReport = useMemo(() => {
    const totals: Record<string, { name: string; income: number; expense: number; color: string }> = {};
    for (const t of transactions) {
      if (t.status === 'cancelled') continue;
      const cat = categoryMap.get(t.categoryId);
      const name = cat?.name || 'Sem categoria';
      const color = cat?.color || '#6b7280';
      if (!totals[name]) totals[name] = { name, income: 0, expense: 0, color };
      if (t.type === 'income') totals[name].income += t.amount;
      else totals[name].expense += t.amount;
    }
    return Object.values(totals).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
  }, [transactions, categoryMap]);

  // Bank Statement
  const bankStatement = useMemo(() => {
    const statements: Record<string, { name: string; entries: Array<{ date: string; desc: string; type: string; amount: number; balance: number }> }> = {};
    for (const acc of accounts) {
      statements[acc.id] = { name: acc.name, entries: [] };
      let balance = acc.initialBalance;
      const accTx = transactions
        .filter((t) => t.bankAccountId === acc.id && t.status === 'paid')
        .sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime());
      for (const t of accTx) {
        balance += t.type === 'income' ? t.amount : -t.amount;
        statements[acc.id].entries.push({
          date: formatDate(t.dueDate),
          desc: t.description,
          type: TRANSACTION_TYPE_LABELS[t.type],
          amount: t.type === 'income' ? t.amount : -t.amount,
          balance,
        });
      }
    }
    return statements;
  }, [transactions, accounts]);

  // Aging report
  const agingReport = useMemo(() => {
    const now = new Date();
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    const overdue = transactions.filter(
      (t) => t.type === 'income' && (t.status === 'pending' || t.status === 'overdue') && isBefore(t.dueDate.toDate(), now)
    );
    for (const t of overdue) {
      const days = differenceInDays(now, t.dueDate.toDate());
      if (days <= 30) buckets['0-30'] += t.amount;
      else if (days <= 60) buckets['31-60'] += t.amount;
      else if (days <= 90) buckets['61-90'] += t.amount;
      else buckets['90+'] += t.amount;
    }
    return buckets;
  }, [transactions]);

  // Full ledger export data
  const ledgerExportData = transactions.map((t) => ({
    data: formatDate(t.dueDate),
    descricao: t.description,
    tipo: TRANSACTION_TYPE_LABELS[t.type],
    categoria: categoryMap.get(t.categoryId)?.name || '',
    valor: t.amount,
    status: TRANSACTION_STATUS_LABELS[t.status],
    conta: accountMap.get(t.bankAccountId)?.name || '',
    pagamento: t.paymentMethod ? PAYMENT_METHOD_LABELS[t.paymentMethod] : '',
    contato: t.contactName || '',
  }));

  const ledgerColumns = [
    { header: 'Data', key: 'data' },
    { header: 'Descrição', key: 'descricao' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Categoria', key: 'categoria' },
    { header: 'Valor', key: 'valor' },
    { header: 'Status', key: 'status' },
    { header: 'Conta', key: 'conta' },
    { header: 'Pagamento', key: 'pagamento' },
    { header: 'Contato', key: 'contato' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Relatórios financeiros detalhados</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onSelect={({ from, to }) => {
              if (from) setDateFrom(from);
              if (to) setDateTo(to);
            }}
          />
          <ExportButton
            data={ledgerExportData as Record<string, unknown>[]}
            columns={ledgerColumns}
            filename="relatorio-lancamentos"
            title="Relatório de Lançamentos"
          />
        </div>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="flex-wrap">
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="bank">Extrato Bancário</TabsTrigger>
          <TabsTrigger value="aging">Inadimplência</TabsTrigger>
          <TabsTrigger value="ledger">Lançamentos</TabsTrigger>
        </TabsList>

        {/* Category Report */}
        <TabsContent value="categories" className="mt-4">
          {loading ? (
            <TableSkeleton />
          ) : categoryReport.length === 0 ? (
            <EmptyState icon={BarChart3} title="Sem dados" description="Nenhuma transação no período selecionado." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Receitas</TableHead>
                      <TableHead className="text-right">Despesas</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryReport.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                            {row.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 tabular-nums">
                          {formatCurrency(row.income)}
                        </TableCell>
                        <TableCell className="text-right text-red-600 tabular-nums">
                          {formatCurrency(row.expense)}
                        </TableCell>
                        <TableCell className={cn('text-right font-semibold tabular-nums', row.income - row.expense >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {formatCurrency(row.income - row.expense)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bank Statement */}
        <TabsContent value="bank" className="mt-4 space-y-4">
          {loading ? (
            <TableSkeleton />
          ) : accounts.length === 0 ? (
            <EmptyState icon={Landmark} title="Sem contas" description="Cadastre uma conta bancária para ver o extrato." />
          ) : (
            Object.entries(bankStatement).map(([accId, { name, entries }]) => (
              <Card key={accId}>
                <CardHeader>
                  <CardTitle className="text-base">{name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhuma movimentação no período
                          </TableCell>
                        </TableRow>
                      ) : (
                        entries.map((entry, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{entry.date}</TableCell>
                            <TableCell className="text-sm">{entry.desc}</TableCell>
                            <TableCell className="text-sm">{entry.type}</TableCell>
                            <TableCell className={cn('text-right text-sm tabular-nums', entry.amount >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                              {formatCurrency(entry.amount)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium tabular-nums">
                              {formatCurrency(entry.balance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Aging Report */}
        <TabsContent value="aging" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relatório de Inadimplência</CardTitle>
              <CardDescription>Recebíveis vencidos por faixa de atraso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(agingReport).map(([range, amount]) => (
                  <div key={range} className="p-4 border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">{range} dias</p>
                    <p className={cn('text-xl font-bold', amount > 0 ? 'text-red-600' : 'text-muted-foreground')}>
                      {formatCurrency(amount)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  Total Inadimplente:{' '}
                  <span className="text-red-600">
                    {formatCurrency(Object.values(agingReport).reduce((s, v) => s + v, 0))}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Full Ledger */}
        <TabsContent value="ledger" className="mt-4">
          {loading ? (
            <TableSkeleton />
          ) : transactions.length === 0 ? (
            <EmptyState icon={Receipt} title="Sem lançamentos" description="Nenhum lançamento encontrado no período." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Conta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-sm">{formatDate(t.dueDate)}</TableCell>
                          <TableCell className="text-sm font-medium">{t.description}</TableCell>
                          <TableCell className="text-sm">{TRANSACTION_TYPE_LABELS[t.type]}</TableCell>
                          <TableCell className="text-sm">{categoryMap.get(t.categoryId)?.name || '—'}</TableCell>
                          <TableCell className={cn('text-right text-sm tabular-nums font-semibold', t.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                            {formatCurrency(t.amount)}
                          </TableCell>
                          <TableCell className="text-sm">{TRANSACTION_STATUS_LABELS[t.status]}</TableCell>
                          <TableCell className="text-sm">{accountMap.get(t.bankAccountId)?.name || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
