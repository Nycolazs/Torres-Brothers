'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { Transaction, TransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaidTransactionsPageProps {
  kind: 'paid' | 'received';
}

export function PaidTransactionsPage({ kind }: PaidTransactionsPageProps) {
  const { companyUid } = useAuth();
  const { accounts } = useBankAccounts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [query, setQuery] = useState('');
  const [bankAccountId, setBankAccountId] = useState('all');
  const [loading, setLoading] = useState(true);
  const typeFilter: TransactionType[] = kind === 'received' ? ['income'] : ['cost', 'expense'];
  const title = kind === 'received' ? 'Contas Recebidas' : 'Contas Pagas';

  useEffect(() => {
    if (!companyUid) return;
    setLoading(true);
    getTransactionsByDateRange(companyUid, new Date(2020, 0, 1), new Date(2035, 11, 31))
      .then((data) => setTransactions(data.filter((item) => typeFilter.includes(item.type) && item.status === 'paid')))
      .catch(() => toast.error(`Erro ao carregar ${title.toLowerCase()}.`))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyUid, kind]);

  const filteredTransactions = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return transactions.filter((transaction) => {
      const matchesBank = bankAccountId === 'all' || transaction.bankAccountId === bankAccountId;
      const matchesText =
        !needle ||
        transaction.description.toLowerCase().includes(needle) ||
        transaction.contactSnapshot?.name?.toLowerCase().includes(needle) ||
        transaction.contactName?.toLowerCase().includes(needle);
      return matchesBank && matchesText;
    });
  }, [bankAccountId, query, transactions]);

  const total = useMemo(() => filteredTransactions.reduce((sum, item) => sum + item.amount, 0), [filteredTransactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">Histórico financeiro liquidado com totais e contatos vinculados.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Total liquidado</div>
          <div className="text-2xl font-bold">{formatCurrency(total)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar descrição ou contato" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={bankAccountId} onValueChange={(value) => value && setBankAccountId(value)}>
            <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableSkeleton /></div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nenhum registro liquidado" description="As contas pagas ou recebidas aparecerão aqui." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.paymentDate || transaction.dueDate)}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>{transaction.contactSnapshot?.name || transaction.contactName || '-'}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell><Badge variant="secondary">Liquidada</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
