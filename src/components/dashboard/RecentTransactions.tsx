'use client';

import { ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Transaction } from '@/types';
import { TRANSACTION_STATUS_LABELS, STATUS_COLORS } from '@/constants';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Últimas Transações</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma transação recente
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
                      transaction.type === 'income'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    )}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', STATUS_COLORS[transaction.status])}
                  >
                    {transaction.status === 'overdue' && <Clock className="h-3 w-3 mr-1" />}
                    {TRANSACTION_STATUS_LABELS[transaction.status]}
                  </Badge>
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
