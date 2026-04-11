'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'eco_recently_viewed';
const MAX_ITEMS = 6;

/**
 * Tracks the products a user has recently viewed using localStorage.
 * Returns the list, a function to add a product, and a function to clear all.
 */
export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    // Lazy initializer: runs once on mount; returns [] during SSR since window is not defined
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : [];
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const addToViewed = useCallback((product) => {
    if (!product) return;
    const id = String(product.id ?? product._id ?? '');
    if (!id) return;

    setRecentlyViewed((prev) => {
      // Remove duplicate, prepend, trim to MAX_ITEMS
      const filtered = prev.filter((p) => String(p.id ?? p._id) !== id);
      const next = [{ ...product, id }, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage might be unavailable (private mode quota, etc.) – silently skip
      }
      return next;
    });
  }, []);

  const clearViewed = useCallback(() => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { recentlyViewed, addToViewed, clearViewed };
}
