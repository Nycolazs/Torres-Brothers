'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, Calendar, CheckCircle, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { KpiCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { getTransactionsByDateRange, markAsPaid } from '@/services/transactionService';
import { Transaction } from '@/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { addDays, endOfDay, endOfMonth, startOfDay, isBefore, isToday } from 'date-fns';

export default function ContasReceberPage() {
  const { user } = useAuth();
  const { accounts } = useBankAccounts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getTransactionsByDateRange(user.uid, new Date(2020, 0, 1), new Date(2030, 11, 31))
      .then((data) => {
        const unpaid = data.filter(
          (t) => t.type === 'income' && t.status !== 'paid' && t.status !== 'cancelled'
        );
        setTransactions(unpaid);
      })
      .catch(() => toast.error('Erro ao carregar contas a receber.'))
      .finally(() => setLoading(false));
  }, [user]);

  const now = new Date();

  const groups = useMemo(() => {
    const overdue: Transaction[] = [];
    const today: Transaction[] = [];
    const thisWeek: Transaction[] = [];
    const thisMonth: Transaction[] = [];
    const future: Transaction[] = [];
    const weekEnd = endOfDay(addDays(now, 7));
    const monthEnd = endOfMonth(now);

    for (const t of transactions) {
      const due = t.dueDate.toDate();
      if (isBefore(due, startOfDay(now)) && !isToday(due)) overdue.push(t);
      else if (isToday(due)) today.push(t);
      else if (isBefore(due, weekEnd)) thisWeek.push(t);
      else if (isBefore(due, monthEnd)) thisMonth.push(t);
      else future.push(t);
    }
    return { overdue, today, thisWeek, thisMonth, future };
  }, [transactions, now]);

  const totalOverdue = groups.overdue.reduce((s, t) => s + t.amount, 0);
  const totalAll = transactions.reduce((s, t) => s + t.amount, 0);
  const inadimplencia = totalAll > 0 ? (totalOverdue / totalAll) * 100 : 0;

  const handleMarkAsReceived = async (id: string) => {
    if (!user) return;
    const defaultAccount = accounts[0]?.id;
    if (!defaultAccount) {
      toast.error('Cadastre uma conta bancária primeiro.');
      return;
    }
    try {
      await markAsPaid(user.uid, id, new Date(), defaultAccount);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success('Recebimento confirmado!');
    } catch {
      toast.error('Erro ao confirmar recebimento.');
    }
  };

  const renderGroup = (title: string, items: Transaction[], variant: 'destructive' | 'warning' | 'default') => {
    if (items.length === 0) return null;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {variant === 'destructive' && <AlertTriangle className="h-4 w-4 text-destructive" />}
            {variant === 'warning' && <Clock className="h-4 w-4 text-amber-500" />}
            {variant === 'default' && <Calendar className="h-4 w-4 text-muted-foreground" />}
            {title}
            <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((t) => (
            <div
              key={t.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                variant === 'destructive' && 'border-destructive/30 bg-destructive/5'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{t.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">Vencimento: {formatDate(t.dueDate)}</span>
                  {t.contactName && <span className="text-xs text-muted-foreground">• {t.contactName}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                  {formatCurrency(t.amount)}
                </span>
                <Button size="sm" variant="outline" onClick={() => handleMarkAsReceived(t.id)} className="shrink-0">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Receber
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seus recebíveis</p>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <KpiCard title="Total a Receber" value={totalAll} icon={Calendar} variant="default" />
          <KpiCard title="Vencido" value={totalOverdue} icon={AlertTriangle} variant="danger" />
          <KpiCard title="Inadimplência" value={inadimplencia} icon={TrendingDown} variant={inadimplencia > 10 ? 'danger' : 'warning'} suffix="%" />
        </div>
      )}

      {loading ? (
        <KpiCardSkeleton />
      ) : transactions.length === 0 ? (
        <EmptyState icon={CheckCircle} title="Nada pendente!" description="Não há contas a receber no momento." />
      ) : (
        <div className="space-y-4">
          {renderGroup(`Vencidas (${groups.overdue.length})`, groups.overdue, 'destructive')}
          {renderGroup(`Hoje (${groups.today.length})`, groups.today, 'warning')}
          {renderGroup(`Esta Semana (${groups.thisWeek.length})`, groups.thisWeek, 'warning')}
          {renderGroup(`Este Mês (${groups.thisMonth.length})`, groups.thisMonth, 'default')}
          {renderGroup(`Futuras (${groups.future.length})`, groups.future, 'default')}
        </div>
      )}
    </div>
  );
}
