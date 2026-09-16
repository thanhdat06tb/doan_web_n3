// ═══════════════════════════════════════════════════════════════
// 🔐 Auth Middleware — JWT Authentication & Authorization
// Bảo vệ các routes cần đăng nhập / quyền admin
// ═══════════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');
const { ERROR_CODES } = require('../constants/errorCodes');
const { getDatabase } = require('../database/connection');

/**
 * Middleware xác thực JWT token
 * Đọc token từ header: Authorization: Bearer <token>
 * Gắn user info vào req.user nếu hợp lệ
 */
function authenticate(req, res, next) {
  try {
    // Lấy token từ Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        errorResponse(
          ERROR_CODES.UNAUTHORIZED.code,
          'Vui lòng đăng nhập. Header Authorization: Bearer <token> là bắt buộc.'
        )
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra user có tồn tại và active trong DB
    // (Không chỉ tin JWT — luôn verify với DB)
    const db = getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS invalidated_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_jti TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);

    if (decoded.jti) {
      db.prepare('DELETE FROM invalidated_tokens WHERE expires_at <= ?').run(new Date().toISOString());
      const invalidated = db
        .prepare('SELECT id FROM invalidated_tokens WHERE token_jti = ?')
        .get(decoded.jti);

      if (invalidated) {
        return res.status(401).json(
          errorResponse(ERROR_CODES.UNAUTHORIZED.code, 'Phiên đăng nhập đã được đăng xuất. Vui lòng đăng nhập lại.')
        );
      }
    }

    const user = db
      .prepare('SELECT id, full_name, email, role, is_active FROM users WHERE id = ?')
      .get(decoded.userId);

    if (!user) {
      return res.status(401).json(
        errorResponse(ERROR_CODES.USER_NOT_FOUND.code, 'Tài khoản không tồn tại.')
      );
    }

    if (!user.is_active) {
      return res.status(403).json(
        errorResponse(ERROR_CODES.FORBIDDEN.code, 'Tài khoản đã bị khóa.')
      );
    }

    // Gắn user info vào request để dùng ở các handler sau
    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        errorResponse(ERROR_CODES.UNAUTHORIZED.code, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      );
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        errorResponse(ERROR_CODES.UNAUTHORIZED.code, 'Token không hợp lệ.')
      );
    }
    return res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
}

/**
 * Middleware kiểm tra quyền Admin
 * PHẢI đặt SAU authenticate middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json(
      errorResponse(
        ERROR_CODES.FORBIDDEN.code,
        'Chức năng này chỉ dành cho quản trị viên.'
      )
    );
  }
  next();
}

module.exports = { authenticate, requireAdmin };
