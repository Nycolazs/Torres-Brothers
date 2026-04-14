'use client';

import { useState, useMemo } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { useDRE } from '@/hooks/useDRE';
import { DRELineItem } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function DRERow({
  item,
  isTotal = false,
  isSubItem = false,
  isNegative = false,
}: {
  item: DRELineItem;
  isTotal?: boolean;
  isSubItem?: boolean;
  isNegative?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 px-4',
        isTotal && 'bg-muted/50 font-bold',
        isSubItem && 'pl-10'
      )}
    >
      <span className={cn('text-sm', isTotal && 'font-semibold', isSubItem && 'text-muted-foreground')}>
        {item.label}
      </span>
      <div className="flex items-center gap-4">
        <span
          className={cn(
            'text-sm font-mono tabular-nums',
            isTotal && 'font-bold',
            item.value > 0 && !isNegative && 'text-emerald-600 dark:text-emerald-400',
            (item.value < 0 || isNegative) && 'text-red-600 dark:text-red-400'
          )}
        >
          {isNegative && item.value > 0
            ? `(${formatCurrency(item.value)})`
            : formatCurrency(Math.abs(item.value))}
        </span>
        {item.percentage !== undefined && (
          <span className="text-xs text-muted-foreground w-14 text-right">
            {item.percentage.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function DREPage() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const monthDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const period = useMemo(
    () => ({
      startDate: startOfMonth(monthDate),
      endDate: endOfMonth(monthDate),
    }),
    [monthDate]
  );

  const { report, loading } = useDRE(period.startDate, period.endDate);

  // Month options (last 24 months)
  const monthOptions = useMemo(() => {
    const now = new Date();
    const options = [];
    for (let i = 0; i < 24; i++) {
      const date = subMonths(now, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return options;
  }, []);

  const selectedMonthLabel =
    monthOptions.find((opt) => opt.value === selectedMonth)?.label ?? selectedMonth;

  const exportRows = useMemo(() => {
    if (!report) return [] as Array<{ item: string; valor: number; percentual?: number }>;

    return [
      {
        item: report.receitaBrutaDeVendas.label,
        valor: report.receitaBrutaDeVendas.value,
        percentual: report.receitaBrutaDeVendas.percentage,
      },
      {
        item: report.deducoesDeVendas.label,
        valor: -Math.abs(report.deducoesDeVendas.value),
        percentual: report.deducoesDeVendas.percentage,
      },
      {
        item: report.receitaLiquida.label,
        valor: report.receitaLiquida.value,
        percentual: report.receitaLiquida.percentage,
      },
      {
        item: report.custoMercadoriasVendidas.label,
        valor: -Math.abs(report.custoMercadoriasVendidas.value),
        percentual: report.custoMercadoriasVendidas.percentage,
      },
      {
        item: report.lucroBruto.label,
        valor: report.lucroBruto.value,
        percentual: report.lucroBruto.percentage,
      },
      {
        item: report.despesasOperacionais.label,
        valor: -Math.abs(report.despesasOperacionais.value),
        percentual: report.despesasOperacionais.percentage,
      },
      ...(report.despesasOperacionais.children?.map((child) => ({
        item: `  • ${child.label}`,
        valor: -Math.abs(child.value),
        percentual: child.percentage,
      })) ?? []),
      {
        item: report.resultadoOperacional.label,
        valor: report.resultadoOperacional.value,
        percentual: report.resultadoOperacional.percentage,
      },
      {
        item: report.despesasFinanceiras.label,
        valor: -Math.abs(report.despesasFinanceiras.value),
        percentual: report.despesasFinanceiras.percentage,
      },
      {
        item: report.resultadoAntesImpostos.label,
        valor: report.resultadoAntesImpostos.value,
        percentual: report.resultadoAntesImpostos.percentage,
      },
      {
        item: report.impostos.label,
        valor: -Math.abs(report.impostos.value),
        percentual: report.impostos.percentage,
      },
      {
        item: report.lucroLiquido.label,
        valor: report.lucroLiquido.value,
        percentual: report.lucroLiquido.percentage,
      },
    ];
  }, [report]);

  const handleExportPDF = () => {
    if (!report || exportRows.length === 0) {
      toast.error('Sem dados para exportar.');
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const periodLabel = format(period.startDate, "MMMM 'de' yyyy", { locale: ptBR });
      const filename = `dre-${selectedMonth}.pdf`;

      doc.setFontSize(14);
      doc.text('DRE — Demonstrativo de Resultado do Exercício', 14, 15);
      doc.setFontSize(10);
      doc.text(`Período: ${periodLabel}`, 14, 21);
      doc.text(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 26);

      autoTable(doc, {
        head: [['Item', 'Valor (R$)', '% Receita']],
        body: exportRows.map((row) => [
          row.item,
          formatCurrency(row.valor),
          row.percentual !== undefined ? `${row.percentual.toFixed(1)}%` : '-',
        ]),
        startY: 30,
        styles: {
          fontSize: 9,
          cellPadding: 2.5,
        },
        headStyles: {
          fillColor: [27, 67, 50],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [245, 248, 246],
        },
        columnStyles: {
          0: { cellWidth: 110 },
          1: { halign: 'right' },
          2: { halign: 'right' },
        },
      });

      doc.save(filename);
      toast.success('PDF exportado com sucesso.');
    } catch {
      toast.error('Erro ao exportar PDF do DRE.');
    }
  };

  const handleExportExcel = () => {
    if (!report || exportRows.length === 0) {
      toast.error('Sem dados para exportar.');
      return;
    }

    try {
      const periodLabel = format(period.startDate, "MMMM 'de' yyyy", { locale: ptBR });
      const filename = `dre-${selectedMonth}.xlsx`;

      const wsData = [
        ['DRE — Demonstrativo de Resultado do Exercício'],
        [`Período: ${periodLabel}`],
        [`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
        [],
        ['Item', 'Valor (R$)', '% Receita'],
        ...exportRows.map((row) => [
          row.item,
          row.valor,
          row.percentual !== undefined ? Number(row.percentual.toFixed(2)) : null,
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 52 }, { wch: 18 }, { wch: 12 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'DRE');
      XLSX.writeFile(wb, filename);
      toast.success('Excel exportado com sucesso.');
    } catch {
      toast.error('Erro ao exportar Excel do DRE.');
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">DRE — Demonstrativo de Resultado</h1>
          <p className="text-sm text-muted-foreground">
            Análise de resultado do exercício por competência
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={(v) => v && setSelectedMonth(v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue>
                <span className="capitalize">{selectedMonthLabel}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="capitalize">{opt.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleExportPDF} aria-label="Exportar PDF">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportExcel} aria-label="Exportar Excel">
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground">
            Dica rápida: escolha o mês, leia as linhas em sequência (Receita → Custos → Despesas → Lucro)
            e use os botões de exportação para compartilhar o relatório.
          </p>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader className="text-center border-b">
            <CardTitle>DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO</CardTitle>
            <p className="text-sm text-muted-foreground capitalize">
              Período: {format(period.startDate, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {/* Revenue */}
            <DRERow item={report.receitaBrutaDeVendas} />
            <DRERow item={report.deducoesDeVendas} isNegative />
            <DRERow item={report.receitaLiquida} isTotal />

            <Separator />

            {/* COGS */}
            <DRERow item={report.custoMercadoriasVendidas} isNegative />
            <DRERow item={report.lucroBruto} isTotal />
            <div className="px-4 py-1">
              <span className="text-xs text-muted-foreground">
                Margem Bruta: {report.lucroBruto.percentage?.toFixed(1) || '0'}%
              </span>
            </div>

            <Separator />

            {/* Operating Expenses */}
            <DRERow item={report.despesasOperacionais} isNegative />
            {report.despesasOperacionais.children?.map((child, i) => (
              <DRERow key={i} item={child} isSubItem isNegative />
            ))}
            <DRERow item={report.resultadoOperacional} isTotal />
            <div className="px-4 py-1">
              <span className="text-xs text-muted-foreground">
                Margem Operacional: {report.resultadoOperacional.percentage?.toFixed(1) || '0'}%
              </span>
            </div>

            <Separator />

            {/* Financial */}
            <DRERow item={report.despesasFinanceiras} isNegative />
            <DRERow item={report.resultadoAntesImpostos} isTotal />

            <Separator />

            {/* Taxes & Net */}
            <DRERow item={report.impostos} isNegative />
            <div className="bg-primary/5 border-t-2 border-primary">
              <DRERow item={report.lucroLiquido} isTotal />
              <div className="px-4 pb-3">
                <span className="text-xs font-medium">
                  Margem Líquida: {report.lucroLiquido.percentage?.toFixed(1) || '0'}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!report && !loading && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível montar o DRE para este período. Verifique se há lançamentos com
              data de competência no mês selecionado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

