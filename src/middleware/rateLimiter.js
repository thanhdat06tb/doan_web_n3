// ═══════════════════════════════════════════════════════════════
// 🚦 Rate Limiter — Giới hạn tần suất tạo đơn hàng
// In-memory, mỗi userId tối đa N đơn/phút
// ═══════════════════════════════════════════════════════════════

const { errorResponse } = require('../utils/responseHelper');
const { ERROR_CODES } = require('../constants/errorCodes');
const logger = require('../utils/logger');

// In-memory store: Map<userId, timestamp[]>
const orderTimestamps = new Map();

// Cấu hình
const MAX_ORDERS = parseInt(process.env.RATE_LIMIT_MAX_ORDERS) || 5;
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 phút

/**
 * Middleware rate limiting cho việc tạo đơn hàng
 * Mỗi userId chỉ được tạo tối đa MAX_ORDERS đơn trong WINDOW_MS ms
 */
function orderRateLimiter(req, res, next) {
  const userId = req.user?.id;
  if (!userId) return next(); // Nếu chưa authenticate thì skip (auth middleware sẽ bắt)

  const now = Date.now();

  // Lấy timestamps hiện tại của user, lọc bỏ các timestamp đã hết hạn
  let timestamps = orderTimestamps.get(userId) || [];
  timestamps = timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (timestamps.length >= MAX_ORDERS) {
    const oldestTs = timestamps[0];
    const retryAfterMs = WINDOW_MS - (now - oldestTs);
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);

    logger.warn('RATE_LIMIT_HIT', {
      userId,
      ordersInWindow: timestamps.length,
      retryAfterSec,
    });

    return res.status(429).json(
      errorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
        `Bạn đã tạo quá ${MAX_ORDERS} đơn trong 1 phút. Vui lòng thử lại sau ${retryAfterSec} giây.`,
        { retryAfterSec }
      )
    );
  }

  // Ghi nhận timestamp mới
  timestamps.push(now);
  orderTimestamps.set(userId, timestamps);

  next();
}

/**
 * Dọn dẹp timestamps hết hạn (chạy mỗi 5 phút)
 * Tránh memory leak cho long-running server
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of orderTimestamps.entries()) {
    const valid = timestamps.filter((ts) => now - ts < WINDOW_MS);
    if (valid.length === 0) {
      orderTimestamps.delete(userId);
    } else {
      orderTimestamps.set(userId, valid);
    }
  }
}, 5 * 60 * 1000);

if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

module.exports = { orderRateLimiter };
