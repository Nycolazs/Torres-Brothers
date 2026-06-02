'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { getCategories } from '@/services/categoryService';
import { listFinancialAccounts } from '@/services/erpService';
import { Category, DREClassification, DRELineItem, DREReport, FinancialAccount, Transaction } from '@/types';
import { DRE_CATEGORY_GROUPS } from '@/constants';
import { toast } from 'sonner';

function makeLine(label: string, value: number, total?: number): DRELineItem {
  return {
    label,
    value,
    percentage: total && total !== 0 ? (value / total) * 100 : undefined,
  };
}

function sumByCategories(
  transactions: Transaction[],
  categories: Category[],
  categoryNames: readonly string[]
): number {
  const catIds = categories
    .filter((c) => categoryNames.includes(c.name))
    .map((c) => c.id);

  return transactions
    .filter((t) => catIds.includes(t.categoryId) && t.status !== 'cancelled')
    .reduce((sum, t) => sum + t.amount, 0);
}

function sumByDREClassification(
  transactions: Transaction[],
  financialAccounts: FinancialAccount[],
  categories: Category[],
  classification: DREClassification,
  fallbackCategoryNames: readonly string[]
): { total: number; children: DRELineItem[] } {
  const financialMap = new Map(financialAccounts.map((account) => [account.id, account]));
  const fallbackCategoryIds = categories
    .filter((category) => fallbackCategoryNames.includes(category.name))
    .map((category) => category.id);
  const totals: Record<string, number> = {};

  for (const transaction of transactions) {
    if (transaction.status === 'cancelled') continue;
    const financialAccount = transaction.financialAccountId
      ? financialMap.get(transaction.financialAccountId)
      : undefined;
    const usesFinancialAccount = financialAccount?.dreClassification === classification;
    const usesFallbackCategory = !transaction.financialAccountId && fallbackCategoryIds.includes(transaction.categoryId);

    if (!usesFinancialAccount && !usesFallbackCategory) continue;

    const label = financialAccount?.name || categories.find((category) => category.id === transaction.categoryId)?.name || 'Sem classificação';
    totals[label] = (totals[label] || 0) + transaction.amount;
  }

  const children = Object.entries(totals)
    .map(([label, value]) => makeLine(label, value))
    .sort((a, b) => b.value - a.value);

  return {
    total: children.reduce((sum, item) => sum + item.value, 0),
    children,
  };
}

export function useDRE(startDate: Date, endDate: Date) {
  const { companyUid } = useAuth();
  const [report, setReport] = useState<DREReport | null>(null);
  const [loading, setLoading] = useState(true);
  const startDateMs = startDate.getTime();
  const endDateMs = endDate.getTime();

  useEffect(() => {
    if (!companyUid) {
      setReport(null);
      setLoading(false);
      return;
    }

    const fetchDRE = async () => {
      setLoading(true);
      try {
        const start = new Date(startDateMs);
        const end = new Date(endDateMs);

        const [transactions, categories, financialAccounts] = await Promise.all([
          getTransactionsByDateRange(companyUid, start, end),
          getCategories(companyUid),
          listFinancialAccounts(companyUid),
        ]);

        const activeTransactions = transactions.filter((t) => t.status !== 'cancelled');

        // Revenue
        const receitaBruta = sumByDREClassification(
          activeTransactions,
          financialAccounts,
          categories,
          'gross_revenue',
          DRE_CATEGORY_GROUPS.receitaBrutaDeVendas
        );
        const outrasReceitas = sumByDREClassification(
          activeTransactions,
          financialAccounts,
          categories,
          'other_revenue',
          DRE_CATEGORY_GROUPS.outrasReceitas
        );
        const totalReceita = receitaBruta.total + outrasReceitas.total;

        const deducoes = sumByDREClassification(
          activeTransactions,
          financialAccounts,
          categories,
          'sales_deduction',
          []
        );
        const receitaLiquida = totalReceita - deducoes.total;

        // COGS
        const cmv = sumByDREClassification(
          activeTransactions,
          financialAccounts,
          categories,
          'cogs',
          DRE_CATEGORY_GROUPS.custoMercadoriasVendidas
        );
        const lucroBruto = receitaLiquida - cmv.total;

        // Operating Expenses
        const despAdmin = sumByDREClassification(activeTransactions, financialAccounts, categories, 'administrative_expense', DRE_CATEGORY_GROUPS.despesasAdministrativas);
        const despVendas = sumByDREClassification(activeTransactions, financialAccounts, categories, 'sales_expense', DRE_CATEGORY_GROUPS.despesasComVendas);
        const proLabore = {
          total: sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.proLabore),
          children: [] as DRELineItem[],
        };
        const manutencao = {
          total: sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.manutencao),
          children: [] as DRELineItem[],
        };
        const totalDespOp = despAdmin.total + despVendas.total + proLabore.total + manutencao.total;
        const resultadoOp = lucroBruto - totalDespOp;

        // Financial
        const despFinanceiras = sumByDREClassification(activeTransactions, financialAccounts, categories, 'financial_expense', DRE_CATEGORY_GROUPS.despesasFinanceiras);
        const resultadoAntesImpostos = resultadoOp - despFinanceiras.total;

        // Taxes
        const impostos = sumByDREClassification(activeTransactions, financialAccounts, categories, 'tax', DRE_CATEGORY_GROUPS.impostos);
        const lucroLiquido = resultadoAntesImpostos - impostos.total;

        const dre: DREReport = {
          period: { start, end },
          receitaBrutaDeVendas: {
            ...makeLine('(+) Receita Bruta de Vendas', receitaBruta.total, totalReceita),
            children: receitaBruta.children,
          },
          deducoesDeVendas: {
            ...makeLine('(-) Deduções de Receita', deducoes.total, totalReceita),
            children: deducoes.children,
          },
          receitaLiquida: makeLine('(=) Receita Líquida', receitaLiquida, totalReceita),
          custoMercadoriasVendidas: {
            ...makeLine('(-) Custo dos Produtos/Serviços Vendidos (CMV)', cmv.total, totalReceita),
            children: cmv.children,
          },
          lucroBruto: makeLine('(=) Lucro Bruto', lucroBruto, totalReceita),
          despesasOperacionais: {
            label: '(-) Despesas Operacionais',
            value: totalDespOp,
            percentage: totalReceita ? (totalDespOp / totalReceita) * 100 : undefined,
            children: [
              ...despAdmin.children,
              ...despVendas.children,
              makeLine('Pró-labore', proLabore.total, totalReceita),
              makeLine('Manutenção', manutencao.total, totalReceita),
            ],
          },
          despesasAdministrativas: makeLine('Despesas Administrativas', despAdmin.total, totalReceita),
          despesasComVendas: makeLine('Despesas com Vendas', despVendas.total, totalReceita),
          resultadoOperacional: makeLine('(=) Resultado Operacional', resultadoOp, totalReceita),
          despesasFinanceiras: {
            ...makeLine('(-) Despesas Financeiras', despFinanceiras.total, totalReceita),
            children: despFinanceiras.children,
          },
          resultadoAntesImpostos: makeLine('(=) Resultado Antes do Imposto', resultadoAntesImpostos, totalReceita),
          impostos: {
            ...makeLine('(-) Impostos e Taxas', impostos.total, totalReceita),
            children: impostos.children,
          },
          lucroLiquido: makeLine('(=) Lucro/Prejuízo Líquido', lucroLiquido, totalReceita),
        };

        setReport(dre);
      } catch {
        toast.error('Erro ao gerar DRE.');
      } finally {
        setLoading(false);
      }
    };

    fetchDRE();
  }, [companyUid, startDateMs, endDateMs]);

  return { report, loading };
}
