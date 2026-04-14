'use client';

import {
  BookOpen,
  LayoutDashboard,
  Receipt,
  Wallet,
  BarChart3,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const modules = [
  {
    icon: LayoutDashboard,
    title: 'Visão Geral',
    description: 'Veja os principais números da empresa no período selecionado.',
  },
  {
    icon: Receipt,
    title: 'Lançamentos',
    description: 'Cadastre receitas, custos e despesas em poucos passos.',
  },
  {
    icon: Wallet,
    title: 'Fluxo de Caixa',
    description: 'Acompanhe entradas e saídas para prever saldo e decisões.',
  },
  {
    icon: BarChart3,
    title: 'DRE',
    description: 'Analise resultado operacional, margem e lucro líquido.',
  },
  {
    icon: FileText,
    title: 'Relatórios',
    description: 'Exporte dados em PDF/Excel para compartilhar com sua equipe.',
  },
];

export default function AjudaPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Ajuda</h1>
        <p className="text-sm text-muted-foreground">
          Guia rápido para usar o sistema de forma simples e intuitiva.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Primeiros passos
          </CardTitle>
          <CardDescription>Comece por aqui para configurar tudo rapidamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Cadastre suas categorias e contas bancárias.</li>
            <li>Registre os lançamentos do mês (receitas, custos e despesas).</li>
            <li>Confira indicadores em Visão Geral e Fluxo de Caixa.</li>
            <li>Analise o DRE e exporte os relatórios quando necessário.</li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <module.icon className="h-4 w-4 text-primary" />
                {module.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Dicas de uso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Passe o mouse sobre ícones e itens de menu para ver dicas rápidas.</p>
          <p>• Use filtros por período para comparar resultados.</p>
          <p>• Mantenha categorias organizadas para um DRE mais preciso.</p>
        </CardContent>
      </Card>
    </div>
  );
}
