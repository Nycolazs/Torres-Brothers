'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildClientErrorPayload, logClientError } from '@/services/errorLogService';

export function GlobalErrorReporter() {
  const { user } = useAuth();

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void logClientError(
        buildClientErrorPayload(event.error || event.message, 'window.error', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }, user?.uid)
      );
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      void logClientError(
        buildClientErrorPayload(event.reason, 'window.unhandledrejection', undefined, user?.uid)
      );
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [user?.uid]);

  return null;
}
