// ═══════════════════════════════════════════════════════════════
// 📅 Availability Service — Module Kiểm Tra Lịch (Phần A)
// Kiểm tra tình trạng khả dụng của sản phẩm cho thuê
// ═══════════════════════════════════════════════════════════════

const { getDatabase } = require('../database/connection');
const { ERROR_CODES } = require('../constants/errorCodes');
const {
  isValidDateString,
  isDateInPast,
  calculateDays,
  getDateRange,
  getTodayString,
  getDateAfterMonths,
} = require('../utils/dateUtils');

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * KIỂM TRA KHẢ DỤNG SẢN PHẨM CHO THUÊ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Kiểm tra xem sản phẩm có đủ số lượng cho thuê trong khoảng ngày chỉ định không.
 * Trả về: số lượng còn trống + danh sách ngày bị block (để FE vẽ Calendar)
 *
 * @param {number} productId - ID sản phẩm
 * @param {string} startDate - Ngày bắt đầu thuê (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc thuê (YYYY-MM-DD)
 * @param {number} quantityNeeded - Số lượng cần thuê
 * @returns {{ available: boolean, availableQty: number, conflictDates: string[] }}
 * @throws {{ code: string, message: string }} Nếu validation fail
 */
function checkProductAvailability(productId, startDate, endDate, quantityNeeded) {
  const db = getDatabase();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BƯỚC 1: INPUT VALIDATION (trước khi chạm DB)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 1a. Kiểm tra format ngày
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    throw {
      ...ERROR_CODES.INVALID_DATE_RANGE,
      message: 'Ngày bắt đầu và ngày kết thúc phải có định dạng YYYY-MM-DD hợp lệ.',
    };
  }

  // 1b. Kiểm tra ngày không nằm trong quá khứ
  if (isDateInPast(startDate)) {
    throw ERROR_CODES.PAST_DATE;
  }

  // 1c. Cho phép thuê trong cùng ngày, nhưng không cho endDate trước startDate
  const totalDays = calculateDays(startDate, endDate);
  if (totalDays < 0) {
    throw {
      ...ERROR_CODES.INVALID_DATE_RANGE,
      message: 'Ngày kết thúc không được trước ngày bắt đầu.',
    };
  }

  // 1d. Kiểm tra quantityNeeded hợp lệ
  if (!Number.isInteger(quantityNeeded) || quantityNeeded <= 0) {
    throw ERROR_CODES.INVALID_QUANTITY;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BƯỚC 2: KIỂM TRA SẢN PHẨM TRONG DB
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const product = db
    .prepare('SELECT id, name, price_rent_per_day, stock_quantity, is_active FROM products WHERE id = ?')
    .get(productId);

  // 2a. Sản phẩm có tồn tại không?
  if (!product) {
    throw ERROR_CODES.PRODUCT_NOT_FOUND;
  }

  // 2b. Sản phẩm có active không?
  if (!product.is_active) {
    throw ERROR_CODES.PRODUCT_INACTIVE;
  }

  // 2c. Sản phẩm có cho thuê không? (price_rent_per_day > 0)
  if (product.price_rent_per_day <= 0) {
    throw ERROR_CODES.PRODUCT_NOT_RENTABLE;
  }

  // 2d. Số lượng yêu cầu có vượt quá stock tối đa không?
  if (quantityNeeded > product.stock_quantity) {
    throw {
      ...ERROR_CODES.INSUFFICIENT_STOCK,
      message: `Sản phẩm "${product.name}" chỉ có ${product.stock_quantity} đơn vị. Bạn yêu cầu ${quantityNeeded}.`,
      details: { maxStock: product.stock_quantity, requested: quantityNeeded },
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BƯỚC 3: TRUY VẤN SỐ LƯỢNG ĐANG ĐƯỢC THUÊ (Overlap Logic)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Lấy tất cả order_details đang overlap với khoảng [startDate, endDate]
  // Điều kiện overlap: existing_start <= endDate AND existing_end >= startDate
  // Chỉ tính đơn APPROVED hoặc RENTING (đơn PENDING cũng nên tính để an toàn)
  const overlappingBookings = db
    .prepare(`
      SELECT 
        od.quantity,
        od.start_date,
        od.end_date
      FROM order_details od
      JOIN orders o ON od.order_id = o.id
      WHERE od.product_id = ?
        AND od.type = 'RENT'
        AND o.status IN ('APPROVED', 'RENTING')
        AND od.start_date <= ?
        AND od.end_date >= ?
    `)
    .all(productId, endDate, startDate);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BƯỚC 4: TÍNH SỐ LƯỢNG KHẢ DỤNG THEO TỪNG NGÀY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Với mỗi ngày trong khoảng thuê, tính xem có bao nhiêu đơn vị đang bị chiếm
  // Cách này chính xác hơn việc chỉ SUM tổng, vì các booking có thể overlap một phần
  const requestedDates = getDateRange(startDate, endDate);
  const conflictDates = [];
  let minAvailableQty = product.stock_quantity;

  for (const date of requestedDates) {
    // Đếm số lượng đang thuê VÀO ngày cụ thể này
    let bookedOnDate = 0;
    for (const booking of overlappingBookings) {
      // Booking overlap ngày này nếu: booking.start <= date <= booking.end
      if (booking.start_date <= date && booking.end_date >= date) {
        bookedOnDate += booking.quantity;
      }
    }

    const availableOnDate = product.stock_quantity - bookedOnDate;

    // Cập nhật min (availableQty là số tối thiểu trong toàn khoảng)
    if (availableOnDate < minAvailableQty) {
      minAvailableQty = availableOnDate;
    }

    // Nếu ngày này không đủ số lượng yêu cầu → thêm vào conflictDates
    if (availableOnDate < quantityNeeded) {
      conflictDates.push(date);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BƯỚC 5: TRẢ VỀ KẾT QUẢ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return {
    available: minAvailableQty >= quantityNeeded,
    availableQty: Math.max(0, minAvailableQty),
    conflictDates,
    totalDays,
    product: {
      id: product.id,
      name: product.name,
      priceRentPerDay: product.price_rent_per_day,
      stockQuantity: product.stock_quantity,
    },
  };
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * LẤY DANH SÁCH NGÀY BỊ BLOCK (cho Calendar FE)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Trả về mảng các ngày mà sản phẩm đã HỎNG TOÀN BỘ stock
 * (tất cả đơn vị đều đang được thuê) trong 3 tháng tới.
 * FE dùng để disable trên DatePicker.
 *
 * @param {number} productId
 * @param {number} [months=3] - Số tháng tới cần kiểm tra
 * @returns {{ blockedDates: string[] }}
 */
function getBlockedDates(productId, months = 3) {
  const db = getDatabase();

  // Kiểm tra sản phẩm tồn tại
  const product = db
    .prepare('SELECT id, stock_quantity, price_rent_per_day FROM products WHERE id = ? AND is_active = 1')
    .get(productId);

  if (!product) {
    throw ERROR_CODES.PRODUCT_NOT_FOUND;
  }

  if (product.price_rent_per_day <= 0) {
    // Sản phẩm chỉ bán → không có ngày bị block
    return { blockedDates: [] };
  }

  const today = getTodayString();
  const endDate = getDateAfterMonths(months);

  // Lấy tất cả bookings overlap với khoảng [today, endDate]
  const bookings = db
    .prepare(`
      SELECT od.quantity, od.start_date, od.end_date
      FROM order_details od
      JOIN orders o ON od.order_id = o.id
      WHERE od.product_id = ?
        AND od.type = 'RENT'
        AND o.status IN ('APPROVED', 'RENTING')
        AND od.start_date <= ?
        AND od.end_date >= ?
    `)
    .all(productId, endDate, today);

  // Duyệt từng ngày, tính số đơn vị bị chiếm
  const allDates = getDateRange(today, endDate);
  const blockedDates = [];

  for (const date of allDates) {
    let bookedOnDate = 0;
    for (const booking of bookings) {
      if (booking.start_date <= date && booking.end_date >= date) {
        bookedOnDate += booking.quantity;
      }
    }

    // Ngày bị block hoàn toàn = tất cả stock đã được thuê
    if (bookedOnDate >= product.stock_quantity) {
      blockedDates.push(date);
    }
  }

  return { blockedDates };
}

module.exports = { checkProductAvailability, getBlockedDates };
