// ═══════════════════════════════════════════════════════════════
// 📅 Date Utilities — Các hàm tiện ích xử lý ngày tháng
// Dùng xuyên suốt dự án, đặc biệt trong availability & order
// ═══════════════════════════════════════════════════════════════

/**
 * Kiểm tra string có phải định dạng ISO 8601 (YYYY-MM-DD) hợp lệ không
 * Không chỉ kiểm tra format mà còn kiểm tra ngày có thực sự tồn tại
 * (VD: 2025-02-30 sẽ fail vì tháng 2 không có ngày 30)
 *
 * @param {string} dateStr - Chuỗi ngày cần kiểm tra
 * @returns {boolean}
 */
function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;

  // Kiểm tra format YYYY-MM-DD bằng regex
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  // Kiểm tra ngày có thực sự tồn tại không
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return false;

  // Đảm bảo parse ngược lại khớp (tránh lỗi Feb 30 → Mar 2)
  const [year, month, day] = dateStr.split('-').map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

/**
 * Kiểm tra ngày có nằm trong quá khứ không (so với ngày hôm nay)
 * Chỉ so sánh phần date, bỏ qua time
 *
 * @param {string} dateStr - Chuỗi ngày YYYY-MM-DD
 * @returns {boolean} true nếu ngày trong quá khứ
 */
function isDateInPast(dateStr) {
  const today = getTodayString();
  return dateStr < today;
}

/**
 * Tính số ngày thuê theo ngày dương lịch.
 * VD: 2025-08-10 → 2025-08-13 = 3 ngày
 *     2025-08-10 → 2025-08-10 = 1 ngày
 *
 * @param {string} startDate - Ngày bắt đầu YYYY-MM-DD
 * @param {string} endDate - Ngày kết thúc YYYY-MM-DD
 * @returns {number} Số ngày
 */
function calculateDays(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? Math.max(1, diffDays) : diffDays;
}

/**
 * Lấy mảng tất cả các ngày trong khoảng [startDate, endDate]
 * Bao gồm cả ngày đầu và ngày cuối
 *
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {string[]} Mảng các ngày YYYY-MM-DD
 *
 * @example
 * getDateRange('2025-08-10', '2025-08-13')
 * // → ['2025-08-10', '2025-08-11', '2025-08-12', '2025-08-13']
 */
function getDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Format Date object thành chuỗi YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Lấy ngày hôm nay dưới dạng YYYY-MM-DD
 * @returns {string}
 */
function getTodayString() {
  return formatDate(new Date());
}

/**
 * Lấy ngày sau N tháng kể từ hôm nay
 * @param {number} months - Số tháng
 * @returns {string} YYYY-MM-DD
 */
function getDateAfterMonths(months) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return formatDate(date);
}

/**
 * Format số tiền theo VND
 * @param {number} amount - Số tiền
 * @returns {string} VD: "1.500.000đ"
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

module.exports = {
  isValidDateString,
  isDateInPast,
  calculateDays,
  getDateRange,
  formatDate,
  getTodayString,
  getDateAfterMonths,
  formatCurrency,
};
