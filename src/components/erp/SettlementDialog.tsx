'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PAYMENT_METHOD_LABELS } from '@/constants';
import { settleTransaction } from '@/services/erpService';
import { BankAccount, PaymentMethod, Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface SettlementDialogProps {
  uid?: string | null;
  transaction: Transaction | null;
  bankAccounts: BankAccount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettled: () => Promise<void> | void;
}

export function SettlementDialog({
  uid,
  transaction,
  bankAccounts,
  open,
  onOpenChange,
  onSettled,
}: SettlementDialogProps) {
  const [amount, setAmount] = useState(0);
  const [interest, setInterest] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const remaining = transaction?.remainingAmount ?? transaction?.amount ?? 0;
  const selectedBankAccountLabel =
    bankAccounts.find((account) => account.id === (bankAccountId || bankAccounts[0]?.id))?.name || 'Selecione';

  const generateReceipt = (receiptId: string) => {
    if (!transaction) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const title = transaction.type === 'income' ? 'Recibo de Recebimento' : 'Comprovante de Pagamento';
    const total = Math.max(0, amount + interest - discount);

    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.text(`Numero: ${receiptId}`, 14, 27);
    doc.text(`Data: ${new Date(`${paymentDate}T00:00:00`).toLocaleDateString('pt-BR')}`, 14, 34);
    doc.text(`Descricao: ${transaction.description}`, 14, 45);
    doc.text(`Contato: ${transaction.contactSnapshot?.name || transaction.contactName || '-'}`, 14, 52);
    doc.text(`Valor principal: ${formatCurrency(amount)}`, 14, 66);
    doc.text(`Juros/acrescimos: ${formatCurrency(interest)}`, 14, 73);
    doc.text(`Descontos: ${formatCurrency(discount)}`, 14, 80);
    doc.setFontSize(13);
    doc.text(`Total liquidado: ${formatCurrency(total)}`, 14, 92);
    doc.setFontSize(9);
    doc.text('Documento gerado pelo sistema financeiro Torres Brothers.', 14, 112);
    doc.save(`${receiptId.toLowerCase()}.pdf`);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uid || !transaction) return;
    const targetAccount = bankAccountId || bankAccounts[0]?.id;
    if (!targetAccount) {
      toast.error('Cadastre uma conta bancária primeiro.');
      return;
    }
    if (amount <= 0) {
      toast.error('Informe o valor da baixa.');
      return;
    }
    setSubmitting(true);
    try {
      const receiptId = await settleTransaction(uid, transaction, {
        transactionId: transaction.id,
        type: transaction.type,
        amount,
        interest,
        discount,
        paymentDate: new Date(`${paymentDate}T00:00:00`),
        bankAccountId: targetAccount,
        paymentMethod,
        notes,
      });
      generateReceipt(receiptId);
      toast.success('Baixa registrada.');
      onOpenChange(false);
      await onSettled();
    } catch {
      toast.error('Erro ao registrar baixa.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillRemaining = () => setAmount(remaining);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction?.type === 'income' ? 'Registrar recebimento' : 'Registrar pagamento'}</DialogTitle>
        </DialogHeader>
        {transaction && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-md border bg-muted/35 p-3 text-sm">
              <div className="font-medium">{transaction.description}</div>
              <div className="text-muted-foreground">Saldo em aberto: {formatCurrency(remaining)}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} onFocus={fillRemaining} />
              </div>
              <div className="space-y-2">
                <Label>Juros</Label>
                <Input type="number" step="0.01" value={interest} onChange={(e) => setInterest(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Conta bancária</Label>
                <Select value={bankAccountId || bankAccounts[0]?.id || ''} onValueChange={(value) => value && setBankAccountId(value)}>
                  <SelectTrigger><SelectValue>{selectedBankAccountLabel}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Forma de pagamento</Label>
                <Select value={paymentMethod} onValueChange={(value) => value && setPaymentMethod(value as PaymentMethod)}>
                  <SelectTrigger><SelectValue>{PAYMENT_METHOD_LABELS[paymentMethod]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? 'Registrando...' : 'Registrar baixa'}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
