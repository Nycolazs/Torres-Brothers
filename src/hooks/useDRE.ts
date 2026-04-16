'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getTransactionsByDateRange } from '@/services/transactionService';
import { getCategories } from '@/services/categoryService';
import { Transaction, Category, DREReport, DRELineItem } from '@/types';
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

        const [transactions, categories] = await Promise.all([
          getTransactionsByDateRange(companyUid, start, end),
          getCategories(companyUid),
        ]);

        const activeTransactions = transactions.filter((t) => t.status !== 'cancelled');

        // Revenue
        const receitaBruta = sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.receitaBrutaDeVendas);
        const outrasReceitas = sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.outrasReceitas);
        const totalReceita = receitaBruta + outrasReceitas;

        // Deductions (placeholder — could be a category)
        const deducoes = 0;
        const receitaLiquida = totalReceita - deducoes;

        // COGS
        const cmv = sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.custoMercadoriasVendidas);
        const lucroBruto = receitaLiquida - cmv;

        // Operating Expenses
        const despAdmin = sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.despesasAdministrativas);
        const despVendas = sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.despesasComVendas);
        const proLabore = sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.proLabore);
        const manutencao = sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.manutencao);
        const totalDespOp = despAdmin + despVendas + proLabore + manutencao;
        const resultadoOp = lucroBruto - totalDespOp;

        // Financial
        const despFinanceiras = sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.despesasFinanceiras);
        const resultadoAntesImpostos = resultadoOp - despFinanceiras;

        // Taxes
        const impostos = sumByCategories(activeTransactions, categories, DRE_CATEGORY_GROUPS.impostos);
        const lucroLiquido = resultadoAntesImpostos - impostos;

        const dre: DREReport = {
          period: { start, end },
          receitaBrutaDeVendas: makeLine('(+) Receita Bruta de Vendas', receitaBruta, totalReceita),
          deducoesDeVendas: makeLine('(-) Deduções de Receita', deducoes, totalReceita),
          receitaLiquida: makeLine('(=) Receita Líquida', receitaLiquida, totalReceita),
          custoMercadoriasVendidas: makeLine('(-) Custo dos Produtos/Serviços Vendidos (CMV)', cmv, totalReceita),
          lucroBruto: makeLine('(=) Lucro Bruto', lucroBruto, totalReceita),
          despesasOperacionais: {
            label: '(-) Despesas Operacionais',
            value: totalDespOp,
            percentage: totalReceita ? (totalDespOp / totalReceita) * 100 : undefined,
            children: [
              makeLine('Despesas Administrativas', despAdmin, totalReceita),
              makeLine('Despesas com Vendas', despVendas, totalReceita),
              makeLine('Pró-labore', proLabore, totalReceita),
              makeLine('Manutenção', manutencao, totalReceita),
            ],
          },
          despesasAdministrativas: makeLine('Despesas Administrativas', despAdmin, totalReceita),
          despesasComVendas: makeLine('Despesas com Vendas', despVendas, totalReceita),
          resultadoOperacional: makeLine('(=) Resultado Operacional', resultadoOp, totalReceita),
          despesasFinanceiras: makeLine('(-) Despesas Financeiras', despFinanceiras, totalReceita),
          resultadoAntesImpostos: makeLine('(=) Resultado Antes do Imposto', resultadoAntesImpostos, totalReceita),
          impostos: makeLine('(-) Impostos e Taxas', impostos, totalReceita),
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
