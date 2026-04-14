'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, TransactionType } from '@/types';
import { getCategories, getCategoriesByType } from '@/services/categoryService';
import { useAuth } from './useAuth';

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCategories(user.uid);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { categories, loading, refresh: fetch };
}

export function useCategoriesByType(type: TransactionType) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getCategoriesByType(user.uid, type)
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, type]);

  return { categories, loading };
}
