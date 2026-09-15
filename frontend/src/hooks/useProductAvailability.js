import { useState, useEffect } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';

export const useProductAvailability = (productId, startDate, endDate, quantityNeeded = 1) => {
  const [data, setData] = useState({ available: false, availableQty: 0, conflictDates: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId || !startDate || !endDate) {
      setData({ available: false, availableQty: 0, conflictDates: [] });
      return;
    }

    const abortController = new AbortController();

    const checkAvailability = async () => {
      setLoading(true);
      setError(null);

      try {
        const formattedStart = format(startDate, 'yyyy-MM-dd');
        const formattedEnd = format(endDate, 'yyyy-MM-dd');

        // Theo backend phase 1, POST hay GET? Thường check dùng POST hoặc GET params. Giả định GET
        const response = await api.get(`/products/${productId}/availability`, {
          params: {
            startDate: formattedStart,
            endDate: formattedEnd,
            quantity: quantityNeeded,
          },
          signal: abortController.signal
        });
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.error?.message || 'Có lỗi xảy ra khi kiểm tra lịch.');
          setData({ available: false, availableQty: 0, conflictDates: [] });
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.message !== 'canceled') {
          setError(err.response?.data?.error?.message || err.message || 'Lỗi kết nối.');
          setData({ available: false, availableQty: 0, conflictDates: [] });
        }
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
      abortController.abort();
    };
  }, [productId, startDate, endDate, quantityNeeded]);

  return { data, loading, error };
};
