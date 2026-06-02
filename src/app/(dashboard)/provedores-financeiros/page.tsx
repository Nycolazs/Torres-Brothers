'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PlugZap } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { listProviderSettings, saveProviderSetting } from '@/services/erpService';
import { ProviderKind, ProviderSetting, ProviderSettingFormData, ProviderStatus } from '@/types';

const initialForm: ProviderSettingFormData = {
  kind: 'mock',
  status: 'sandbox',
  displayName: 'Mock interno',
  notes: '',
};

const statusLabels: Record<ProviderStatus, string> = {
  disabled: 'Desativado',
  sandbox: 'Homologação',
  production: 'Produção',
};

const kindLabels: Record<ProviderKind, string> = {
  manual: 'Manual',
  mock: 'Mock',
  pixProvider: 'PIX',
  boletoProvider: 'Boleto',
  tefProvider: 'TEF',
};

export default function ProvedoresFinanceirosPage() {
  const { companyUid, user, isAdmin } = useAuth();
  const [settings, setSettings] = useState<ProviderSetting[] | null>(null);
  const [form, setForm] = useState<ProviderSettingFormData>(initialForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!companyUid || !isAdmin) {
      return;
    }
    try {
      setSettings(await listProviderSettings(companyUid));
    } catch {
      toast.error('Erro ao carregar provedores.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyUid, isAdmin]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!companyUid || !isAdmin) return;
    setSaving(true);
    try {
      await saveProviderSetting(companyUid, form, user?.uid);
      toast.success('Configuração salva.');
      setForm(initialForm);
      await load();
    } catch {
      toast.error('Erro ao salvar configuração.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return <EmptyState icon={PlugZap} title="Acesso restrito" description="Somente administradores configuram provedores financeiros." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Provedores Financeiros</h1>
        <p className="text-sm text-muted-foreground">Prepare PIX, boleto, TEF e bancos sem gravar credenciais sensíveis no cliente.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle className="text-base">{form.id ? 'Editar provedor' : 'Novo provedor'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.kind} onValueChange={(value) => value && setForm({ ...form, kind: value as ProviderKind })}>
                  <SelectTrigger><SelectValue>{kindLabels[form.kind]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="mock">Mock</SelectItem>
                    <SelectItem value="pixProvider">PIX</SelectItem>
                    <SelectItem value="boletoProvider">Boleto</SelectItem>
                    <SelectItem value="tefProvider">TEF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => value && setForm({ ...form, status: value as ProviderStatus })}>
                  <SelectTrigger><SelectValue>{statusLabels[form.status]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome de exibição</Label>
                <Input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                {form.id && <Button type="button" variant="outline" disabled={saving} onClick={() => setForm(initialForm)}>Novo</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {settings === null ? (
              <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
            ) : settings.length === 0 ? (
              <EmptyState icon={PlugZap} title="Nenhum provedor" description="Configure pelo menos mock/manual para documentar o ambiente financeiro." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-medium">{setting.displayName}</TableCell>
                      <TableCell>{setting.kind}</TableCell>
                      <TableCell><Badge variant={setting.status === 'production' ? 'default' : 'secondary'}>{statusLabels[setting.status]}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setForm({
                          id: setting.id,
                          kind: setting.kind,
                          status: setting.status,
                          displayName: setting.displayName,
                          notes: setting.notes || '',
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
