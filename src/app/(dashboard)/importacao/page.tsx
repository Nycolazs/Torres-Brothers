'use client';

import { ChangeEvent, useState } from 'react';
import { FileUp, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { parseCsv, readCsvDate, readCsvNumber } from '@/lib/csv';
import { saveContact } from '@/services/erpService';
import { createTransaction } from '@/services/transactionService';
import { ContactType, TransactionType } from '@/types';

type ImportKind = 'customers' | 'suppliers' | 'transactions';

interface ImportResult {
  imported: number;
  failed: Array<{ row: number; reason: string }>;
}

const examples: Record<ImportKind, string> = {
  customers: 'name;document;email;phone;city;state',
  suppliers: 'name;document;email;phone;city;state',
  transactions: 'type;description;amount;categoryId;bankAccountId;dueDate;status',
};

const importKindLabels: Record<ImportKind, string> = {
  customers: 'Clientes',
  suppliers: 'Fornecedores',
  transactions: 'Lançamentos',
};

export default function ImportacaoPage() {
  const { companyUid, can } = useAuth();
  const [kind, setKind] = useState<ImportKind>('customers');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const loadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setFileName(file.name);
    setRows(parseCsv(text));
    setResult(null);
  };

  const importContacts = async (type: ContactType) => {
    if (!companyUid) return;
    const failed: ImportResult['failed'] = [];
    let imported = 0;

    for (const [index, row] of rows.entries()) {
      try {
        if (!row.name) throw new Error('Coluna name é obrigatória.');
        await saveContact(companyUid, {
          type,
          name: row.name,
          tradeName: row.tradeName || '',
          document: row.document || '',
          email: row.email || '',
          phone: row.phone || '',
          mobile: row.mobile || '',
          address: {
            city: row.city || '',
            state: row.state || '',
            zipCode: row.zipCode || '',
            street: row.street || '',
            number: row.number || '',
            district: row.district || '',
            cityCode: row.cityCode || '',
          },
          blocked: false,
          notes: row.notes || '',
        });
        imported += 1;
      } catch (error) {
        failed.push({ row: index + 2, reason: error instanceof Error ? error.message : 'Erro desconhecido' });
      }
    }

    return { imported, failed };
  };

  const importTransactions = async () => {
    if (!companyUid) return;
    const failed: ImportResult['failed'] = [];
    let imported = 0;

    for (const [index, row] of rows.entries()) {
      try {
        if (!row.description) throw new Error('Coluna description é obrigatória.');
        if (!row.categoryId) throw new Error('Coluna categoryId é obrigatória.');
        if (!row.bankAccountId) throw new Error('Coluna bankAccountId é obrigatória.');

        const type = (row.type || 'expense') as TransactionType;
        await createTransaction(companyUid, {
          type,
          description: row.description,
          amount: readCsvNumber(row.amount),
          categoryId: row.categoryId,
          bankAccountId: row.bankAccountId,
          competenceDate: readCsvDate(row.competenceDate || row.dueDate),
          dueDate: readCsvDate(row.dueDate),
          status: (row.status || 'pending') as 'pending',
          isInstallment: false,
          isRecurring: false,
          notes: row.notes || '',
        });
        imported += 1;
      } catch (error) {
        failed.push({ row: index + 2, reason: error instanceof Error ? error.message : 'Erro desconhecido' });
      }
    }

    return { imported, failed };
  };

  const runImport = async () => {
    if (!can('finance:write')) {
      toast.error('Seu perfil não tem permissão para importar dados.');
      return;
    }

    if (rows.length === 0) {
      toast.error('Selecione um CSV antes de importar.');
      return;
    }

    setImporting(true);
    try {
      const nextResult =
        kind === 'customers'
          ? await importContacts('customer')
          : kind === 'suppliers'
            ? await importContacts('supplier')
            : await importTransactions();

      setResult(nextResult || { imported: 0, failed: [] });
      toast.success('Importação finalizada.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importação</h1>
        <p className="text-sm text-muted-foreground">
          Importe dados em CSV para acelerar a implantação do financeiro.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileUp className="h-4 w-4" />
              Arquivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de importação</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as ImportKind)}>
                <SelectTrigger><SelectValue>{importKindLabels[kind]}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customers">Clientes</SelectItem>
                  <SelectItem value="suppliers">Fornecedores</SelectItem>
                  <SelectItem value="transactions">Lançamentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modelo de cabeçalho</Label>
              <div className="rounded-md bg-muted p-3 font-mono text-xs">{examples[kind]}</div>
            </div>

            <div className="space-y-2">
              <Label>Selecionar CSV</Label>
              <input type="file" accept=".csv,text/csv" onChange={loadFile} className="w-full text-sm" />
              {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
            </div>

            <Button onClick={runImport} disabled={importing || rows.length === 0}>
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Importando...' : 'Importar dados'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prévia e resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <EmptyState icon={FileUp} title="Nenhum arquivo selecionado" description="A prévia aparece depois de carregar um CSV." />
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">{rows.length} linhas prontas para importação.</div>
                <div className="max-h-64 overflow-auto rounded-md border">
                  <pre className="p-3 text-xs">{JSON.stringify(rows.slice(0, 5), null, 2)}</pre>
                </div>
                {result && (
                  <div className="rounded-md border p-3 text-sm">
                    <div className="font-medium">Importados: {result.imported}</div>
                    <div className="text-muted-foreground">Falhas: {result.failed.length}</div>
                    {result.failed.length > 0 && (
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(result.failed, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
