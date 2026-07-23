'use client';

import { FormEvent, useEffect, useState, useMemo } from 'react';
import { FileSignature, Plus, Trash2, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServicesManagerDialog } from '@/components/erp/ServicesManagerDialog';
import { useAuth } from '@/hooks/useAuth';
import { listContacts, listServices } from '@/services/erpService';
import { Contact, ServiceCatalogItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProposalItem {
  serviceId: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export default function PropostasPage() {
  const { companyUid } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedContactId, setSelectedContactId] = useState('custom');
  const [customContactName, setCustomContactName] = useState('');
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().slice(0, 10));
  const [validityDays, setValidityDays] = useState('15');
  const [introduction, setIntroduction] = useState(
    'Agradecemos a oportunidade de apresentar nossa proposta comercial para a execução de serviços de limpeza e revitalização de pisos. Abaixo detalhamos o escopo, cronograma e valores previstos.'
  );
  const [paymentTerms, setPaymentTerms] = useState(
    'Sinal de 50% na aprovação e 50% após a conclusão e entrega dos serviços.'
  );
  const [executionTime, setExecutionTime] = useState('A combinar conforme cronograma do cliente.');
  const [observations, setObservations] = useState(
    '1. A contratante deverá disponibilizar pontos de água e energia elétrica (220v/110v).\n2. O local deve estar desimpedido para a realização do serviço.'
  );

  const [items, setItems] = useState<ProposalItem[]>([
    { serviceId: '', description: '', qty: 1, unitPrice: 0 },
  ]);

  // Quick service creation states
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [quickServiceIndex, setQuickServiceIndex] = useState<number | null>(null);

  const handleServicesChange = (updatedServices: ServiceCatalogItem[], lastCreatedId?: string) => {
    setServices(updatedServices);

    if (lastCreatedId && quickServiceIndex !== null) {
      const createdService = updatedServices.find((s) => s.id === lastCreatedId);
      if (createdService) {
        const updated = [...items];
        updated[quickServiceIndex] = {
          serviceId: lastCreatedId,
          description: createdService.description,
          qty: updated[quickServiceIndex].qty,
          unitPrice: createdService.defaultAmount || 0,
        };
        setItems(updated);
      }
    }
  };

  // Load data
  useEffect(() => {
    async function load() {
      if (!companyUid) return;
      setLoading(true);
      try {
        const [cList, sList] = await Promise.all([
          listContacts(companyUid, 'customer'),
          listServices(companyUid),
        ]);
        setContacts(cList);
        setServices(sList);
      } catch {
        toast.error('Erro ao carregar contatos ou serviços.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [companyUid]);

  const clients = useMemo(() => contacts.filter((c) => c.type === 'customer' || c.type === 'both'), [contacts]);

  // Handle items list change
  const handleAddItem = () => {
    setItems([...items, { serviceId: '', description: '', qty: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProposalItem, value: string | number) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'serviceId') {
      const sId = value as string;
      item.serviceId = sId;
      const service = services.find((s) => s.id === sId);
      if (service) {
        item.description = service.description;
        item.unitPrice = service.defaultAmount || 0;
      }
    } else if (field === 'description') {
      item.description = value as string;
    } else if (field === 'qty') {
      item.qty = Math.max(1, Number(value));
    } else if (field === 'unitPrice') {
      item.unitPrice = Math.max(0, Number(value));
    }

    updated[index] = item;
    setItems(updated);
  };

  const totalAmount = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.qty * curr.unitPrice, 0);
  }, [items]);

  const clientName = useMemo(() => {
    if (selectedContactId === 'custom') return customContactName;
    const client = clients.find((c) => c.id === selectedContactId);
    return client ? client.name : '';
  }, [selectedContactId, customContactName, clients]);

  // Helper to load image as base64
  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  };

  const generateProposalPDF = async () => {
    if (!clientName) {
      toast.error('Informe o nome do cliente.');
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const logoBase64 = await getBase64ImageFromUrl('/logo.png');

      // --- PAGE 1: COVER PAGE (GREEN) ---
      // Background colors (Dark Green theme matching landing page)
      doc.setFillColor(7, 22, 16); // #071610
      doc.rect(0, 0, 210, 297, 'F');

      // Decorative Gold border
      doc.setDrawColor(200, 169, 110); // #c8a96e
      doc.setLineWidth(1);
      doc.rect(8, 8, 194, 281, 'S');
      doc.rect(9.5, 9.5, 191, 278, 'S');

      // Logo on Cover
      if (logoBase64) {
        // center logo
        doc.addImage(logoBase64, 'PNG', 85, 55, 40, 40);
      }

      // Title & Subtitle on Cover
      doc.setTextColor(243, 230, 203); // #f3e6cb (Light cream/gold)
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.text('TORRES BROTHERS', 105, 115, { align: 'center' });

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(200, 169, 110); // #c8a96e (Gold)
      doc.text('LIMPEZA E REVITALIZAÇÃO DE PISOS', 105, 123, { align: 'center' });

      // Gold Separator Line
      doc.setDrawColor(200, 169, 110);
      doc.setLineWidth(0.5);
      doc.line(70, 130, 140, 130);

      // Proposal Cover Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('PROPOSTA COMERCIAL', 105, 165, { align: 'center' });

      // Client Box
      doc.setFillColor(11, 36, 24); // #0b2418 (Medium Green)
      doc.rect(30, 185, 150, 60, 'F');
      doc.rect(30, 185, 150, 60, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(200, 169, 110);
      doc.text('CLIENTE:', 40, 200);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(clientName.toUpperCase(), 40, 207);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 169, 110);
      doc.text('DATA DE EMISSÃO:', 40, 222);
      doc.setTextColor(255, 255, 255);
      doc.text(new Date(`${proposalDate}T00:00:00`).toLocaleDateString('pt-BR'), 40, 229);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 169, 110);
      doc.text('VALIDADE DA PROPOSTA:', 110, 222);
      doc.setTextColor(255, 255, 255);
      doc.text(`${validityDays} dias`, 110, 229);

      // Cover Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(143, 179, 163); // #8fb3a3
      doc.text('Curitiba e região · WhatsApp: (41) 98716-4811', 105, 275, { align: 'center' });

      // --- PAGE 2: DETAILS ---
      doc.addPage();

      // Page 2 Background Accent (White background with gold/green details)
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');

      // Inner page border (subtle)
      doc.setDrawColor(230, 235, 232);
      doc.setLineWidth(0.3);
      doc.rect(10, 10, 190, 277, 'S');

      // Inner page header
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 15, 14, 14);
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(7, 22, 16);
      doc.text('TORRES BROTHERS', 32, 21);
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(200, 169, 110);
      doc.text('LIMPEZA E REVITALIZAÇÃO DE PISOS', 32, 25);

      // Gold rule under header
      doc.setDrawColor(200, 169, 110);
      doc.setLineWidth(0.5);
      doc.line(14, 32, 196, 32);

      // Page Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(7, 22, 16);
      doc.text('DETALHAMENTO DA PROPOSTA', 14, 42);

      // Introduction paragraph
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const splitIntro = doc.splitTextToSize(introduction, 180);
      doc.text(splitIntro, 14, 49);

      // Table of items
      const tableHeaders = ['Item', 'Serviço / Descrição', 'Qtd', 'Val. Unit.', 'Total'];
      const tableRows = items.map((item, index) => [
        String(index + 1).padStart(2, '0'),
        item.description || 'Serviço personalizado',
        String(item.qty),
        formatCurrency(item.unitPrice),
        formatCurrency(item.qty * item.unitPrice),
      ]);

      const startY = 49 + (splitIntro.length * 5) + 8;

      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: startY,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
        headStyles: { fillColor: [7, 22, 16], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 102 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
        },
        alternateRowStyles: { fillColor: [248, 250, 248] },
      });

      // Total Value Display
      const finalY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(7, 22, 16);
      doc.text(`VALOR TOTAL DO INVESTIMENTO: ${formatCurrency(totalAmount)}`, 14, finalY);

      // Divider
      doc.setDrawColor(230, 235, 232);
      doc.setLineWidth(0.3);
      doc.line(14, finalY + 4, 196, finalY + 4);

      // Terms & Conditions Block
      let termsY = finalY + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(7, 22, 16);
      doc.text('CONDIÇÕES COMERCIAIS', 14, termsY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      termsY += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Prazo de Execução: ', 14, termsY);
      doc.setFont('helvetica', 'normal');
      doc.text(executionTime, 48, termsY);

      termsY += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Forma de Pagamento: ', 14, termsY);
      doc.setFont('helvetica', 'normal');
      const splitPayment = doc.splitTextToSize(paymentTerms, 140);
      doc.text(splitPayment, 50, termsY);

      termsY += splitPayment.length * 4.5 + 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Observações e Requisitos:', 14, termsY);
      doc.setFont('helvetica', 'normal');
      const splitObs = doc.splitTextToSize(observations, 180);
      doc.text(splitObs, 14, termsY + 5);

      // Signatures at the bottom
      const signatureY = 250;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      
      // Torres Brothers signature line
      doc.line(20, signatureY, 90, signatureY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(7, 22, 16);
      doc.text('TORRES BROTHERS', 55, signatureY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('Responsável Técnico', 55, signatureY + 8, { align: 'center' });

      // Client signature line
      doc.line(120, signatureY, 190, signatureY);
      doc.setFont('helvetica', 'bold');
      doc.text(clientName.toUpperCase(), 155, signatureY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('Aceite do Cliente', 155, signatureY + 8, { align: 'center' });

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text('Torres Brothers — Limpeza e revitalização de pisos. Curitiba/PR', 105, 282, { align: 'center' });

      // Save document
      const normalizedClientName = clientName.toLowerCase().replace(/\s+/g, '-');
      doc.save(`proposta-torres-brothers-${normalizedClientName}.pdf`);
      toast.success('Proposta comercial exportada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF da proposta.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Propostas & Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
            Gere propostas comerciais profissionais em PDF usando a identidade visual oficial (Verde e Ouro)
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_450px]">
        {/* Main Proposal Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                Dados Principais da Proposta
              </CardTitle>
              <CardDescription>Defina as informações básicas e o cliente da proposta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={selectedContactId} onValueChange={(val) => setSelectedContactId(val || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente">
                        {selectedContactId === 'custom' ? 'Cliente Personalizado / Avulso' : (clients.find((c) => c.id === selectedContactId)?.name || '')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">-- Cliente Personalizado / Avulso --</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedContactId === 'custom' && (
                  <div className="space-y-2">
                    <Label>Nome do Cliente Personalizado</Label>
                    <Input
                      value={customContactName}
                      onChange={(e) => setCustomContactName(e.target.value)}
                      placeholder="Ex: Nome do Cliente ou Empresa Ltda"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Data de Emissão</Label>
                  <Input type="date" value={proposalDate} onChange={(e) => setProposalDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Dias de Validade</Label>
                  <Input type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texto de Apresentação (Introdução)</Label>
                <Textarea
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Proposal Items Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Escopo dos Serviços e Valores</CardTitle>
                <CardDescription>Adicione as atividades, quantidades e preços unitários</CardDescription>
              </div>
              <Button size="sm" onClick={handleAddItem} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-1" /> Adicionar Serviço
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-end border-b pb-4 md:border-b-0 md:pb-0">
                    <div className="w-full md:w-[220px] space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Buscar do Catálogo</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickServiceIndex(index);
                            setServiceModalOpen(true);
                          }}
                          className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          + Novo
                        </button>
                      </div>
                      <Select
                        value={item.serviceId}
                        onValueChange={(val) => handleItemChange(index, 'serviceId', val || '')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um serviço">
                            {services.find((s) => s.id === item.serviceId)?.description || ''}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {services.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum serviço cadastrado
                            </SelectItem>
                          ) : (
                            services.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.description}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 w-full space-y-1">
                      <Label className="text-xs">Descrição na Proposta</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Descreva o serviço para o cliente"
                      />
                    </div>

                    <div className="w-[80px] space-y-1">
                      <Label className="text-xs">Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      />
                    </div>

                    <div className="w-[120px] space-y-1">
                      <Label className="text-xs">Preço Unit. (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        placeholder="0,00"
                      />
                    </div>

                    <div className="pt-2 md:pt-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive cursor-pointer"
                        disabled={items.length === 1}
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t text-right">
                <div>
                  <span className="text-sm text-muted-foreground block">Valor Total Previsto</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Condições Gerais & Observações</CardTitle>
              <CardDescription>Defina prazos, formas de pagamento e requisitos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prazo de Execução</Label>
                  <Input
                    value={executionTime}
                    onChange={(e) => setExecutionTime(e.target.value)}
                    placeholder="Ex: 3 dias úteis após assinatura"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Condições de Pagamento</Label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Ex: 50% entrada, 50% conclusão"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Requisitos e Observações</Label>
                <Textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel & Visual Checklist */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateProposalPDF} className="w-full cursor-pointer py-6 text-base" size="lg">
                <Download className="h-5 w-5 mr-2" />
                Gerar PDF Profissional
              </Button>

              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-semibold">Estrutura do PDF Branded:</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#c8a96e] shrink-0" />
                    Pág 1: Capa Verde Oficial da Torres Brothers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#c8a96e] shrink-0" />
                    Capa com Logo centralizado e detalhes em Ouro
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#c8a96e] shrink-0" />
                    Pág 2+: Detalhamento estruturado e limpo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#c8a96e] shrink-0" />
                    Tabela de serviços e valores (estilo MarketUP)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#c8a96e] shrink-0" />
                    Rodapé e assinatura formal
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo do PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-semibold text-right max-w-[200px] truncate">
                  {clientName || 'Não especificado'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Emissão:</span>
                <span>{new Date(`${proposalDate}T00:00:00`).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Validade:</span>
                <span>{validityDays} dias</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Services Manager Dialog */}
      <ServicesManagerDialog
        open={serviceModalOpen}
        onOpenChange={setServiceModalOpen}
        companyUid={companyUid}
        onServicesChange={handleServicesChange}
      />
    </div>
  );
}
