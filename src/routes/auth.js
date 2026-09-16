// ═══════════════════════════════════════════════════════════════
// 🔐 Auth Routes — Đăng ký & Đăng nhập
// POST /api/auth/register | POST /api/auth/login
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const router = express.Router();

const { getDatabase } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { ERROR_CODES } = require('../constants/errorCodes');
const validateRequest = require('../middleware/validateRequest');
const { authenticate } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// ━━━ Zod Schemas ━━━

const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự.').max(100),
  email: z.string().email('Email không hợp lệ.'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại phải có 10 chữ số, bắt đầu bằng 0.'),
  address: z.string().max(500).optional().default(''),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(32, 'Refresh token không hợp lệ.'),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(32).optional(),
});

function ensureAuthTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      revoked_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invalidated_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_jti TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createAccessToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, jti },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  return { token, jti };
}

function createRefreshToken(db, userId) {
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).run(userId, hashToken(refreshToken), expiresAt);

  return refreshToken;
}

function buildAuthPayload(db, user) {
  ensureAuthTables(db);
  const { token } = createAccessToken(user);
  const refreshToken = createRefreshToken(db, user.id);
  return { token, refreshToken };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/auth/register — Đăng ký tài khoản mới
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/register', validateRequest({ body: registerSchema }), (req, res) => {
  try {
    const { fullName, email, phone, address, password } = req.body;
    const db = getDatabase();

    // Kiểm tra email đã tồn tại
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json(
        errorResponse(ERROR_CODES.EMAIL_EXISTS.code, ERROR_CODES.EMAIL_EXISTS.message)
      );
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const result = db
      .prepare(`
        INSERT INTO users (full_name, email, phone, address, password_hash, role)
        VALUES (?, ?, ?, ?, ?, 'CUSTOMER')
      `)
      .run(fullName, email, phone, address, passwordHash);

    const userId = Number(result.lastInsertRowid);

    const authPayload = buildAuthPayload(db, { id: userId, email, role: 'CUSTOMER' });

    logger.auth('REGISTER_SUCCESS', { userId, email });

    res.status(201).json(
      successResponse({
        user: { id: userId, fullName, email, phone, address, role: 'CUSTOMER' },
        ...authPayload,
      }, 'Đăng ký thành công!')
    );

  } catch (error) {
    logger.error('REGISTER_FAILED', { error: error.message });
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/auth/login — Đăng nhập
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/login', validateRequest({ body: loginSchema }), (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    // Tìm user theo email
    const user = db
      .prepare('SELECT id, full_name, email, phone, address, role, password_hash, is_active FROM users WHERE email = ?')
      .get(email);

    if (!user) {
      return res.status(401).json(
        errorResponse(ERROR_CODES.INVALID_CREDENTIALS.code, ERROR_CODES.INVALID_CREDENTIALS.message)
      );
    }

    // Kiểm tra account active
    if (!user.is_active) {
      return res.status(403).json(
        errorResponse(ERROR_CODES.FORBIDDEN.code, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.')
      );
    }

    // Kiểm tra password
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json(
        errorResponse(ERROR_CODES.INVALID_CREDENTIALS.code, ERROR_CODES.INVALID_CREDENTIALS.message)
      );
    }

    const authPayload = buildAuthPayload(db, { id: user.id, email: user.email, role: user.role });

    logger.auth('LOGIN_SUCCESS', { userId: user.id, email: user.email, role: user.role });

    res.json(
      successResponse({
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
        },
        ...authPayload,
      }, 'Đăng nhập thành công!')
    );

  } catch (error) {
    logger.error('LOGIN_FAILED', { error: error.message });
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

router.post('/refresh', validateRequest({ body: refreshSchema }), (req, res) => {
  try {
    const { refreshToken } = req.body;
    const db = getDatabase();
    ensureAuthTables(db);

    const tokenHash = hashToken(refreshToken);
    const session = db.prepare(`
      SELECT rt.*, u.id AS user_id, u.full_name, u.email, u.phone, u.address, u.role, u.is_active
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = ?
    `).get(tokenHash);

    if (!session || session.revoked_at || session.expires_at <= new Date().toISOString()) {
      return res.status(401).json(
        errorResponse(ERROR_CODES.UNAUTHORIZED.code, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.')
      );
    }

    if (!session.is_active) {
      return res.status(403).json(
        errorResponse(ERROR_CODES.FORBIDDEN.code, 'Tài khoản đã bị khóa.')
      );
    }

    const { token } = createAccessToken({
      id: session.user_id,
      email: session.email,
      role: session.role,
    });

    res.json(successResponse({
      token,
      user: {
        id: session.user_id,
        fullName: session.full_name,
        email: session.email,
        phone: session.phone,
        address: session.address,
        role: session.role,
      },
    }, 'Làm mới phiên đăng nhập thành công.'));
  } catch (error) {
    logger.error('REFRESH_FAILED', { error: error.message });
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

router.post('/logout', authenticate, validateRequest({ body: logoutSchema }), (req, res) => {
  try {
    const db = getDatabase();
    ensureAuthTables(db);

    if (req.body.refreshToken) {
      db.prepare(`
        UPDATE refresh_tokens
        SET revoked_at = datetime('now', 'localtime')
        WHERE token_hash = ? AND user_id = ?
      `).run(hashToken(req.body.refreshToken), req.user.id);
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.jti && decoded?.exp) {
        db.prepare(`
          INSERT OR IGNORE INTO invalidated_tokens (token_jti, expires_at)
          VALUES (?, ?)
        `).run(decoded.jti, new Date(decoded.exp * 1000).toISOString());
      }
    }

    logger.auth('LOGOUT_SUCCESS', { userId: req.user.id });
    res.json(successResponse({ success: true }, 'Đăng xuất thành công.'));
  } catch (error) {
    logger.error('LOGOUT_FAILED', { error: error.message });
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

module.exports = router;
