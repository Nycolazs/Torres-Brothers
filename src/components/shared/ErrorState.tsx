'use client';

import { AlertTriangle, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  technicalDetails?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Não foi possível carregar os dados.',
  description = 'Tente novamente. Se continuar acontecendo, envie os detalhes técnicos para o suporte.',
  technicalDetails,
  onRetry,
}: ErrorStateProps) {
  const copyDetails = async () => {
    if (!technicalDetails) return;
    await navigator.clipboard.writeText(technicalDetails);
    toast.success('Detalhes técnicos copiados.');
  };

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h2 className="font-semibold text-destructive">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            {technicalDetails && (
              <p className="mt-2 line-clamp-2 max-w-3xl text-xs text-muted-foreground">
                {technicalDetails}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {technicalDetails && (
            <Button type="button" variant="outline" size="sm" onClick={copyDetails}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar erro
            </Button>
          )}
          {onRetry && (
            <Button type="button" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
