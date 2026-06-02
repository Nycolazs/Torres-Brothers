'use client';

import { FileInput } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';

export default function NotasRecebidasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notas Recebidas</h1>
        <p className="text-sm text-muted-foreground">Preparação para entrada fiscal por XML/NF-e de fornecedores.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Entrada fiscal futura</CardTitle></CardHeader>
        <CardContent>
          <EmptyState
            icon={FileInput}
            title="Módulo preparado"
            description="A importação de notas recebidas depende de XML/NF-e, regras fiscais de entrada e validação contábil."
          />
        </CardContent>
      </Card>
    </div>
  );
}
