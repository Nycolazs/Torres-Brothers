'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Landmark, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  createTransactionFromStatementItem,
  importOfxStatement,
  listBankStatementImports,
  listBankStatementItems,
  undoBankReconciliation,
  updateBankStatementItemStatus,
} from '@/services/erpService';
import { BankStatementImport, BankStatementItem, ReconciliationStatus, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusLabels: Record<ReconciliationStatus, string> = {
  pending: 'Pendente',
  matched: 'Sugerido',
  reconciled: 'Conciliado',
  ignored: 'Ignorado',
};

export default function ConciliacaoBancariaPage() {
  const { companyUid } = useAuth();
  const { accounts } = useBankAccounts();
  const [bankAccountId, setBankAccountId] = useState('');
  const [items, setItems] = useState<BankStatementItem[]>([]);
  const [imports, setImports] = useState<BankStatementImport[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!companyUid) return;
    setLoading(true);
    try {
      const [statementItems, importData, txs] = await Promise.all([
        listBankStatementItems(companyUid),
        listBankStatementImports(companyUid),
        getTransactionsByDateRange(companyUid, new Date(2020, 0, 1), new Date(2035, 11, 31)),
      ]);
      setItems(statementItems);
      setImports(importData);
      setTransactions(txs.filter((tx) => tx.status !== 'cancelled'));
      if (!bankAccountId && accounts[0]?.id) setBankAccountId(accounts[0].id);
    } catch {
      toast.error('Erro ao carregar conciliação.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyUid, accounts.length]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesAccount = bankAccountId ? item.bankAccountId === bankAccountId : true;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesAccount && matchesStatus;
    });
  }, [items, bankAccountId, statusFilter]);

  const findSuggestion = (item: BankStatementItem) => {
    const itemWords = item.description.toLowerCase().split(/\W+/).filter((word) => word.length > 3);
    return transactions.find((tx) => {
      if (tx.bankAccountId !== item.bankAccountId) return false;
      const txAmount = tx.type === 'income' ? tx.amount : -tx.amount;
      const sameAmount = Math.abs(txAmount - item.amount) < 0.01;
      const dayDiff = Math.abs(tx.dueDate.toDate().getTime() - item.date.toDate().getTime()) / 86_400_000;
      const txText = `${tx.description} ${tx.contactName || ''} ${tx.contactSnapshot?.name || ''}`.toLowerCase();
      const textScore = itemWords.filter((word) => txText.includes(word)).length;
      return sameAmount && (dayDiff <= 3 || textScore >= 2);
    });
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!companyUid || !bankAccountId) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importOfxStatement(companyUid, bankAccountId, file.name, text);
      toast.success('OFX importado para conciliação.');
      await load();
    } catch {
      toast.error('Erro ao importar OFX.');
    } finally {
      event.target.value = '';
    }
  };

  const updateStatus = async (item: BankStatementItem, status: ReconciliationStatus, transactionId?: string) => {
    if (!companyUid) return;
    try {
      await updateBankStatementItemStatus(companyUid, item.id, status, transactionId);
      await load();
    } catch {
      toast.error('Erro ao atualizar item.');
    }
  };

  const createTransaction = async (item: BankStatementItem) => {
    if (!companyUid) return;
    try {
      await createTransactionFromStatementItem(companyUid, item);
      toast.success('Lançamento criado e conciliado.');
      await load();
    } catch {
      toast.error('Erro ao criar lançamento.');
    }
  };

  const undo = async (item: BankStatementItem) => {
    if (!companyUid) return;
    try {
      await undoBankReconciliation(companyUid, item);
      toast.success('Conciliação desfeita.');
      await load();
    } catch {
      toast.error('Erro ao desfazer conciliação.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conciliação Bancária</h1>
        <p className="text-sm text-muted-foreground">Importe OFX, compare com lançamentos e marque movimentos conciliados.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-end">
          <div className="space-y-2 md:w-80">
            <Label>Conta bancária</Label>
            <Select value={bankAccountId} onValueChange={(value) => value && setBankAccountId(value)}>
              <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
              <SelectContent>
                {accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Arquivo OFX</Label>
            <Input type="file" accept=".ofx,.txt" onChange={importFile} disabled={!bankAccountId} />
          </div>
          <div className="space-y-2 md:w-48">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as ReconciliationStatus | 'all')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            CNAB fica preparado para adapter bancário futuro.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Itens importados</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableSkeleton /></div>
          ) : filteredItems.length === 0 ? (
            <EmptyState icon={Landmark} title="Nenhum extrato importado" description="Selecione uma conta e importe um arquivo OFX." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Sugestão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const suggestion = findSuggestion(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell className="max-w-[360px] truncate">{item.description}</TableCell>
                      <TableCell className={item.amount >= 0 ? 'text-right text-emerald-600 tabular-nums' : 'text-right text-red-600 tabular-nums'}>{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="max-w-[260px] truncate">{suggestion?.description || '-'}</TableCell>
                      <TableCell><Badge variant={item.status === 'reconciled' ? 'secondary' : item.status === 'ignored' ? 'outline' : 'default'}>{statusLabels[item.status]}</Badge></TableCell>
                      <TableCell className="space-x-2 text-right">
                        {suggestion && item.status !== 'reconciled' && <Button size="sm" variant="outline" onClick={() => updateStatus(item, 'reconciled', suggestion.id)}>Conciliar</Button>}
                        {item.status === 'pending' && <Button size="sm" variant="outline" onClick={() => createTransaction(item)}>Criar lançamento</Button>}
                        {item.status === 'reconciled' && <Button size="sm" variant="outline" onClick={() => undo(item)}>Desfazer</Button>}
                        {item.status !== 'ignored' && <Button size="sm" variant="ghost" onClick={() => updateStatus(item, 'ignored')}>Ignorar</Button>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de importações</CardTitle></CardHeader>
        <CardContent className="p-0">
          {imports.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Nenhum arquivo importado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Importado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.fileName}</TableCell>
                    <TableCell>{item.format.toUpperCase()}</TableCell>
                    <TableCell>{item.itemCount}</TableCell>
                    <TableCell>{formatDate(item.importedAt)}</TableCell>
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
