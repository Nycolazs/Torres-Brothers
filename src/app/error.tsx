'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/ErrorState';
import { buildClientErrorPayload, logClientError } from '@/services/errorLogService';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void logClientError(
      buildClientErrorPayload(error, 'app-error-boundary', { digest: error.digest })
    );
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <ErrorState
          title="Algo saiu do esperado."
          description="A tela encontrou um erro, mas o sistema registrou os detalhes para análise."
          technicalDetails={`${error.message}${error.digest ? ` | digest: ${error.digest}` : ''}`}
          onRetry={reset}
        />
      </div>
    </main>
  );
}
