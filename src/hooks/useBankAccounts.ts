'use client';

import { useState, useEffect, useCallback } from 'react';
import { BankAccount } from '@/types';
import { getBankAccounts } from '@/services/accountService';
import { useAuth } from './useAuth';

export function useBankAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getBankAccounts(user.uid);
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { accounts, loading, refresh: fetch };
}
