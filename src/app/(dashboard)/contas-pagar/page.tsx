'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { KpiCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { markAsPaid } from '@/services/transactionService';
import { Transaction } from '@/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { addDays, endOfDay, endOfMonth, startOfDay, isBefore, isToday } from 'date-fns';

export default function ContasPagarPage() {
  const { companyUid } = useAuth();
  const { accounts } = useBankAccounts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeCompanyUid = companyUid;
    if (!activeCompanyUid) return;
    const start = new Date(2020, 0, 1);
    const end = new Date(2030, 11, 31);

    async function loadTransactions(activeUid: string) {
      setLoading(true);
      try {
        const data = await getTransactionsByDateRange(activeUid, start, end);
        const unpaid = data.filter(
          (t) =>
            (t.type === 'expense' || t.type === 'cost') &&
            t.status !== 'paid' &&
            t.status !== 'cancelled'
        );
        setTransactions(unpaid);
      } catch {
        toast.error('Erro ao carregar contas a pagar.');
      } finally {
        setLoading(false);
      }
    }

    loadTransactions(activeCompanyUid);
  }, [companyUid]);
  const groups = useMemo(() => {
    const now = new Date();
    const overdue: Transaction[] = [];
    const today: Transaction[] = [];
    const thisWeek: Transaction[] = [];
    const thisMonth: Transaction[] = [];
    const future: Transaction[] = [];

    const weekEnd = endOfDay(addDays(now, 7));
    const monthEnd = endOfMonth(now);

    for (const t of transactions) {
      const due = t.dueDate.toDate();
      if (isBefore(due, startOfDay(now)) && !isToday(due)) {
        overdue.push(t);
      } else if (isToday(due)) {
        today.push(t);
      } else if (isBefore(due, weekEnd)) {
        thisWeek.push(t);
      } else if (isBefore(due, monthEnd)) {
        thisMonth.push(t);
      } else {
        future.push(t);
      }
    }

    return { overdue, today, thisWeek, thisMonth, future };
  }, [transactions]);

  const totalOverdue = groups.overdue.reduce((s, t) => s + t.amount, 0);
  const total7Days = [...groups.today, ...groups.thisWeek].reduce((s, t) => s + t.amount, 0);
  const total30Days = [...groups.today, ...groups.thisWeek, ...groups.thisMonth].reduce(
    (s, t) => s + t.amount,
    0
  );

  const handleMarkAsPaid = async (id: string) => {
    if (!companyUid) return;
    const defaultAccount = accounts[0]?.id;
    if (!defaultAccount) {
      toast.error('Cadastre uma conta bancária primeiro.');
      return;
    }
    try {
      await markAsPaid(companyUid, id, new Date(), defaultAccount);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success('Conta marcada como paga!');
    } catch {
      toast.error('Erro ao marcar como pago.');
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
            <Badge variant="secondary" className="ml-auto">
              {items.length}
            </Badge>
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
                  <span className="text-xs text-muted-foreground">
                    Vencimento: {formatDate(t.dueDate)}
                  </span>
                  {t.contactName && (
                    <span className="text-xs text-muted-foreground">• {t.contactName}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-semibold text-red-600 tabular-nums">
                  {formatCurrency(t.amount)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsPaid(t.id)}
                  className="shrink-0"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Pagar
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
        <h1 className="text-2xl font-bold">Contas a Pagar</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas obrigações financeiras
        </p>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <KpiCard
            title="Total Vencido"
            value={totalOverdue}
            icon={AlertTriangle}
            variant="danger"
          />
          <KpiCard
            title="A Vencer (7 dias)"
            value={total7Days}
            icon={Clock}
            variant="warning"
          />
          <KpiCard
            title="A Vencer (30 dias)"
            value={total30Days}
            icon={Calendar}
            variant="default"
          />
        </div>
      )}

      {/* Groups */}
      {loading ? (
        <div className="space-y-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Tudo em dia!"
          description="Você não possui contas pendentes no momento."
        />
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
