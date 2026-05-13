'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FileCheck2, FileClock, FileText, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { KpiCard } from '@/components/dashboard/KpiCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useFiscalInvoices } from '@/hooks/useFiscalInvoices';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { FiscalInvoiceFormData, FiscalInvoiceStatus, Transaction } from '@/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const initialForm: FiscalInvoiceFormData = {
  customer: {
    name: '',
    document: '',
    email: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      district: '',
      cityCode: '',
      city: '',
      state: '',
      zipCode: '',
    },
  },
  service: {
    description: 'Serviços de limpeza e conservação',
    serviceListItem: '07.10',
    municipalServiceCode: '',
    taxRate: 0,
    issWithheld: false,
    amount: 0,
    deductions: 0,
  },
};

const statusLabel: Record<FiscalInvoiceStatus, string> = {
  draft: 'Rascunho',
  processing: 'Processando',
  authorized: 'Autorizada',
  rejected: 'Rejeitada',
  cancelled: 'Cancelada',
  simulation: 'Simulada',
};

function statusClass(status: FiscalInvoiceStatus) {
  return cn(
    status === 'authorized' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    status === 'processing' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    status === 'rejected' && 'bg-destructive/15 text-destructive',
    status === 'simulation' && 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
  );
}

export default function NotasFiscaisPage() {
  const { companyUid } = useAuth();
  const { invoices, loading, issuing, issueInvoice, consultInvoice } = useFiscalInvoices();
  const [receivables, setReceivables] = useState<Transaction[]>([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState('manual');
  const [form, setForm] = useState<FiscalInvoiceFormData>(initialForm);

  useEffect(() => {
    if (!companyUid) return;

    getTransactionsByDateRange(companyUid, new Date(2020, 0, 1), new Date(2030, 11, 31))
      .then((data) =>
        setReceivables(
          data.filter((item) => item.type === 'income' && item.status !== 'cancelled')
        )
      )
      .catch(() => toast.error('Erro ao carregar recebíveis para nota fiscal.'));
  }, [companyUid]);

  const totals = useMemo(() => {
    return invoices.reduce(
      (acc, invoice) => {
        acc.amount += invoice.service.amount || 0;
        acc[invoice.status] += 1;
        return acc;
      },
      {
        amount: 0,
        authorized: 0,
        processing: 0,
        rejected: 0,
        draft: 0,
        cancelled: 0,
        simulation: 0,
      } as Record<FiscalInvoiceStatus, number> & { amount: number }
    );
  }, [invoices]);

  const patchCustomer = (path: string, value: string) => {
    setForm((current) => ({
      ...current,
      customer: {
        ...current.customer,
        [path]: value,
      },
    }));
  };

  const patchAddress = (path: string, value: string) => {
    setForm((current) => ({
      ...current,
      customer: {
        ...current.customer,
        address: {
          ...current.customer.address,
          [path]: value,
        },
      },
    }));
  };

  const patchService = (path: string, value: string | number | boolean) => {
    setForm((current) => ({
      ...current,
      service: {
        ...current.service,
        [path]: value,
      },
    }));
  };

  const handleTransactionChange = (id: string | null) => {
    if (!id) return;
    setSelectedTransactionId(id);
    const transaction = receivables.find((item) => item.id === id);
    if (!transaction) {
      setForm((current) => ({ ...current, transactionId: undefined }));
      return;
    }

    setForm((current) => ({
      ...current,
      transactionId: transaction.id,
      customer: {
        ...current.customer,
        name: transaction.contactName || current.customer.name,
      },
      service: {
        ...current.service,
        description: transaction.description,
        amount: transaction.amount,
      },
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.customer.name.trim() || !form.customer.document.trim()) {
      toast.error('Informe os dados do tomador.');
      return;
    }
    if (!form.service.description.trim() || form.service.amount <= 0) {
      toast.error('Informe os dados do serviço.');
      return;
    }
    await issueInvoice(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground">
            Gere NFS-e de serviços e acompanhe autorização, PDF e XML fiscal.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Certificado digital A1
          </div>
          <p className="mt-1 max-w-xl">
            Use o arquivo .pfx apenas no ambiente seguro do provedor fiscal ou em secrets do servidor.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Notas emitidas" value={invoices.length} icon={FileText} variant="default" suffix=" " />
        <KpiCard title="Autorizadas" value={totals.authorized} icon={FileCheck2} variant="success" suffix=" " />
        <KpiCard title="Em processamento" value={totals.processing} icon={FileClock} variant="warning" suffix=" " />
        <KpiCard title="Valor fiscal" value={totals.amount} icon={FileText} variant="default" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(520px,1.15fr)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nova NFS-e</CardTitle>
              <CardDescription>Preencha tomador, endereço e serviço antes de enviar ao provedor fiscal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Recebível vinculado</Label>
                <Select value={selectedTransactionId} onValueChange={handleTransactionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lançamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Preenchimento manual</SelectItem>
                    {receivables.map((transaction) => (
                      <SelectItem key={transaction.id} value={transaction.id}>
                        {transaction.description} - {formatCurrency(transaction.amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tomador</Label>
                  <Input value={form.customer.name} onChange={(e) => patchCustomer('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input value={form.customer.document} onChange={(e) => patchCustomer('document', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.customer.email} onChange={(e) => patchCustomer('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.customer.phone} onChange={(e) => patchCustomer('phone', e.target.value)} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-6">
                <div className="space-y-2 sm:col-span-4">
                  <Label>Logradouro</Label>
                  <Input value={form.customer.address.street} onChange={(e) => patchAddress('street', e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Número</Label>
                  <Input value={form.customer.address.number} onChange={(e) => patchAddress('number', e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-3">
                  <Label>Bairro</Label>
                  <Input value={form.customer.address.district} onChange={(e) => patchAddress('district', e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-3">
                  <Label>Complemento</Label>
                  <Input value={form.customer.address.complement} onChange={(e) => patchAddress('complement', e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Código IBGE</Label>
                  <Input value={form.customer.address.cityCode} onChange={(e) => patchAddress('cityCode', e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Cidade</Label>
                  <Input value={form.customer.address.city} onChange={(e) => patchAddress('city', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input maxLength={2} value={form.customer.address.state} onChange={(e) => patchAddress('state', e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={form.customer.address.zipCode} onChange={(e) => patchAddress('zipCode', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Serviço e tributação</CardTitle>
              <CardDescription>Confirme os códigos fiscais com a contabilidade antes da primeira emissão real.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Discriminação do serviço</Label>
                <Textarea
                  rows={4}
                  value={form.service.description}
                  onChange={(e) => patchService('description', e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>Item LC 116</Label>
                  <Input value={form.service.serviceListItem} onChange={(e) => patchService('serviceListItem', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cód. municipal</Label>
                  <Input value={form.service.municipalServiceCode} onChange={(e) => patchService('municipalServiceCode', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Alíquota ISS %</Label>
                  <Input type="number" step="0.01" value={form.service.taxRate} onChange={(e) => patchService('taxRate', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" value={form.service.amount} onChange={(e) => patchService('amount', Number(e.target.value))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.service.issWithheld}
                  onCheckedChange={(checked) => patchService('issWithheld', checked === true)}
                />
                ISS retido pelo tomador
              </label>
              <Button type="submit" disabled={issuing} className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                {issuing ? 'Enviando...' : 'Emitir NFS-e'}
              </Button>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Histórico fiscal</CardTitle>
            <CardDescription>Últimas 50 notas geradas pelo sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-10 rounded-lg bg-muted animate-pulse" />
                <div className="h-10 rounded-lg bg-muted animate-pulse" />
                <div className="h-10 rounded-lg bg-muted animate-pulse" />
              </div>
            ) : invoices.length === 0 ? (
              <EmptyState icon={FileText} title="Nenhuma nota gerada" description="As NFS-e emitidas aparecerão aqui." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Tomador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs">{invoice.reference}</TableCell>
                      <TableCell>
                        <div className="max-w-[180px] truncate font-medium">{invoice.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{invoice.invoiceNumber || 'Sem número'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusClass(invoice.status)}>
                          {statusLabel[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.service.amount)}</TableCell>
                      <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => consultInvoice(invoice)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {invoice.pdfUrl && (
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={buttonVariants({ variant: 'outline', size: 'sm' })}
                            >
                              PDF
                            </a>
                          )}
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
    </div>
  );
}
