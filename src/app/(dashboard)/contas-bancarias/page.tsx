'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Landmark, ArrowRightLeft } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  transferBetweenAccounts,
} from '@/services/accountService';
import { bankAccountSchema } from '@/lib/validations';
import { BankAccount, BankAccountType } from '@/types';
import { BANK_ACCOUNT_TYPE_LABELS } from '@/constants';
import { cn, formatCurrency } from '@/lib/utils';

type FormData = z.infer<typeof bankAccountSchema>;

export default function ContasBancariasPage() {
  const { companyUid } = useAuth();
  const { accounts, loading, refresh } = useBankAccounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Transfer state
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferring, setTransferring] = useState(false);
  const selectedTransferFrom = accounts.find((a) => a.id === transferFrom);
  const selectedTransferTo = accounts.find((a) => a.id === transferTo);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { name: '', type: 'checking', initialBalance: 0, color: '#3b82f6' },
  });

  const openNew = () => {
    setEditingAccount(null);
    reset({ name: '', type: 'checking', initialBalance: 0, color: '#3b82f6' });
    setModalOpen(true);
  };

  const openEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    reset({
      name: acc.name,
      type: acc.type,
      bankName: acc.bankName || '',
      agency: acc.agency || '',
      accountNumber: acc.accountNumber || '',
      initialBalance: acc.initialBalance,
      color: acc.color,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!companyUid) return;
    try {
      if (editingAccount) {
        await updateBankAccount(companyUid, editingAccount.id, data);
        toast.success('Conta atualizada!');
      } else {
        await createBankAccount(companyUid, data);
        toast.success('Conta criada!');
      }
      setModalOpen(false);
      refresh();
    } catch {
      toast.error('Erro ao salvar conta.');
    }
  };

  const handleDelete = async () => {
    if (!companyUid || !deleteId) return;
    try {
      await deleteBankAccount(companyUid, deleteId);
      toast.success('Conta excluída!');
      setDeleteId(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir conta.');
    }
  };

  const handleTransfer = async () => {
    if (!companyUid || !transferFrom || !transferTo || !transferAmount) return;
    if (transferFrom === transferTo) {
      toast.error('Selecione contas diferentes.');
      return;
    }
    setTransferring(true);
    try {
      await transferBetweenAccounts(
        companyUid,
        transferFrom,
        transferTo,
        parseFloat(transferAmount),
        transferDesc || 'Transferência entre contas',
        new Date()
      );
      toast.success('Transferência realizada!');
      setTransferOpen(false);
      setTransferFrom('');
      setTransferTo('');
      setTransferAmount('');
      setTransferDesc('');
      refresh();
    } catch {
      toast.error('Erro na transferência.');
    } finally {
      setTransferring(false);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contas Bancárias</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas contas e saldos</p>
        </div>
        <div className="flex gap-2">
          {accounts.length >= 2 && (
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transferir
            </Button>
          )}
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Total Balance */}
      {!loading && accounts.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Saldo Total</span>
              <span className={cn('text-2xl font-bold', totalBalance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {formatCurrency(totalBalance)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Cards */}
      {loading ? (
        <TableSkeleton />
      ) : accounts.length === 0 ? (
        <EmptyState icon={Landmark} title="Sem contas" description="Cadastre sua primeira conta bancária." actionLabel="Criar Conta" onAction={openNew} />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <Card key={acc.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: acc.color }} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{acc.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(acc)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(acc.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tipo</span>
                    <span>{BANK_ACCOUNT_TYPE_LABELS[acc.type]}</span>
                  </div>
                  {acc.bankName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Banco</span>
                      <span>{acc.bankName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Saldo Atual</span>
                    <span className={cn('text-lg font-bold', acc.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {formatCurrency(acc.currentBalance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Account Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Conta *</Label>
              <Input {...register('name')} placeholder="Ex: Conta Corrente Bradesco" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue>{BANK_ACCOUNT_TYPE_LABELS[field.value as BankAccountType]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BANK_ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input {...register('bankName')} placeholder="Bradesco" />
              </div>
              <div className="space-y-2">
                <Label>Agência</Label>
                <Input {...register('agency')} placeholder="1234" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número da Conta</Label>
                <Input {...register('accountNumber')} placeholder="12345-6" />
              </div>
              <div className="space-y-2">
                <Label>Saldo Inicial</Label>
                <Input type="number" step="0.01" {...register('initialBalance', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <Input type="color" {...register('color')} className="w-12 h-10 p-1 cursor-pointer" />
                <Input {...register('color')} className="flex-1" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingAccount ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferência entre Contas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Conta de Origem</Label>
              <Select value={transferFrom} onValueChange={(v) => setTransferFrom(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar">{selectedTransferFrom?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta de Destino</Label>
              <Select value={transferTo} onValueChange={(v) => setTransferTo(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar">{selectedTransferTo?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.id !== transferFrom).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="Motivo da transferência" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancelar</Button>
              <Button onClick={handleTransfer} disabled={transferring}>
                {transferring ? 'Transferindo...' : 'Transferir'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Conta" description="Contas com lançamentos vinculados não podem ser excluídas." confirmLabel="Excluir" variant="destructive" onConfirm={handleDelete} />
    </div>
  );
}
