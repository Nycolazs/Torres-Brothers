'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit, Link2, ReceiptText, Search, Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { buildContactSnapshot, deleteCharge, listCharges, listContacts, saveCharge, updateChargeStatus } from '@/services/erpService';
import { Charge, ChargeFormData, ChargeMethod, ChargeStatus, Contact, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusLabels: Record<ChargeStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  paid: 'Paga',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
};

const methodLabels: Record<ChargeMethod, string> = {
  manual: 'Manual',
  pix: 'PIX',
  boleto: 'Boleto',
  card: 'Cartão',
  tef: 'TEF',
};

const initialForm: ChargeFormData = {
  contactId: '',
  description: '',
  amount: 0,
  dueDate: new Date(),
  method: 'manual',
  status: 'draft',
  provider: 'mock',
  notes: '',
};

export default function CobrancasPage() {
  const { companyUid } = useAuth();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [receivables, setReceivables] = useState<Transaction[]>([]);
  const [form, setForm] = useState<ChargeFormData>(initialForm);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChargeStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Charge | null>(null);

  async function load() {
    if (!companyUid) return;
    setLoading(true);
    try {
      const [chargesData, contactsData, transactionData] = await Promise.all([
        listCharges(companyUid),
        listContacts(companyUid, 'customer'),
        getTransactionsByDateRange(companyUid, new Date(2020, 0, 1), new Date(2035, 11, 31)),
      ]);
      setCharges(chargesData);
      setContacts(contactsData);
      setReceivables(
        transactionData.filter((transaction) => transaction.type === 'income' && transaction.status !== 'paid' && transaction.status !== 'cancelled')
      );
    } catch {
      toast.error('Erro ao carregar cobranças.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyUid]);

  const totals = useMemo(() => {
    return charges.reduce(
      (acc, charge) => {
        acc.total += charge.amount;
        acc[charge.status] += charge.amount;
        return acc;
      },
      { total: 0, draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 } as Record<ChargeStatus, number> & { total: number }
    );
  }, [charges]);

  const filteredCharges = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return charges.filter((charge) => {
      const matchesStatus = statusFilter === 'all' || charge.status === statusFilter;
      const matchesText =
        !needle ||
        charge.description.toLowerCase().includes(needle) ||
        charge.contactSnapshot?.name?.toLowerCase().includes(needle);
      return matchesStatus && matchesText;
    });
  }, [charges, query, statusFilter]);

  const selectedReceivableLabel = useMemo(() => {
    if (!form.transactionId) return 'Cobrança avulsa';
    const receivable = receivables.find((item) => item.id === form.transactionId);
    return receivable
      ? `${receivable.description} - ${formatCurrency(receivable.remainingAmount ?? receivable.amount)}`
      : 'Cobrança avulsa';
  }, [form.transactionId, receivables]);

  const selectedContactLabel = useMemo(() => {
    if (!form.contactId) return 'Sem cliente';
    return contacts.find((contact) => contact.id === form.contactId)?.name || 'Sem cliente';
  }, [contacts, form.contactId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!companyUid) return;
    if (!form.description.trim() || form.amount <= 0) {
      toast.error('Informe descrição e valor da cobrança.');
      return;
    }
    const contact = contacts.find((item) => item.id === form.contactId);
    if (contact?.blocked) {
      toast.error('Cliente bloqueado. Não é possível emitir cobrança.');
      return;
    }
    setSaving(true);
    try {
      await saveCharge(companyUid, {
        ...form,
        contactSnapshot: contact ? buildContactSnapshot(contact) : undefined,
      });
      toast.success('Cobrança salva.');
      setForm(initialForm);
      await load();
    } catch {
      toast.error('Erro ao salvar cobrança.');
    } finally {
      setSaving(false);
    }
  };

  const editCharge = (charge: Charge) => {
    setForm({
      id: charge.id,
      transactionId: charge.transactionId,
      contactId: charge.contactId,
      contactSnapshot: charge.contactSnapshot,
      description: charge.description,
      amount: charge.amount,
      dueDate: charge.dueDate.toDate(),
      method: charge.method,
      status: charge.status,
      provider: charge.provider,
      notes: charge.notes || '',
    });
  };

  const confirmDelete = async () => {
    if (!companyUid || !deleteTarget) return;
    try {
      await deleteCharge(companyUid, deleteTarget);
      toast.success('Cobrança excluída.');
      setDeleteTarget(null);
      if (form.id === deleteTarget.id) setForm(initialForm);
      await load();
    } catch {
      toast.error('Erro ao excluir cobrança.');
    }
  };

  const handleReceivableChange = (id: string | null) => {
    if (!id || id === 'none') {
      setForm({ ...form, transactionId: undefined });
      return;
    }
    const receivable = receivables.find((item) => item.id === id);
    if (!receivable) return;
    const contact = receivable.contactId ? contacts.find((item) => item.id === receivable.contactId) : undefined;

    setForm({
      ...form,
      transactionId: receivable.id,
      contactId: receivable.contactId,
      contactSnapshot: receivable.contactSnapshot || (contact ? buildContactSnapshot(contact) : undefined),
      description: receivable.description,
      amount: receivable.remainingAmount ?? receivable.amount,
      dueDate: receivable.dueDate.toDate(),
      status: 'sent',
    });
  };

  const setStatus = async (charge: Charge, status: ChargeStatus) => {
    if (!companyUid) return;
    try {
      await updateChargeStatus(companyUid, charge.id, status);
      await load();
    } catch {
      toast.error('Erro ao atualizar cobrança.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cobranças</h1>
        <p className="text-sm text-muted-foreground">Cobranças manuais ou mock, preparadas para PIX, boleto e TEF via provedores.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar cobrança ou cliente" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as ChargeStatus | 'all')}>
            <SelectTrigger className="md:w-48">
              <SelectValue>{statusFilter === 'all' ? 'Todos os status' : statusLabels[statusFilter]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Emitidas</div><div className="text-2xl font-bold">{formatCurrency(totals.total)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">A receber</div><div className="text-2xl font-bold">{formatCurrency(totals.sent + totals.draft + totals.overdue)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Pagas</div><div className="text-2xl font-bold">{formatCurrency(totals.paid)}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle className="text-base">{form.id ? 'Editar cobrança' : 'Nova cobrança'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Conta a receber vinculada</Label>
                <Select value={form.transactionId || 'none'} onValueChange={handleReceivableChange}>
                  <SelectTrigger><SelectValue>{selectedReceivableLabel}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Cobrança avulsa</SelectItem>
                    {receivables.map((receivable) => (
                      <SelectItem key={receivable.id} value={receivable.id}>
                        {receivable.description} - {formatCurrency(receivable.remainingAmount ?? receivable.amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={form.contactId || 'none'}
                  onValueChange={(value) => setForm({ ...form, contactId: !value || value === 'none' ? undefined : value })}
                >
                  <SelectTrigger><SelectValue>{selectedContactLabel}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cliente</SelectItem>
                    {contacts.map((contact) => <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input type="date" value={form.dueDate.toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, dueDate: new Date(`${e.target.value}T00:00:00`) })} />
                </div>
                <div className="space-y-2">
                  <Label>Método</Label>
                  <Select value={form.method} onValueChange={(value) => value && setForm({ ...form, method: value as ChargeMethod })}>
                    <SelectTrigger><SelectValue>{methodLabels[form.method]}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {Object.entries(methodLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value) => value && setForm({ ...form, status: value as ChargeStatus })}>
                    <SelectTrigger><SelectValue>{statusLabels[form.status]}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar cobrança'}</Button>
                {form.id && (
                  <Button type="button" variant="outline" disabled={saving} onClick={() => setForm(initialForm)}>
                    Nova
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4"><TableSkeleton /></div>
            ) : filteredCharges.length === 0 ? (
              <EmptyState icon={ReceiptText} title="Nenhuma cobrança" description="Crie cobranças para acompanhar envio, vencimento e pagamento." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-44 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>
                        <div className="font-medium">{charge.description}</div>
                        {charge.paymentLink && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Link2 className="h-3 w-3" /> link mock gerado</div>}
                      </TableCell>
                      <TableCell>{charge.contactSnapshot?.name || '-'}</TableCell>
                      <TableCell>{formatDate(charge.dueDate)}</TableCell>
                      <TableCell>{methodLabels[charge.method]}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(charge.amount)}</TableCell>
                      <TableCell><Badge variant={charge.status === 'paid' ? 'secondary' : charge.status === 'overdue' ? 'destructive' : 'outline'}>{statusLabels[charge.status]}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => editCharge(charge)}>
                            <Edit className="mr-1 h-3.5 w-3.5" />
                            Editar
                          </Button>
                          {charge.status !== 'paid' && <Button size="sm" variant="outline" onClick={() => setStatus(charge, 'paid')}>Baixar</Button>}
                          <Button size="sm" variant="outline" onClick={() => setDeleteTarget(charge)}>
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir cobrança"
        description="Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
