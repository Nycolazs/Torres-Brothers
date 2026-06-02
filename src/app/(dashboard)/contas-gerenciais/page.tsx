'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FolderTree } from 'lucide-react';
import { toast } from 'sonner';
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
import { listFinancialAccounts, saveFinancialAccount } from '@/services/erpService';
import { DREClassification, FinancialAccount, FinancialAccountFormData, TransactionType } from '@/types';
import { TRANSACTION_TYPE_LABELS } from '@/constants';

const dreLabels: Record<DREClassification, string> = {
  gross_revenue: 'Receita bruta',
  sales_deduction: 'Deduções de venda',
  cogs: 'CMV / Custos',
  administrative_expense: 'Despesa administrativa',
  sales_expense: 'Despesa comercial',
  financial_expense: 'Despesa financeira',
  tax: 'Impostos',
  other_revenue: 'Outras receitas',
  none: 'Não entra no DRE',
};

const initialForm: FinancialAccountFormData = {
  name: '',
  type: 'expense',
  dreClassification: 'administrative_expense',
  isActive: true,
};

export default function ContasGerenciaisPage() {
  const { companyUid } = useAuth();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [form, setForm] = useState<FinancialAccountFormData>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!companyUid) return;
    setLoading(true);
    try {
      setAccounts(await listFinancialAccounts(companyUid));
    } catch {
      toast.error('Erro ao carregar contas gerenciais.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyUid]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!companyUid) return;
    if (!form.name.trim()) {
      toast.error('Informe o nome da conta gerencial.');
      return;
    }
    setSaving(true);
    try {
      await saveFinancialAccount(companyUid, form);
      toast.success('Conta gerencial salva.');
      setForm(initialForm);
      await load();
    } catch {
      toast.error('Erro ao salvar conta gerencial.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contas Gerenciais</h1>
        <p className="text-sm text-muted-foreground">Classifique lançamentos para fluxo de caixa, orçamento e DRE.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle className="text-base">{form.id ? 'Editar conta' : 'Nova conta'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(value) => value && setForm({ ...form, type: value as TransactionType })}>
                  <SelectTrigger><SelectValue>{TRANSACTION_TYPE_LABELS[form.type]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="cost">Custo</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classificação DRE</Label>
                <Select value={form.dreClassification} onValueChange={(value) => value && setForm({ ...form, dreClassification: value as DREClassification })}>
                  <SelectTrigger><SelectValue>{dreLabels[form.dreClassification]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(dreLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar'}</Button>
                {form.id && <Button type="button" variant="outline" disabled={saving} onClick={() => setForm(initialForm)}>Novo</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4"><TableSkeleton /></div>
            ) : accounts.length === 0 ? (
              <EmptyState icon={FolderTree} title="Nenhuma conta gerencial" description="Cadastre contas para profissionalizar DRE e relatórios." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>DRE</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{TRANSACTION_TYPE_LABELS[account.type]}</TableCell>
                      <TableCell>{dreLabels[account.dreClassification]}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setForm({
                          id: account.id,
                          name: account.name,
                          type: account.type,
                          dreClassification: account.dreClassification,
                          parentId: account.parentId,
                          isActive: account.isActive,
                        })}>Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
