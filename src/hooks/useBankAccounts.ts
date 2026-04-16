'use client';

import { useState, useEffect, useCallback } from 'react';
import { BankAccount } from '@/types';
import { getBankAccounts } from '@/services/accountService';
import { useAuth } from './useAuth';

export function useBankAccounts() {
  const { companyUid } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyUid) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getBankAccounts(companyUid);
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  }, [companyUid]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { accounts, loading, refresh: fetch };
}
