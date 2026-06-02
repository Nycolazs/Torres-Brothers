'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { listServices, saveService } from '@/services/erpService';
import { ServiceCatalogFormData, ServiceCatalogItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

const initialForm: ServiceCatalogFormData = {
  description: '',
  serviceListItem: '07.10',
  municipalServiceCode: '',
  taxRate: 0,
  issWithheld: false,
  defaultAmount: 0,
  isActive: true,
  notes: '',
};

export default function ServicosPage() {
  const { companyUid } = useAuth();
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [form, setForm] = useState<ServiceCatalogFormData>(initialForm);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!companyUid) return;
    setLoading(true);
    try {
      setServices(await listServices(companyUid));
    } catch {
      toast.error('Erro ao carregar serviços.');
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
    if (!companyUid) return;
    if (!form.description.trim()) {
      toast.error('Informe a descrição do serviço.');
      return;
    }
    try {
      await saveService(companyUid, form);
      toast.success('Serviço salvo com sucesso.');
      setForm(initialForm);
      await load();
    } catch {
      toast.error('Erro ao salvar serviço.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Serviços</h1>
        <p className="text-sm text-muted-foreground">Catálogo reutilizável para NFS-e, cobranças e lançamentos.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle className="text-base">{form.id ? 'Editar serviço' : 'Novo serviço'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Item lista serviço</Label>
                  <Input value={form.serviceListItem} onChange={(e) => setForm({ ...form, serviceListItem: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cód. municipal</Label>
                  <Input value={form.municipalServiceCode} onChange={(e) => setForm({ ...form, municipalServiceCode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Alíquota ISS (%)</Label>
                  <Input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Valor padrão</Label>
                  <Input type="number" value={form.defaultAmount} onChange={(e) => setForm({ ...form, defaultAmount: Number(e.target.value) })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.issWithheld} onCheckedChange={(checked) => setForm({ ...form, issWithheld: checked === true })} />
                ISS retido
              </label>
              <div className="flex gap-2">
                <Button type="submit">{form.id ? 'Salvar alterações' : 'Cadastrar'}</Button>
                {form.id && <Button type="button" variant="outline" onClick={() => setForm(initialForm)}>Novo</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4"><TableSkeleton /></div>
            ) : services.length === 0 ? (
              <EmptyState icon={BriefcaseBusiness} title="Nenhum serviço cadastrado" description="Cadastre serviços para preencher notas fiscais rapidamente." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Serviço</TableHead>
                    <TableHead>Lista</TableHead>
                    <TableHead className="text-right">ISS</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.description}</TableCell>
                      <TableCell>{service.serviceListItem}</TableCell>
                      <TableCell className="text-right tabular-nums">{service.taxRate}%</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(service.defaultAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setForm({
                          id: service.id,
                          description: service.description,
                          serviceListItem: service.serviceListItem,
                          municipalServiceCode: service.municipalServiceCode || '',
                          taxRate: service.taxRate,
                          issWithheld: service.issWithheld,
                          defaultAmount: service.defaultAmount,
                          isActive: service.isActive,
                          notes: service.notes || '',
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
