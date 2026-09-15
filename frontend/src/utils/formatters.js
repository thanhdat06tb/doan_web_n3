import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * Định dạng số tiền sang VND
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Tính số ngày thuê dựa trên ngày bắt đầu và kết thúc
 * @param {Date|string} startDate 
 * @param {Date|string} endDate 
 * @returns {number}
 */
export const calculateRentalDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  const days = differenceInCalendarDays(end, start);
  return days >= 0 ? Math.max(1, days) : 0;
};
