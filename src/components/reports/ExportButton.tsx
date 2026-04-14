'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: { header: string; key: string }[];
  filename: string;
  title: string;
}

export function ExportButton({ data, columns, filename, title }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = () => {
    setExporting(true);
    try {
      const wsData = data.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col) => {
          obj[col.header] = row[col.key];
        });
        return obj;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(wsData);

      // Auto-fit column widths
      const colWidths = columns.map((col) => ({
        wch: Math.max(
          col.header.length,
          ...data.map((row) => String(row[col.key] || '').length)
        ),
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, title);
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success('Arquivo Excel exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar Excel.');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4');

      doc.setFontSize(16);
      doc.text(title, 14, 15);
      doc.setFontSize(10);
      doc.text(`Torres Brothers — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

      const headers = columns.map((col) => col.header);
      const rows = data.map((row) => columns.map((col) => String(row[col.key] ?? '')));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [27, 67, 50], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`${filename}.pdf`);
      toast.success('Arquivo PDF exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar PDF.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={exporting || data.length === 0}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
      >
        <Download className="h-4 w-4" />
        {exporting ? 'Exportando...' : 'Exportar'}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
