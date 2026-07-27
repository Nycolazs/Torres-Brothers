'use client';

import { useEffect, useState, useMemo } from 'react';
import { FileSignature, Plus, Trash2, Download, CheckCircle2, Save, FolderOpen, RefreshCw } from 'lucide-react';
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
import { listContacts, listServices, listProposals, saveProposal, deleteProposal, Proposal } from '@/services/erpService';
import { Contact, ServiceCatalogItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProposalItem {
  serviceId: string;
  title: string;
  description: string;
  statusFinanceiro: string;
  qty: number;
  unitPrice: number;
}

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export default function PropostasPage() {
  const { companyUid, profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [savedProposals, setSavedProposals] = useState<Proposal[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [selectedContactId, setSelectedContactId] = useState('custom');
  const [customContactName, setCustomContactName] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [contractingName, setContractingName] = useState('');
  const [clientCnpj, setClientCnpj] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState<number>(0);
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().slice(0, 10));
  const [validityDays, setValidityDays] = useState('10');
  const [introduction, setIntroduction] = useState(
    'Agradecemos a oportunidade de apresentar nossa proposta comercial para a execução de serviços de limpeza e revitalização de pisos. Abaixo detalhamos o escopo, cronograma e valores previstos.'
  );
  const [paymentTerms, setPaymentTerms] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tb_proposal_payment_terms') || 'Sinal de 50% na aprovação e 50% após a conclusão e entrega dos serviços.';
    }
    return 'Sinal de 50% na aprovação e 50% após a conclusão e entrega dos serviços.';
  });
  const [executionTime, setExecutionTime] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tb_proposal_execution_time') || 'A combinar conforme cronograma do cliente.';
    }
    return 'A combinar conforme cronograma do cliente.';
  });
  const [observations, setObservations] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tb_proposal_observations') || '1. A contratante deverá disponibilizar pontos de água e energia elétrica (220v/110v).\n2. O local deve estar desimpedido para a realização do serviço.';
    }
    return '1. A contratante deverá disponibilizar pontos de água e energia elétrica (220v/110v).\n2. O local deve estar desimpedido para a realização do serviço.';
  });

  const [items, setItems] = useState<ProposalItem[]>([
    {
      serviceId: '',
      title: '',
      description: '',
      statusFinanceiro: 'Incluso no Pacote',
      qty: 1,
      unitPrice: 0,
    },
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
          title: createdService.description,
          description: createdService.notes || '',
          statusFinanceiro: updated[quickServiceIndex].statusFinanceiro || 'Incluso no Pacote',
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
      try {
        const [cList, sList] = await Promise.all([
          listContacts(companyUid, 'customer'),
          listServices(companyUid),
        ]);
        setContacts(cList);
        setServices(sList);
      } catch {
        toast.error('Erro ao carregar contatos ou serviços.');
      }
    }
    load();
  }, [companyUid]);

  // Load saved proposals on mount from Firebase
  useEffect(() => {
    async function load() {
      if (!companyUid) return;
      try {
        const pList = await listProposals(companyUid);
        setSavedProposals(pList);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [companyUid]);

  const clients = useMemo(() => contacts.filter((c) => c.type === 'customer' || c.type === 'both'), [contacts]);

  const handleContactChange = (val: string | null) => {
    const contactId = val || 'custom';
    setSelectedContactId(contactId);
    if (contactId !== 'custom') {
      const client = clients.find((c) => c.id === contactId);
      setClientCnpj(client?.document || '');
    } else {
      setClientCnpj('');
    }
  };

  // Handle items list change
  const handleAddItem = () => {
    setItems([...items, { serviceId: '', title: '', description: '', statusFinanceiro: 'Incluso no Pacote', qty: 1, unitPrice: 0 }]);
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
      item.serviceId = sId === 'none' ? '' : sId;
      if (sId !== 'none') {
        const service = services.find((s) => s.id === sId);
        if (service) {
          item.title = service.description;
          item.description = service.notes || '';
          item.unitPrice = service.defaultAmount || 0;
        }
      }
    } else if (field === 'title') {
      item.title = value as string;
    } else if (field === 'description') {
      item.description = value as string;
    } else if (field === 'statusFinanceiro') {
      item.statusFinanceiro = value as string;
    } else if (field === 'qty') {
      item.qty = Math.max(1, Number(value));
    } else if (field === 'unitPrice') {
      item.unitPrice = Math.max(0, Number(value));
    }

    updated[index] = item;
    setItems(updated);
  };

  const totalAmount = useMemo(() => {
    const itemsSum = items.reduce((acc, curr) => acc + curr.qty * curr.unitPrice, 0);
    return itemsSum + (Number(additionalAmount) || 0);
  }, [items, additionalAmount]);

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

  // Proposal persistence using Firebase
  const handleSaveProposal = async () => {
    if (!companyUid) {
      toast.error('Você precisa estar logado para salvar.');
      return;
    }
    if (!clientName) {
      toast.error('Informe o nome do cliente antes de salvar a proposta.');
      return;
    }

    try {
      const dataToSave: Omit<Proposal, 'id'> & { id?: string } = {
        title: `${clientName} - ${new Date(`${proposalDate}T00:00:00`).toLocaleDateString('pt-BR')} (${formatCurrency(totalAmount)})`,
        selectedContactId,
        customContactName,
        networkName,
        contractingName,
        clientCnpj,
        additionalAmount,
        proposalDate,
        validityDays,
        introduction,
        paymentTerms,
        executionTime,
        observations,
        items,
        createdAt: new Date().toISOString(),
      };

      if (editingId) {
        dataToSave.id = editingId;
      }

      const pId = await saveProposal(companyUid, dataToSave);
      setEditingId(pId);
      
      const pList = await listProposals(companyUid);
      setSavedProposals(pList);
      toast.success(editingId ? 'Proposta atualizada no Firebase!' : 'Proposta salva no Firebase!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar proposta no Firebase.');
    }
  };

  const handleLoadProposal = (p: Proposal) => {
    setEditingId(p.id || null);
    setSelectedContactId(p.selectedContactId);
    setCustomContactName(p.customContactName || '');
    setNetworkName(p.networkName || '');
    setContractingName(p.contractingName || '');
    setClientCnpj(p.clientCnpj || '');
    setAdditionalAmount(p.additionalAmount || 0);
    setProposalDate(p.proposalDate || new Date().toISOString().slice(0, 10));
    setValidityDays(p.validityDays || '10');
    setIntroduction(p.introduction || '');
    setPaymentTerms(p.paymentTerms || '');
    setExecutionTime(p.executionTime || '');
    setObservations(p.observations || '');
    setItems(p.items || []);
    toast.success('Dados da proposta carregados para edição!');
  };

  const handleDeleteProposal = async (id: string) => {
    if (!companyUid) return;
    try {
      await deleteProposal(companyUid, id);
      const pList = await listProposals(companyUid);
      setSavedProposals(pList);
      if (editingId === id) {
        setEditingId(null);
      }
      toast.success('Proposta excluída com sucesso.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir proposta.');
    }
  };

  const handleNewProposal = () => {
    setEditingId(null);
    setSelectedContactId('custom');
    setCustomContactName('');
    setNetworkName('');
    setContractingName('');
    setClientCnpj('');
    setAdditionalAmount(0);
    setProposalDate(new Date().toISOString().slice(0, 10));
    setValidityDays('10');
    setIntroduction('Agradecemos a oportunidade de apresentar nossa proposta comercial para a execução de serviços de limpeza e revitalização de pisos. Abaixo detalhamos o escopo, cronograma e valores previstos.');
    setPaymentTerms('Sinal de 50% na aprovação e 50% após a conclusão e entrega dos serviços.');
    setExecutionTime('A combinar conforme cronograma do cliente.');
    setObservations('1. A contratante deverá disponibilizar pontos de água e energia elétrica (220v/110v).\n2. O local deve estar desimpedido para a realização do serviço.');
    setItems([
      {
        serviceId: '',
        title: '',
        description: '',
        statusFinanceiro: 'Incluso no Pacote',
        qty: 1,
        unitPrice: 0,
      }
    ]);
    toast.info('Formulário limpo para nova proposta.');
  };

  const generateProposalPDF = async () => {
    if (!clientName) {
      toast.error('Informe o nome do cliente.');
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const logoBase64 = await getBase64ImageFromUrl('/logo.png');
      const qrBase64 = await getBase64ImageFromUrl('/whatsapp-qr.png');

      const drawPageDecorations = () => {
        // --- CURVED HEADER WAVES ---
        // Ellipse 1 (Light background wave)
        doc.setFillColor(240, 245, 242);
        doc.ellipse(130, 10, 160, 45, 'F');
        
        // Ellipse 2 (Gold accent wave)
        doc.setFillColor(200, 169, 110); // #c8a96e (Torres Brothers Gold)
        doc.ellipse(160, 0, 140, 45, 'F');
        
        // Ellipse 3 (Dark Green main wave)
        doc.setFillColor(7, 22, 16); // #071610 (Torres Brothers Dark Green)
        doc.ellipse(70, -10, 150, 55, 'F');

        // Logo & Company Name on the left
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 15, 8, 12, 12);
        }
        doc.setFont('times', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('TORRES BROTHERS', 30, 14);
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(200, 169, 110);
        doc.text('LIMPEZA E REVITALIZAÇÃO DE PISOS', 30, 18);

        // Header Contact Info (Right side)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(200, 169, 110);
        doc.text('Telefone:', 135, 10);
        doc.setTextColor(255, 255, 255);
        doc.text('(41) 98716-4811', 135, 13);
        
        doc.setTextColor(200, 169, 110);
        doc.text('E-mail / Web:', 170, 10);
        doc.setTextColor(255, 255, 255);
        doc.text('torresbrothers.com.br', 170, 13);

        // WhatsApp QR Code
        if (qrBase64) {
          doc.addImage(qrBase64, 'PNG', 170, 15.5, 11, 11);
        }
        
        doc.setTextColor(200, 169, 110);
        doc.text('Localização:', 135, 19);
        doc.setTextColor(255, 255, 255);
        doc.text('Curitiba - PR', 135, 22);

        // Footer Line
        doc.setDrawColor(220, 225, 222);
        doc.setLineWidth(0.3);
        doc.line(15, 285, 195, 285);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text('Torres Brothers — Limpeza e revitalização de pisos. Curitiba/PR', 105, 290, { align: 'center' });
      };

      // --- PAGE 1: COVER PAGE (GREEN) ---
      // Background color: #071610 (Torres Brothers Dark Green)
      doc.setFillColor(7, 22, 16);
      doc.rect(0, 0, 210, 297, 'F');

      // Decorative Gold border
      doc.setDrawColor(200, 169, 110); // #c8a96e
      doc.setLineWidth(1);
      doc.rect(8, 8, 194, 281, 'S');
      doc.rect(9.5, 9.5, 191, 278, 'S');

      // Logo on Cover
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 85, 55, 40, 40);
      }

      // Title & Subtitle on Cover
      doc.setTextColor(243, 230, 203); // Light gold
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.text('TORRES BROTHERS', 105, 115, { align: 'center' });

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(200, 169, 110);
      doc.text('LIMPEZA E REVITALIZAÇÃO DE PISOS', 105, 123, { align: 'center' });

      // CNPJ on Cover
      const companyCnpj = profile?.companyDocument || '55.334.821/0001-08';
      doc.setFontSize(8.5);
      doc.text(`CNPJ: ${companyCnpj}`, 105, 128, { align: 'center' });

      // Gold Separator Line
      doc.setDrawColor(200, 169, 110);
      doc.setLineWidth(0.5);
      doc.line(70, 134, 140, 134);

      // Proposal Cover Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('PROPOSTA COMERCIAL', 105, 165, { align: 'center' });

      // Client Box
      doc.setFillColor(11, 36, 24); // Medium Green #0b2418
      doc.rect(30, 180, 150, 72, 'F');
      doc.rect(30, 180, 150, 72, 'S');

      // Let's structure the fields cleanly:
      let startBoxY = 191;

      // 1. Cliente
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(200, 169, 110); // Gold
      doc.text('CLIENTE:', 40, startBoxY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255); // White
      doc.text(clientName.toUpperCase(), 40, startBoxY + 4.5);

      startBoxY += 12.5;

      // 2. Representante (if filled)
      if (contractingName) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(200, 169, 110);
        doc.text('REPRESENTANTE:', 40, startBoxY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(255, 255, 255);
        doc.text(contractingName.toUpperCase(), 40, startBoxY + 4.5);
        startBoxY += 12.5;
      }

      // 3. CNPJ (if filled)
      if (clientCnpj) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(200, 169, 110);
        doc.text('CNPJ DO CLIENTE:', 40, startBoxY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(255, 255, 255);
        doc.text(clientCnpj, 40, startBoxY + 4.5);
        startBoxY += 12.5;
      }

      // 4. Emission and Validity side by side
      // Left side: Emissão
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(200, 169, 110);
      doc.text('DATA DE EMISSÃO:', 40, startBoxY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.text(new Date(`${proposalDate}T00:00:00`).toLocaleDateString('pt-BR'), 40, startBoxY + 4.5);

      // Right side: Validade
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(200, 169, 110);
      doc.text('VALIDADE DA PROPOSTA:', 110, startBoxY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`${validityDays} dias`, 110, startBoxY + 4.5);

      // Cover Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(143, 179, 163);
      doc.text('Curitiba e região · WhatsApp: (41) 98716-4811', 105, 275, { align: 'center' });

      // --- PAGE 2: DETAILS ---
      doc.addPage();

      // Draw decorations for page 2
      drawPageDecorations();

      // --- CLIENT & DOCUMENT INFO SECTION ---
      // Left side: Client Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('APRESENTADO A:', 15, 48);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(7, 22, 16);
      
      const primaryDisplayName = contractingName ? contractingName.toUpperCase() : clientName.toUpperCase();
      doc.text(primaryDisplayName, 15, 54);
      
      let clientInfoY = 59;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      if (networkName) {
        doc.text(`Rede: ${networkName}`, 15, clientInfoY);
        clientInfoY += 4.5;
      }
      if (contractingName) {
        doc.text(`Contratante: ${clientName}`, 15, clientInfoY);
        clientInfoY += 4.5;
      }

      // Right side: Document Details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(7, 22, 16);
      doc.text('PROPOSTA', 135, 48);
      
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Data de Emissão: ${new Date(`${proposalDate}T00:00:00`).toLocaleDateString('pt-BR')}`, 135, 54);
      doc.text(`Validade da Proposta: ${validityDays} dias`, 135, 59);

      // --- INTRODUCTION PARAGRAPH ---
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(80, 80, 80);
      const splitIntro = doc.splitTextToSize(introduction, 180);
      const introY = Math.max(68, clientInfoY + 4);
      doc.text(splitIntro, 15, introY);

      const tableStartY = introY + (splitIntro.length * 4) + 4;

      // --- SERVICES & VALUES TABLE ---
      const tableHeaders = ['ITEM / ETAPA', 'DESCRIÇÃO DO ESCOPO TÉCNICO', 'STATUS FINANCEIRO'];
      const tableRows = items.map((item) => [
        item.title || 'Serviço personalizado',
        item.description || '',
        item.statusFinanceiro || 'Incluso no Pacote',
      ]);

      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: tableStartY,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
        didParseCell: function (data) {
          if (data.section === 'head') {
            if (data.column.index <= 1) {
              data.cell.styles.fillColor = [200, 169, 110];
              data.cell.styles.textColor = [7, 22, 16];
            } else {
              data.cell.styles.fillColor = [7, 22, 16];
              data.cell.styles.textColor = [255, 255, 255];
            }
          }
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 95 },
          2: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [246, 249, 247] },
      });

      let currentY = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY || 80) + 6;

      const checkPageOverflow = (heightNeeded: number) => {
        if (currentY + heightNeeded > 275) {
          doc.addPage();
          drawPageDecorations();
          currentY = 48;
          return true;
        }
        return false;
      };

      checkPageOverflow(10);

      // Grand Total Gold Bar
      doc.setFillColor(200, 169, 110);
      doc.rect(100, currentY, 95, 8, 'F');
      
      doc.setTextColor(7, 22, 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('VALOR TOTAL', 103, currentY + 5.5);
      doc.text(formatCurrency(totalAmount), 192, currentY + 5.5, { align: 'right' });

      currentY += 12;

      // --- CONDIÇÕES COMERCIAIS & OBSERVAÇÕES ---
      checkPageOverflow(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(7, 22, 16);
      doc.text('CONDIÇÕES COMERCIAIS & OBSERVAÇÕES', 15, currentY);
      currentY += 5;

      const printBlock = (title: string, text: string) => {
        if (!text) return;
        checkPageOverflow(6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(title, 15, currentY);
        currentY += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);

        const lines = text.split('\n');
        for (const line of lines) {
          const splitLines = doc.splitTextToSize(line || ' ', 180);
          for (const splitLine of splitLines) {
            checkPageOverflow(4.5);
            doc.text(splitLine, 15, currentY);
            currentY += 4;
          }
        }
        currentY += 2;
      };

      printBlock('Prazo de Execução:', executionTime);
      printBlock('Forma de Pagamento / Condições Comerciais:', paymentTerms);
      printBlock('Requisitos & Observações Gerais:', observations);

      // --- SIGNATURE SECTION ---
      // Force signatures to always sit at the bottom of the last page (Y = 250)
      if (currentY > 250) {
        doc.addPage();
        drawPageDecorations();
      }
      currentY = 250;

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);

      const sigLeftX = 15;
      const sigWidth = 75;
      doc.line(sigLeftX, currentY, sigLeftX + sigWidth, currentY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(7, 22, 16);
      doc.text('TORRES BROTHERS', sigLeftX + sigWidth / 2, currentY + 3.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('Responsável Técnico', sigLeftX + sigWidth / 2, currentY + 7, { align: 'center' });

      const sigRightX = 120;
      doc.line(sigRightX, currentY, sigRightX + sigWidth, currentY);
      doc.setFont('helvetica', 'bold');
      const signerName = contractingName ? contractingName.toUpperCase() : clientName.toUpperCase();
      doc.text(signerName, sigRightX + sigWidth / 2, currentY + 3.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('Contratante / Autorizado', sigRightX + sigWidth / 2, currentY + 7, { align: 'center' });

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
        <Button onClick={handleNewProposal} size="sm" variant="outline" className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1" /> Nova Proposta
        </Button>
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
                  <Select value={selectedContactId} onValueChange={handleContactChange}>
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

                <div className="space-y-2">
                  <Label>Rede <span className="text-xs text-muted-foreground font-normal">(Opcional)</span></Label>
                  <Input
                    value={networkName}
                    onChange={(e) => setNetworkName(e.target.value)}
                    placeholder="Ex: Rede de Lojas X"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Representante <span className="text-xs text-muted-foreground font-normal">(Opcional)</span></Label>
                  <Input
                    value={contractingName}
                    onChange={(e) => setContractingName(e.target.value)}
                    placeholder="Ex: Cledivilson"
                  />
                </div>

                <div className="space-y-2">
                  <Label>CNPJ do Cliente <span className="text-xs text-muted-foreground font-normal">(Opcional)</span></Label>
                  <Input
                    value={clientCnpj}
                    onChange={(e) => setClientCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0000-00"
                  />
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
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col gap-3 border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-end w-full">
                      {/* Buscar do Catálogo */}
                      <div className="w-full md:w-[180px] space-y-1">
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
                          value={item.serviceId || 'none'}
                          onValueChange={(val) => handleItemChange(index, 'serviceId', val || '')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Avulso / Não vinculado">
                              {services.find((s) => s.id === item.serviceId)?.description || 'Avulso / Não vinculado'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Avulso (Não vinculado) --</SelectItem>
                            {services.length > 0 &&
                              services.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.description}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Item / Etapa */}
                      <div className="flex-1 w-full space-y-1">
                        <Label className="text-xs">Item / Etapa</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                          placeholder="Ex: 01. Lavagem Técnica"
                        />
                      </div>

                      {/* Status Financeiro */}
                      <div className="w-full md:w-[150px] space-y-1">
                        <Label className="text-xs">Status Financeiro</Label>
                        <Input
                          value={item.statusFinanceiro}
                          onChange={(e) => handleItemChange(index, 'statusFinanceiro', e.target.value)}
                          placeholder="Ex: Incluso no Pacote"
                        />
                      </div>

                      {/* Qtd */}
                      <div className="w-full md:w-[70px] space-y-1">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        />
                      </div>

                      {/* Preço Unit. */}
                      <div className="w-full md:w-[110px] space-y-1">
                        <Label className="text-xs">Preço Unit. (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          placeholder="0,00"
                        />
                      </div>

                      {/* Remove Button */}
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

                    {/* Descrição do Escopo Técnico */}
                    <div className="w-full space-y-1">
                      <Label className="text-xs">Descrição do Escopo Técnico</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Descreva o escopo técnico detalhado deste item"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row justify-between items-end gap-4 pt-4 border-t">
                <div className="w-full md:w-[220px] space-y-1 text-left">
                  <Label className="text-xs">Valor Previsto Adicional (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={additionalAmount || ''}
                    onChange={(e) => setAdditionalAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="0,00"
                  />
                </div>
                <div className="text-right">
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
                  <Textarea
                    value={executionTime}
                    onChange={(e) => {
                      setExecutionTime(e.target.value);
                      localStorage.setItem('tb_proposal_execution_time', e.target.value);
                    }}
                    placeholder="Ex: 3 dias úteis após assinatura"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Condições de Pagamento</Label>
                  <Textarea
                    value={paymentTerms}
                    onChange={(e) => {
                      setPaymentTerms(e.target.value);
                      localStorage.setItem('tb_proposal_payment_terms', e.target.value);
                    }}
                    placeholder="Ex: 50% entrada, 50% conclusão"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Requisitos e Observações</Label>
                <Textarea
                  value={observations}
                  onChange={(e) => {
                    setObservations(e.target.value);
                    localStorage.setItem('tb_proposal_observations', e.target.value);
                  }}
                  rows={6}
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

              <Button onClick={handleSaveProposal} variant="secondary" className="w-full cursor-pointer py-6 text-base" size="lg">
                <Save className="h-5 w-5 mr-2" />
                Salvar Proposta
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
                    Pág 2+: Detalhamento estruturado e limpo com quebra de página automática
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#c8a96e] shrink-0" />
                    Tabela de serviços e valores
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#c8a96e] shrink-0" />
                    Rodapé e assinatura formal
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Saved Proposals list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Propostas Salvas
              </CardTitle>
              <CardDescription>Lista de propostas salvas no seu navegador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {savedProposals.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma proposta salva ainda.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {savedProposals.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/40 text-xs gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('pt-BR')} às {new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Carregar proposta"
                          className="h-7 w-7 text-primary cursor-pointer hover:bg-primary/10"
                          onClick={() => handleLoadProposal(p)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                         <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir proposta"
                          className="h-7 w-7 text-destructive cursor-pointer hover:bg-destructive/10"
                          onClick={() => p.id && handleDeleteProposal(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
