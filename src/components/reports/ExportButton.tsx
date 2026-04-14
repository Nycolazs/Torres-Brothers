'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
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

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);

      worksheet.addRow(columns.map((col) => col.header));
      data.forEach((row) => {
        worksheet.addRow(columns.map((col) => row[col.key] ?? ''));
      });

      worksheet.getRow(1).font = { bold: true };

      columns.forEach((col, index) => {
        const maxDataLength = data.reduce((max, row) => {
          const length = String(row[col.key] ?? '').length;
          return Math.max(max, length);
        }, col.header.length);

        worksheet.getColumn(index + 1).width = Math.min(Math.max(maxDataLength + 2, 12), 60);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
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
