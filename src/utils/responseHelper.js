// ═══════════════════════════════════════════════════════════════
// 📤 Response Helper — Format response nhất quán toàn dự án
// Mọi API response PHẢI đi qua các hàm này
// ═══════════════════════════════════════════════════════════════

/**
 * Tạo response thành công
 * @param {any} data - Dữ liệu trả về
 * @param {string} [message] - Thông báo kèm theo (optional)
 * @returns {{ success: true, data: any, message?: string }}
 * 
 * @example
 * res.json(successResponse({ available: true, availableQty: 3 }));
 * // → { success: true, data: { available: true, availableQty: 3 } }
 */
function successResponse(data, message = null) {
  const response = { success: true, data };
  if (message) response.message = message;
  return response;
}

/**
 * Tạo response lỗi
 * @param {string} code - Mã lỗi (VD: 'PRODUCT_NOT_FOUND')
 * @param {string} message - Thông báo lỗi thân thiện (tiếng Việt)
 * @param {any} [details] - Chi tiết lỗi bổ sung (optional)
 * @returns {{ success: false, error: { code, message, details? } }}
 * 
 * @example
 * res.status(404).json(errorResponse('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm'));
 * // → { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: '...' } }
 */
function errorResponse(code, message, details = null) {
  const response = {
    success: false,
    error: { code, message },
  };
  if (details) response.error.details = details;
  return response;
}

/**
 * Tạo response phân trang
 * @param {Array} items - Mảng dữ liệu
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số item mỗi trang
 * @param {number} totalItems - Tổng số item
 * @returns {{ success: true, data: { items, pagination } }}
 */
function paginatedResponse(items, page, limit, totalItems) {
  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1,
      },
    },
  };
}

module.exports = { successResponse, errorResponse, paginatedResponse };
