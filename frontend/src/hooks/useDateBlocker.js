import { useState, useEffect } from 'react';
import api from '../utils/api';

const blockedDateCache = new Map();

export const useDateBlocker = (productId) => {
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) {
      setBlockedDates([]);
      return;
    }

    if (blockedDateCache.has(productId)) {
      setBlockedDates(blockedDateCache.get(productId));
      return;
    }

    const fetchBlockedDates = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/products/${productId}/calendar`);
        if (response.data.success && response.data.data) {
          // Parse string array to Date objects
          const dates = response.data.data.blockedDates.map(dateStr => new Date(dateStr));
          blockedDateCache.set(productId, dates);
          setBlockedDates(dates);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedDates();
  }, [productId]);

  return { blockedDates, loading, error };
};
