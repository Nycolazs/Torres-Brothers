'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, TransactionType } from '@/types';
import { getCategories, getCategoriesByType } from '@/services/categoryService';
import { useAuth } from './useAuth';

export function useCategories() {
  const { companyUid } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyUid) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCategories(companyUid);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [companyUid]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { categories, loading, refresh: fetch };
}

export function useCategoriesByType(type: TransactionType) {
  const { companyUid } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeCompanyUid = companyUid;
    if (!activeCompanyUid) return;

    async function loadCategories(activeUid: string) {
      setLoading(true);
      try {
        const data = await getCategoriesByType(activeUid, type);
        setCategories(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadCategories(activeCompanyUid);
  }, [companyUid, type]);

  return { categories, loading };
}
