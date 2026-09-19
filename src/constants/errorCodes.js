// ═══════════════════════════════════════════════════════════════
// 📋 Error Codes — Mã lỗi chuẩn hóa toàn dự án
// Import: const { ERROR_CODES } = require('./errorCodes');
// ═══════════════════════════════════════════════════════════════

const ERROR_CODES = {
  // ━━━ Validation Errors ━━━
  INVALID_DATE_RANGE: {
    code: 'INVALID_DATE_RANGE',
    message: 'Khoảng ngày không hợp lệ. Ngày kết thúc không được trước ngày bắt đầu.',
    status: 400,
  },
  PAST_DATE: {
    code: 'PAST_DATE',
    message: 'Không thể đặt lịch trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.',
    status: 400,
  },
  INVALID_QUANTITY: {
    code: 'INVALID_QUANTITY',
    message: 'Số lượng không hợp lệ. Vui lòng nhập số nguyên dương.',
    status: 400,
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Dữ liệu đầu vào không hợp lệ.',
    status: 400,
  },

  // ━━━ Product Errors ━━━
  PRODUCT_NOT_FOUND: {
    code: 'PRODUCT_NOT_FOUND',
    message: 'Không tìm thấy sản phẩm.',
    status: 404,
  },
  PRODUCT_NOT_RENTABLE: {
    code: 'PRODUCT_NOT_RENTABLE',
    message: 'Sản phẩm này chỉ bán, không cho thuê.',
    status: 400,
  },
  PRODUCT_NOT_SELLABLE: {
    code: 'PRODUCT_NOT_SELLABLE',
    message: 'Sản phẩm này chỉ cho thuê, không bán.',
    status: 400,
  },
  PRODUCT_INACTIVE: {
    code: 'PRODUCT_INACTIVE',
    message: 'Sản phẩm này hiện không còn kinh doanh.',
    status: 400,
  },

  // ━━━ Stock / Availability Errors ━━━
  INSUFFICIENT_STOCK: {
    code: 'INSUFFICIENT_STOCK',
    message: 'Không đủ số lượng trong kho.',
    status: 409,
  },
  PRODUCT_UNAVAILABLE: {
    code: 'PRODUCT_UNAVAILABLE',
    message: 'Sản phẩm không khả dụng trong khoảng thời gian đã chọn.',
    status: 409,
  },

  // ━━━ Order Errors ━━━
  ORDER_NOT_FOUND: {
    code: 'ORDER_NOT_FOUND',
    message: 'Không tìm thấy đơn hàng.',
    status: 404,
  },
  ORDER_CONFLICT: {
    code: 'ORDER_CONFLICT',
    message: 'Một số sản phẩm trong giỏ hàng đã bị đặt trước. Vui lòng chọn ngày khác.',
    status: 409,
  },
  INVALID_STATUS_TRANSITION: {
    code: 'INVALID_STATUS_TRANSITION',
    message: 'Không thể chuyển trạng thái đơn hàng theo cách này.',
    status: 400,
  },
  EMPTY_CART: {
    code: 'EMPTY_CART',
    message: 'Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.',
    status: 400,
  },

  // ━━━ Auth Errors ━━━
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Vui lòng đăng nhập để tiếp tục.',
    status: 401,
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Bạn không có quyền thực hiện hành động này.',
    status: 403,
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Email hoặc mật khẩu không chính xác.',
    status: 401,
  },
  EMAIL_EXISTS: {
    code: 'EMAIL_EXISTS',
    message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.',
    status: 409,
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'Không tìm thấy người dùng.',
    status: 404,
  },

  // ━━━ Rate Limiting ━━━
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 1 phút.',
    status: 429,
  },

  // ━━━ Server Errors ━━━
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
    status: 500,
  },
  DATABASE_BUSY: {
    code: 'DATABASE_BUSY',
    message: 'Hệ thống đang bận. Vui lòng thử lại sau vài giây.',
    status: 503,
  },
};

// ━━━ Allowed Status Transitions (State Machine) ━━━
const VALID_STATUS_TRANSITIONS = {
  PENDING: ['APPROVED', 'CANCELLED'],
  APPROVED: ['RENTING', 'COMPLETED', 'CANCELLED'],
  RENTING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

// ━━━ Order Statuses ━━━
const ORDER_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  RENTING: 'RENTING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// ━━━ Transaction Types ━━━
const TRANSACTION_TYPE = {
  BUY: 'BUY',
  RENT: 'RENT',
};

module.exports = {
  ERROR_CODES,
  VALID_STATUS_TRANSITIONS,
  ORDER_STATUS,
  TRANSACTION_TYPE,
};
